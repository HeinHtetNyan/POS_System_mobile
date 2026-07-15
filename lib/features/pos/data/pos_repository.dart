import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../models/product_model.dart';
import '../../../models/cart_model.dart';
import '../../../models/order_model.dart';
import '../../../models/customer_model.dart';
import '../../../models/pagination_model.dart';

class PosRepository {
  // Products
  Future<PaginatedResponse<ProductModel>> getProducts({
    String? branchId,
    String? search,
    String? categoryId,
    bool activeOnly = true,
    int page = 1,
    int pageSize = 50,
  }) async {
    try {
      final response = await apiClient.get(
        ApiEndpoints.products,
        params: {
          if (branchId != null) 'branch_id': branchId,
          if (search != null && search.isNotEmpty) 'search': search,
          if (categoryId != null) 'category_id': categoryId,
          if (activeOnly) 'is_active': true,
          'page': page,
          'page_size': pageSize,
        },
      );
      return PaginatedResponse.fromJson(
        response.data as Map<String, dynamic>,
        ProductModel.fromJson,
      );
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }

  Future<ProductModel?> findByBarcode(String barcode) async {
    try {
      final response = await apiClient.get(
        ApiEndpoints.products,
        params: {'barcode': barcode, 'is_active': true, 'page_size': 1},
      );
      final data = PaginatedResponse.fromJson(
        response.data as Map<String, dynamic>,
        ProductModel.fromJson,
      );
      return data.items.isNotEmpty ? data.items.first : null;
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }

  // Cart management
  Future<CartModel> createCart({
    required String branchId,
    required String cashierSessionId,
    String? customerId,
  }) async {
    try {
      final response = await apiClient.post(
        ApiEndpoints.carts,
        data: {
          'branch_id': branchId,
          'cashier_session_id': cashierSessionId,
          if (customerId != null) 'customer_id': customerId,
        },
      );
      return CartModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }

  Future<CartModel> addToCart({
    required String cartId,
    required String productId,
    String? variantId,
    required int quantity,
    double? unitPrice,
    double discountAmount = 0,
    double taxRate = 0,
  }) async {
    try {
      final response = await apiClient.post(
        ApiEndpoints.cartItems(cartId),
        data: {
          'product_id': productId,
          if (variantId != null) 'variant_id': variantId,
          'quantity': quantity,
          if (unitPrice != null) 'unit_price': unitPrice,
          'discount_amount': discountAmount,
          'tax_rate': taxRate,
        },
      );
      return CartModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }

  Future<CartModel> updateCartItem({
    required String cartId,
    required String itemId,
    int? quantity,
    double? unitPrice,
    double? discountAmount,
  }) async {
    try {
      final response = await apiClient.patch(
        ApiEndpoints.cartItem(cartId, itemId),
        data: {
          if (quantity != null) 'quantity': quantity,
          if (unitPrice != null) 'unit_price': unitPrice,
          if (discountAmount != null) 'discount_amount': discountAmount,
        },
      );
      return CartModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }

  Future<CartModel> removeFromCart({
    required String cartId,
    required String itemId,
  }) async {
    try {
      final response = await apiClient.delete(
        ApiEndpoints.cartItem(cartId, itemId),
      );
      return CartModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }

  Future<void> deleteCart(String cartId) async {
    try {
      await apiClient.delete(ApiEndpoints.cart(cartId));
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }

  // Checkout — POST /sales/checkout is transactional and ALL-OR-NOTHING
  // (creates the order, deducts stock, records payments, generates the
  // receipt in one DB transaction), so it takes the cart's line items
  // directly rather than a server-side cart_id. It does not accept
  // branch_id, cart_id, discount_type, or discount_value — only the fields
  // below (matching backend CheckoutRequest exactly).
  Future<OrderModel> checkout({
    required String cashierSessionId,
    required List<CheckoutItemPayload> items,
    required List<CheckoutPayment> payments,
    String? customerId,
    String? notes,
    double discountAmount = 0,
    String? idempotencyKey,
  }) async {
    try {
      final response = await apiClient.post(
        ApiEndpoints.checkout,
        data: {
          'cashier_session_id': cashierSessionId,
          'items': items.map((i) => i.toJson()).toList(),
          'payments': payments.map((p) => p.toJson()).toList(),
          if (customerId != null) 'customer_id': customerId,
          if (notes != null) 'notes': notes,
          if (discountAmount > 0) 'discount_amount': discountAmount,
          if (idempotencyKey != null) 'idempotency_key': idempotencyKey,
        },
      );
      return OrderModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }

  // Orders
  Future<PaginatedResponse<OrderModel>> getOrders({
    String? branchId,
    String? cashierSessionId,
    String? orderStatus,
    DateTime? dateFrom,
    DateTime? dateTo,
    int page = 1,
    int pageSize = 20,
  }) async {
    try {
      final response = await apiClient.get(
        ApiEndpoints.orders,
        params: {
          if (branchId != null) 'branch_id': branchId,
          if (cashierSessionId != null)
            'cashier_session_id': cashierSessionId,
          if (orderStatus != null) 'order_status': orderStatus,
          if (dateFrom != null)
            'date_from': dateFrom.toIso8601String(),
          if (dateTo != null)
            'date_to': dateTo.toIso8601String(),
          'page': page,
          'page_size': pageSize,
        },
      );
      return PaginatedResponse.fromJson(
        response.data as Map<String, dynamic>,
        OrderModel.fromJson,
      );
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }

  Future<OrderModel> getOrder(String orderId) async {
    try {
      final response = await apiClient.get(ApiEndpoints.order(orderId));
      return OrderModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }

  // Customers (for attaching to sale)
  Future<List<CustomerModel>> searchCustomers(String query) async {
    try {
      final response = await apiClient.get(
        ApiEndpoints.customerSearch,
        params: {'q': query, 'page_size': 10},
      );
      final rawItems =
          (response.data['items'] as List<dynamic>?) ?? [];
      return rawItems
          .map((e) =>
              CustomerModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }
}

// Matches backend CheckoutItemRequest: product_id, quantity, unit_price
// (pre-tax), discount_amount (pre-tax), tax_rate (fraction 0-1).
class CheckoutItemPayload {
  final String productId;
  final String? variantId;
  final int quantity;
  final double unitPrice;
  final double discountAmount;
  final double taxRate;

  const CheckoutItemPayload({
    required this.productId,
    this.variantId,
    required this.quantity,
    required this.unitPrice,
    required this.discountAmount,
    required this.taxRate,
  });

  Map<String, dynamic> toJson() => {
        'product_id': productId,
        if (variantId != null) 'variant_id': variantId,
        'quantity': quantity,
        'unit_price': unitPrice,
        'discount_amount': discountAmount,
        'tax_rate': taxRate,
      };
}

class CheckoutPayment {
  final String paymentMethod;
  final double amount;
  final String? referenceNumber;
  final String? notes;

  const CheckoutPayment({
    required this.paymentMethod,
    required this.amount,
    this.referenceNumber,
    this.notes,
  });

  Map<String, dynamic> toJson() => {
        'payment_method': paymentMethod,
        'amount': amount,
        if (referenceNumber != null)
          'reference_number': referenceNumber,
        if (notes != null) 'notes': notes,
      };

  factory CheckoutPayment.fromJson(Map<String, dynamic> json) =>
      CheckoutPayment(
        paymentMethod: json['payment_method'] as String,
        amount: (json['amount'] as num).toDouble(),
        referenceNumber: json['reference_number'] as String?,
        notes: json['notes'] as String?,
      );
}
