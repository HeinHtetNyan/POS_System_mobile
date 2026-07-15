import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/pos_repository.dart';
import '../../../core/api/api_client.dart';
import '../../../core/storage/offline_queue.dart';
import '../../../models/product_model.dart';
import '../../../models/cart_model.dart';
import '../../../models/order_model.dart';
import '../../../models/customer_model.dart';


// POS Cart State
class PosCartState {
  final List<LocalCartItem> items;
  final CustomerModel? customer;
  final String? serverCartId;
  final bool isSyncing;
  final bool isCheckingOut;
  final String? error;
  final OrderModel? lastCompletedOrder;
  // Order-level discount
  final String? orderDiscountType; // 'PERCENT' | 'AMOUNT'
  final double orderDiscountValue;

  const PosCartState({
    this.items = const [],
    this.customer,
    this.serverCartId,
    this.isSyncing = false,
    this.isCheckingOut = false,
    this.error,
    this.lastCompletedOrder,
    this.orderDiscountType,
    this.orderDiscountValue = 0,
  });

  double get subtotal =>
      items.fold(0, (sum, i) => sum + i.lineSubtotal);
  double get taxTotal =>
      items.fold(0, (sum, i) => sum + i.taxAmount);
  double get lineDiscountTotal =>
      items.fold(0, (sum, i) => sum + i.discountAmount * i.quantity);
  double get orderDiscountAmount {
    if (orderDiscountType == null || orderDiscountValue <= 0) return 0;
    if (orderDiscountType == 'PERCENT') {
      return (subtotal - lineDiscountTotal) * orderDiscountValue / 100;
    }
    return orderDiscountValue.clamp(0, subtotal - lineDiscountTotal);
  }
  double get discountTotal => lineDiscountTotal + orderDiscountAmount;
  // Summed from each line's own gross total rather than subtotal+tax-discount:
  // for tax-inclusive items, lineTotal already excludes double-adding tax
  // (see LocalCartItem.lineTotal), matching the web app's useCartTotals().
  double get total =>
      (items.fold(0.0, (sum, i) => sum + i.lineTotal) - discountTotal)
          .clamp(0, double.infinity);

  // All items share the same tenant-wide rate (see PosCartNotifier.configureTax).
  bool get _cartTaxInclusive => items.isNotEmpty && items.first.taxInclusive;
  double get _cartTaxRate => items.isNotEmpty ? items.first.taxRate : 0;

  // Order-level discount converted onto the same net (pre-tax) basis as each
  // item's netUnitPrice/netDiscountAmount, so the backend isn't discounting a
  // net subtotal by a gross-priced amount — mirrors web's PaymentOverlay.
  double get orderDiscountAmountNet => _cartTaxInclusive
      ? orderDiscountAmount / (1 + _cartTaxRate)
      : orderDiscountAmount;
  int get itemCount =>
      items.fold(0, (sum, i) => sum + i.quantity);
  bool get isEmpty => items.isEmpty;

  PosCartState copyWith({
    List<LocalCartItem>? items,
    CustomerModel? customer,
    bool clearCustomer = false,
    String? serverCartId,
    bool clearCartId = false,
    bool? isSyncing,
    bool? isCheckingOut,
    String? error,
    bool clearError = false,
    OrderModel? lastCompletedOrder,
    bool clearLastOrder = false,
    Object? orderDiscountType = _posSentinel,
    double? orderDiscountValue,
  }) {
    return PosCartState(
      items: items ?? this.items,
      customer: clearCustomer ? null : customer ?? this.customer,
      serverCartId:
          clearCartId ? null : serverCartId ?? this.serverCartId,
      isSyncing: isSyncing ?? this.isSyncing,
      isCheckingOut: isCheckingOut ?? this.isCheckingOut,
      error: clearError ? null : error ?? this.error,
      lastCompletedOrder: clearLastOrder
          ? null
          : lastCompletedOrder ?? this.lastCompletedOrder,
      orderDiscountType: orderDiscountType == _posSentinel
          ? this.orderDiscountType
          : orderDiscountType as String?,
      orderDiscountValue: orderDiscountValue ?? this.orderDiscountValue,
    );
  }
}

const _posSentinel = Object();

class PosCartNotifier extends StateNotifier<PosCartState> {
  final PosRepository _repo;
  final String _branchId;
  final String _sessionId;

  // Tenant-wide Tax Settings (uniform rate applied to the whole cart) — the
  // same source and formula the web app's useCartTotals() uses. Deliberately
  // NOT product.taxRate: that field is a per-product percentage the checkout
  // flow never applied, and its units don't even match what the cart/order
  // API expects (a 0-1 fraction), so it silently produced ~0 tax.
  double _taxRate = 0; // fraction 0-1
  bool _taxInclusive = false;

