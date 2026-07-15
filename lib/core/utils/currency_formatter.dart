import 'package:intl/intl.dart';

/// Tenant-aware currency formatting. `configure()` is called by
/// [TenantSettingsNotifier] whenever tenant settings load, so every screen
/// that calls [format]/[formatCompact]/[formatWithDecimal] without an
/// explicit `currency` automatically reflects the business's actual
/// currency — the same single source of truth (`Tenant.currency`) the web
/// app's `TenantFormatterSync` derives its formatting from. Until the first
/// tenant fetch completes (e.g. on the login screen) this falls back to the
/// same 'MMK' default the app always used.
class CurrencyFormatter {
  static String _currency = 'MMK';
  static String _displayCurrency = 'Kyats';
  static String _localeTag = 'en_US';

  static void configure({
    required String currency,
    required String displayCurrency,
    required String locale,
  }) {
    _currency = currency;
    _displayCurrency = displayCurrency;
    // Dart's intl expects underscore-separated tags (en_US), tenant locale
    // uses hyphens (en-US) like the web app's BCP-47 values.
    _localeTag = locale.replaceAll('-', '_');
  }

  static String get currentCurrency => _currency;
  static String get currentDisplayCurrency => _displayCurrency;

  static NumberFormat get _formatter {
    try {
      return NumberFormat('#,##0', _localeTag);
    } catch (_) {
      return NumberFormat('#,##0', 'en_US');
    }
  }

  static NumberFormat get _decimalFormatter {
    try {
      return NumberFormat('#,##0.##', _localeTag);
    } catch (_) {
      return NumberFormat('#,##0.##', 'en_US');
    }
  }

  // Matches web's `fmt()` token order: amount, then currency label.
  static String format(double amount, {String? currency}) {
    final label = currency ?? _displayCurrency;
    return '${_formatter.format(amount)} $label';
  }

  static String formatCompact(double amount) {
    return _formatter.format(amount);
  }

  static String formatWithDecimal(double amount, {String? currency}) {
    final label = currency ?? _displayCurrency;
    return '${_decimalFormatter.format(amount)} $label';
  }
}
