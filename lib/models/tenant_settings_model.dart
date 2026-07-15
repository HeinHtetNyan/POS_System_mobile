// Merged view of GET /tenants/{id} (business profile fields) and
// GET /tenants/{id}/settings (tax/receipt/preference fields) — mirrors the
// web app's split between `Tenant` and `TenantSettings` (extra_settings JSONB),
// so both clients read/write the exact same backend keys and stay in sync.
class TenantSettingsModel {
  final String tenantId;

  // From Tenant (business_settings_screen.dart also edits name/phone/etc.)
  final String businessName;
  final String currency;
  final String locale;
  final String timezone;

  // From TenantSettings
  final double? taxRate; // 0-100, null/0 = disabled (matches web: enabled = rate > 0)
  final bool taxInclusive;
  final String taxName;
  final Map<String, bool> featuresEnabled;
  final Map<String, dynamic> extraSettings;

  // extra_settings keys used by both web and mobile
  final String? receiptHeader;
  final String? receiptFooter;
  final bool showTaxOnReceipt;
  final bool autoPrintReceipt;
  final String defaultPaymentMethod; // CASH | CARD
  final String? receiptLogoUrl;

  const TenantSettingsModel({
    required this.tenantId,
    required this.businessName,
    required this.currency,
    required this.locale,
    required this.timezone,
    required this.taxRate,
    required this.taxInclusive,
    required this.taxName,
    required this.featuresEnabled,
    required this.extraSettings,
    required this.receiptHeader,
    required this.receiptFooter,
    required this.showTaxOnReceipt,
    required this.autoPrintReceipt,
    required this.defaultPaymentMethod,
    required this.receiptLogoUrl,
  });

  bool get taxEnabled => taxRate != null && taxRate! > 0;
  bool get hasLogo => receiptLogoUrl != null && receiptLogoUrl!.isNotEmpty;

  /// Currency label shown to users — mirrors web's TenantFormatterSync,
  /// which renders MMK as "Kyats" (en) / "ကျပ်" (my-MM) instead of the raw code.
  String get displayCurrency {
    if (currency == 'MMK') {
      return locale == 'my-MM' ? 'ကျပ်' : 'Kyats';
    }
    return currency;
  }

  factory TenantSettingsModel.merge({
    required String tenantId,
    required Map<String, dynamic> tenantJson,
    required Map<String, dynamic> settingsJson,
  }) {
    final extra = (settingsJson['extra_settings'] as Map<String, dynamic>?) ?? {};
    final features = (settingsJson['features_enabled'] as Map<String, dynamic>?) ?? {};
    return TenantSettingsModel(
      tenantId: tenantId,
      businessName: tenantJson['name'] as String? ?? 'SawYun POS',
      currency: tenantJson['currency'] as String? ?? 'MMK',
      locale: tenantJson['locale'] as String? ?? 'en-US',
      timezone: tenantJson['timezone'] as String? ?? 'UTC',
      taxRate: (settingsJson['tax_rate'] as num?)?.toDouble(),
      taxInclusive: settingsJson['tax_inclusive'] as bool? ?? false,
      taxName: (extra['tax_name'] as String?) ?? 'Tax',
      featuresEnabled: features.map((k, v) => MapEntry(k, v as bool? ?? false)),
      extraSettings: extra,
      receiptHeader: extra['receipt_header'] as String?,
      receiptFooter: extra['receipt_footer'] as String?,
      showTaxOnReceipt: (extra['show_tax_on_receipt'] as bool?) ?? true,
      autoPrintReceipt: (extra['auto_print_receipt'] as bool?) ?? false,
      defaultPaymentMethod:
          (extra['default_payment_method'] as String?)?.toUpperCase() ?? 'CASH',
      receiptLogoUrl: extra['receipt_logo_url'] as String?,
    );
  }
}