  // Generated once per checkout attempt and reused for every retry (the
  // initial network-dropped attempt and any offline sync-queue replay), so
  // the backend recognizes a resubmission and returns the original order
  // instead of creating a duplicate — same idea as web's PaymentOverlay.
  String? _idempotencyKey;

  String _generateIdempotencyKey() {
    final rand = (DateTime.now().microsecondsSinceEpoch % 1000000).toString();
    return 'chk-${DateTime.now().millisecondsSinceEpoch}-$rand';
  }

  List<CheckoutItemPayload> _buildCheckoutItems() => state.items
      .map((i) => CheckoutItemPayload(
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            unitPrice: i.netUnitPrice,
            discountAmount: i.netDiscountAmount,
            taxRate: i.taxRate,
          ))
      .toList();

  PosCartNotifier(this._repo, this._branchId, this._sessionId)
      : super(const PosCartState());

  // Called whenever tenant settings load/change (see PosScreen). Re-prices
  // any items already in the cart so an in-progress sale reflects the
  // current rate instead of whatever was active when each item was added.
  void configureTax({required double taxRate, required bool taxInclusive}) {
    _taxRate = taxRate;
    _taxInclusive = taxInclusive;
    if (state.items.isEmpty) return;
    final updated = state.items
        .map((i) => LocalCartItem(
              productId: i.productId,
              productName: i.productName,
              variantId: i.variantId,
              variantName: i.variantName,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discountAmount: i.discountAmount,
              taxRate: _taxRate,
              taxInclusive: _taxInclusive,
              sku: i.sku,
              barcode: i.barcode,
            ))
        .toList();
    state = state.copyWith(items: updated);
  }

  void addItem(ProductModel product, {ProductVariantModel? variant}) {
    final key = variant?.id ?? product.id;
    final existingIndex =
        state.items.indexWhere((i) => i.key == key);

    if (existingIndex >= 0) {
      final updated = List<LocalCartItem>.from(state.items);
      updated[existingIndex].quantity++;
      state = state.copyWith(items: updated);
    } else {
      final newItem = LocalCartItem(
        productId: product.id,
        productName: product.name,
        variantId: variant?.id,
        variantName: variant?.name,
        quantity: 1,
        unitPrice: variant?.sellingPrice ?? product.sellingPrice,
        discountAmount: 0,
        taxRate: _taxRate,
        taxInclusive: _taxInclusive,
        sku: variant?.sku ?? product.sku,
        barcode: variant?.barcode ?? product.barcode,
      );
      state = state.copyWith(items: [...state.items, newItem]);
    }
  }

  void removeItem(String key) {
    final updated = state.items.where((i) => i.key != key).toList();
    state = state.copyWith(items: updated);
  }

  void incrementItem(String key) {
    final updated = List<LocalCartItem>.from(state.items);
    final idx = updated.indexWhere((i) => i.key == key);
    if (idx >= 0) updated[idx].quantity++;
    state = state.copyWith(items: updated);
  }

  void decrementItem(String key) {
    final updated = List<LocalCartItem>.from(state.items);
    final idx = updated.indexWhere((i) => i.key == key);
    if (idx >= 0) {
      if (updated[idx].quantity <= 1) {
        updated.removeAt(idx);
      } else {
        updated[idx].quantity--;
      }
    }
    state = state.copyWith(items: updated);
  }

  void setDiscount(String key, double discount) {
    final updated = List<LocalCartItem>.from(state.items);
    final idx = updated.indexWhere((i) => i.key == key);
    if (idx >= 0) updated[idx].discountAmount = discount;
    state = state.copyWith(items: updated);
  }

  void setOrderDiscount(String type, double value) {
    state = state.copyWith(
      orderDiscountType: value > 0 ? type : null,
      orderDiscountValue: value,
    );
  }

  void clearOrderDiscount() {
    state = state.copyWith(
      orderDiscountType: null,
      orderDiscountValue: 0,
    );
  }

  void setCustomer(CustomerModel? customer) {
    if (customer == null) {
      state = state.copyWith(clearCustomer: true);
    } else {
      state = state.copyWith(customer: customer);
    }
  }

  void clearCart() {
    state = const PosCartState();
    _idempotencyKey = null;
  }

