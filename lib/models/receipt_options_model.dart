// Device/printer-local receipt display options — these are genuinely
// per-device (which thermal printer is attached, its paper width) rather
// than tenant-wide, so unlike header/footer/show_tax_on_receipt (which sync
// through TenantSettingsModel/extra_settings to match web) these stay in
// SharedPreferences per install.
class ReceiptOptions {
  final bool showLogo;
  final bool showOrderNumber;
  final bool showCashierName;
  final bool showBarcode;
  final bool showItemTax;
  final bool showCostPrice;
  final bool showMargin;
  final String paperSize; // '58mm' | '80mm' | 'A4'
  final String fontSize; // 'small' | 'medium' | 'large'
  final String? logoPath; // local image, used only for the in-app preview

  const ReceiptOptions({
    required this.showLogo,
    required this.showOrderNumber,
    required this.showCashierName,
    required this.showBarcode,
    required this.showItemTax,
    required this.showCostPrice,
    required this.showMargin,
    required this.paperSize,
    required this.fontSize,
    this.logoPath,
  });

  static const defaults = ReceiptOptions(
    showLogo: true,
    showOrderNumber: true,
    showCashierName: true,
    showBarcode: false,
    showItemTax: false,
    showCostPrice: false,
    showMargin: false,
    paperSize: '80mm',
    fontSize: 'medium',
    logoPath: null,
  );

  ReceiptOptions copyWith({
    bool? showLogo,
    bool? showOrderNumber,
    bool? showCashierName,
    bool? showBarcode,
    bool? showItemTax,
    bool? showCostPrice,
    bool? showMargin,
    String? paperSize,
    String? fontSize,
    String? logoPath,
    bool clearLogoPath = false,
  }) {
    return ReceiptOptions(
      showLogo: showLogo ?? this.showLogo,
      showOrderNumber: showOrderNumber ?? this.showOrderNumber,
      showCashierName: showCashierName ?? this.showCashierName,
      showBarcode: showBarcode ?? this.showBarcode,
      showItemTax: showItemTax ?? this.showItemTax,
      showCostPrice: showCostPrice ?? this.showCostPrice,
      showMargin: showMargin ?? this.showMargin,
      paperSize: paperSize ?? this.paperSize,
      fontSize: fontSize ?? this.fontSize,
      logoPath: clearLogoPath ? null : logoPath ?? this.logoPath,
    );
  }

  Map<String, dynamic> toJson() => {
        'show_logo': showLogo,
        'show_order_number': showOrderNumber,
        'show_cashier_name': showCashierName,
        'show_barcode': showBarcode,
        'show_item_tax': showItemTax,
        'show_cost_price': showCostPrice,
        'show_margin': showMargin,
        'paper_size': paperSize,
        'font_size': fontSize,
        'logo_path': logoPath,
      };

  factory ReceiptOptions.fromJson(Map<String, dynamic> json) => ReceiptOptions(
        showLogo: json['show_logo'] as bool? ?? true,
        showOrderNumber: json['show_order_number'] as bool? ?? true,
        showCashierName: json['show_cashier_name'] as bool? ?? true,
        showBarcode: json['show_barcode'] as bool? ?? false,
        showItemTax: json['show_item_tax'] as bool? ?? false,
        showCostPrice: json['show_cost_price'] as bool? ?? false,
        showMargin: json['show_margin'] as bool? ?? false,
        paperSize: json['paper_size'] as String? ?? '80mm',
        fontSize: json['font_size'] as String? ?? 'medium',
        logoPath: json['logo_path'] as String?,
      );
}
