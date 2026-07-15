import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/tenant_settings_provider.dart';
import 'translations.dart';

/// Locale is tenant-wide (set in Business Settings → Language), exactly like
/// web's TenantFormatterSync: it drives both formatting and translated UI
/// text, and — like web, whose useLocaleStore has no persistence — defaults
/// to English until the tenant settings fetch completes (there's no tenant
/// context yet on the login screen).
final localeProvider = Provider<String>((ref) {
  return ref.watch(tenantSettingsProvider).valueOrNull?.locale ?? 'en-US';
});

typedef Translate = String Function(String key);

final translateProvider = Provider<Translate>((ref) {
  final locale = ref.watch(localeProvider);
  final lang = locale == 'my-MM' ? 'my' : 'en';
  final dict = kTranslations[lang] ?? kTranslations['en']!;
  final fallback = kTranslations['en']!;
  return (key) => dict[key] ?? fallback[key] ?? key;
});
