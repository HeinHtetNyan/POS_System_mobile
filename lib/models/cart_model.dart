class CartModel {
  final String id;
  final String branchId;
  final String? cashierSessionId;
  final String? customerId;
  final String? customerName;
  final List<CartItemModel> items;
  final String? notes;

  const CartModel({
    required this.id,
    required this.branchId,
    this.cashierSessionId,
    this.customerId,
    this.customerName,
    required this.items,
    this.notes,
  });

  double get subtotal =>
      items.fold(0, (sum, item) => sum + item.lineTotal);

  double get taxTotal =>
      items.fold(0, (sum, item) => sum + item.taxAmount);

  double get discountTotal =>
      items.fold(0, (sum, item) => sum + (item.discountAmount * item.quantity));

  double get total => subtotal + taxTotal - discountTotal;

  int get itemCount => items.fold(0, (sum, item) => sum + item.quantity);

  factory CartModel.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    return CartModel(
      id: json['id'] as String,
      branchId: json['branch_id'] as String,
      cashierSessionId: json['cashier_session_id'] as String?,
      customerId: json['customer_id'] as String?,
      customerName: json['customer_name'] as String?,
      items: rawItems
          .map((e) => CartItemModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      notes: json['notes'] as String?,
    );
  }
}

class CartItemModel {
  final String id;
  final String productId;
  final String productName;
  final String? variantId;
  final String? variantName;
  final int quantity;
  final double unitPrice;
  final double discountAmount;
  // Fraction (0-1) — matches the backend's CartItemRequest/Response contract.
  final double taxRate;
  final String? sku;
  final String? barcode;

  const CartItemModel({
    required this.id,
    required this.productId,
    required this.productName,
    this.variantId,
    this.variantName,
    required this.quantity,
    required this.unitPrice,
    required this.discountAmount,
    required this.taxRate,
    this.sku,
    this.barcode,
  });

  double get lineSubtotal => unitPrice * quantity;
  double get taxAmount => lineSubtotal * taxRate;
  double get lineTotal => lineSubtotal + taxAmount;

  String get displayName =>
      variantName != null ? '$productName - $variantName' : productName;

  factory CartItemModel.fromJson(Map<String, dynamic> json) {
    return CartItemModel(
      id: json['id'] as String,
      productId: json['product_id'] as String,
      productName: json['product_name'] as String? ?? '',
      variantId: json['variant_id'] as String?,
      variantName: json['variant_name'] as String?,
      quantity: json['quantity'] as int? ?? 1,
      unitPrice: (json['unit_price'] as num?)?.toDouble() ?? 0.0,
      discountAmount:
          (json['discount_amount'] as num?)?.toDouble() ?? 0.0,
      taxRate: (json['tax_rate'] as num?)?.toDouble() ?? 0.0,
      sku: json['sku'] as String?,
      barcode: json['barcode'] as String?,
    );
  }

  CartItemModel copyWith({int? quantity, double? unitPrice, double? discountAmount}) {
    return CartItemModel(
      id: id,
      productId: productId,
      productName: productName,
      variantId: variantId,
      variantName: variantName,
      quantity: quantity ?? this.quantity,
      unitPrice: unitPrice ?? this.unitPrice,
      discountAmount: discountAmount ?? this.discountAmount,
      taxRate: taxRate,
      sku: sku,
      barcode: barcode,
    );
  }
}

// Local cart item before server sync
class LocalCartItem {
  final String productId;
  final String productName;
  final String? variantId;
  final String? variantName;
  int quantity;
  final double unitPrice;
  double discountAmount;
  // Fraction (0-1) — matches the backend's CartItemRequest/Response contract.
  // Set from the tenant's uniform Tax Settings rate (not per-product), same
  // as the web app's checkout math (see PosCartNotifier.configureTax).
  final double taxRate;
  // Whether taxRate is already baked into unitPrice (tenant Tax Settings
  // "inclusive" mode) — mirrors web's useCartTotals() inclusive/exclusive split.
  final bool taxInclusive;
  final String? sku;
  final String? barcode;

  LocalCartItem({
    required this.productId,
    required this.productName,
    this.variantId,
    this.variantName,
    required this.quantity,
    required this.unitPrice,
    required this.discountAmount,
    required this.taxRate,
    this.taxInclusive = false,
    this.sku,
    this.barcode,
  });

  double get lineSubtotal => unitPrice * quantity;

  // Exclusive: tax is added on top of the price.
  // Inclusive: tax is already baked into the price — extract it instead of adding it.
  double get taxAmount => taxInclusive
      ? lineSubtotal * taxRate / (1 + taxRate)
      : lineSubtotal * taxRate;

  // Gross total for this line — for inclusive tax the price already contains
  // the tax, so the line's total is just its subtotal.
  double get lineTotal => taxInclusive ? lineSubtotal : lineSubtotal + taxAmount;

  // Pre-tax unit price — what gets sent to the backend as `unit_price` so its
  // `price * tax_rate` formula yields the same extracted tax amount as above.
  double get netUnitPrice => taxInclusive ? unitPrice / (1 + taxRate) : unitPrice;

  // discountAmount is a per-unit reduction entered against the (possibly
  // gross) displayed price — convert it onto the same net basis as
  // netUnitPrice so the backend doesn't discount a net price by a gross amount.
  double get netDiscountAmount =>
      taxInclusive ? discountAmount / (1 + taxRate) : discountAmount;

  String get displayName =>
      variantName != null ? '$productName - $variantName' : productName;

  String get key => variantId ?? productId;

  Map<String, dynamic> toJson() => {
        'product_id': productId,
        'product_name': productName,
        if (variantId != null) 'variant_id': variantId,
        if (variantName != null) 'variant_name': variantName,
        'quantity': quantity,
        'unit_price': unitPrice,
        'discount_amount': discountAmount,
        'tax_rate': taxRate,
        'tax_inclusive': taxInclusive,
        if (sku != null) 'sku': sku,
        if (barcode != null) 'barcode': barcode,
      };

  factory LocalCartItem.fromJson(Map<String, dynamic> json) => LocalCartItem(
        productId: json['product_id'] as String,
        productName: json['product_name'] as String,
        variantId: json['variant_id'] as String?,
        variantName: json['variant_name'] as String?,
        quantity: json['quantity'] as int,
        unitPrice: (json['unit_price'] as num).toDouble(),
        discountAmount: (json['discount_amount'] as num).toDouble(),
        taxRate: (json['tax_rate'] as num).toDouble(),
        taxInclusive: json['tax_inclusive'] as bool? ?? false,
        sku: json['sku'] as String?,
        barcode: json['barcode'] as String?,
      );
}