  // Single transactional checkout call — POST /sales/checkout takes the
  // cart's line items directly (see PosRepository.checkout for why: it's
  // an all-or-nothing transaction, not a cart_id reference).
  Future<OrderModel?> checkout(
      List<CheckoutPayment> payments) async {
    if (state.items.isEmpty) return null;

    state = state.copyWith(isCheckingOut: true, clearError: true);
    try {
      final order = await _repo.checkout(
        cashierSessionId: _sessionId,
        items: _buildCheckoutItems(),
        payments: payments,
        customerId: state.customer?.id,
        discountAmount: state.orderDiscountAmountNet,
        idempotencyKey: _idempotencyKey ??= _generateIdempotencyKey(),
      );

      state = PosCartState(lastCompletedOrder: order);
      _idempotencyKey = null;
      return order;
    } catch (e) {
      // Network error (no HTTP status code) → save locally for offline sync
      final isNetworkError = e is AppException && e.statusCode == null;
      if (isNetworkError) {
        await offlineQueueService.enqueue(
          branchId: _branchId,
          sessionId: _sessionId,
          customerId: state.customer?.id,
          items: state.items,
          payments: payments,
          discountAmount: state.orderDiscountAmountNet,
          idempotencyKey: _idempotencyKey ??= _generateIdempotencyKey(),
        );
        final pending = offlineQueueService.pendingCount.value;
        state = state.copyWith(
          isCheckingOut: false,
          error:
              'No connection — order queued for offline sync ($pending pending).',
        );
      } else {
        state = state.copyWith(
            isCheckingOut: false, error: e.toString());
      }
      return null;
    }
  }

  void clearLastOrder() =>
      state = state.copyWith(clearLastOrder: true);
  void clearError() => state = state.copyWith(clearError: true);
}

// Product List State
class ProductListState {
  final List<ProductModel> products;
  final bool isLoading;
  final bool hasMore;
  final String? error;
  final String search;
  final String? categoryId;
  final int page;

  const ProductListState({
    this.products = const [],
    this.isLoading = false,
    this.hasMore = true,
    this.error,
    this.search = '',
    this.categoryId,
    this.page = 1,
  });

  ProductListState copyWith({
    List<ProductModel>? products,
    bool? isLoading,
    bool? hasMore,
    String? error,
    bool clearError = false,
    String? search,
    String? categoryId,
    bool clearCategory = false,
    int? page,
  }) {
    return ProductListState(
      products: products ?? this.products,
      isLoading: isLoading ?? this.isLoading,
      hasMore: hasMore ?? this.hasMore,
      error: clearError ? null : error ?? this.error,
      search: search ?? this.search,
      categoryId:
          clearCategory ? null : categoryId ?? this.categoryId,
      page: page ?? this.page,
    );
  }
}

class ProductListNotifier extends StateNotifier<ProductListState> {
  final PosRepository _repo;
  final String? _branchId;

  ProductListNotifier(this._repo, this._branchId)
      : super(const ProductListState()) {
    loadProducts();
  }

  Future<void> loadProducts({bool refresh = false}) async {
    if (state.isLoading) return;
    final page = refresh ? 1 : state.page;
    state = state.copyWith(isLoading: true, clearError: true,
        page: page,
        products: refresh ? [] : state.products);
    try {
      final result = await _repo.getProducts(
        branchId: _branchId,
        search: state.search.isEmpty ? null : state.search,
        categoryId: state.categoryId,
        page: page,
      );
      state = state.copyWith(
        products: refresh
            ? result.items
            : [...state.products, ...result.items],
        isLoading: false,
        hasMore: result.hasMore,
        page: page + 1,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> search(String query) async {
    state = state.copyWith(
        search: query, products: [], page: 1, hasMore: true);
    await loadProducts(refresh: true);
  }

  Future<void> filterByCategory(String? categoryId) async {
    state = state.copyWith(
      categoryId: categoryId,
      clearCategory: categoryId == null,
      products: [],
      page: 1,
      hasMore: true,
    );
    await loadProducts(refresh: true);
  }
}

// Providers
final posRepositoryProvider = Provider((ref) => PosRepository());

// Cart provider — parameterized by branchId + sessionId
final posCartProvider = StateNotifierProvider.family<PosCartNotifier,
    PosCartState, ({String branchId, String sessionId})>((ref, params) {
  return PosCartNotifier(
    ref.watch(posRepositoryProvider),
    params.branchId,
    params.sessionId,
  );
});

// Product list provider — parameterized by branchId
final productListProvider = StateNotifierProvider.family<
    ProductListNotifier, ProductListState, String?>((ref, branchId) {
  return ProductListNotifier(ref.watch(posRepositoryProvider), branchId);
});
