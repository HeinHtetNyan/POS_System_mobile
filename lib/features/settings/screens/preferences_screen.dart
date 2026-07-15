import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/tenant_settings_provider.dart';
import '../../../core/utils/datetime_formatter.dart';
import '../../../core/utils/responsive.dart';
import '../../../models/tenant_settings_model.dart';

class PreferencesScreen extends ConsumerStatefulWidget {
  const PreferencesScreen({super.key});

  @override
  ConsumerState<PreferencesScreen> createState() => _PreferencesScreenState();
}

class _PreferencesScreenState extends ConsumerState<PreferencesScreen> {
  static const _prefsKey = 'user_preferences';

  bool _localLoading = true;
  bool _saving = false;
  bool _initializedFromTenant = false;

  // Genuinely device/user-local — matches how web keeps time-format
  // client-only (usePreferencesStore) rather than syncing it tenant-wide.
  String _dateFormat = 'DD/MM/YYYY';
  bool _use24HourTime = false;

  // Tenant-wide — synced through TenantSettingsModel/extra_settings so they
  // match web's Preferences page exactly (same two fields, same keys).
  String _defaultPayment = 'CASH';
  bool _autoPrintReceipt = false;

  @override
  void initState() {
    super.initState();
    _loadLocal();
  }

  Future<void> _loadLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _dateFormat = prefs.getString('${_prefsKey}_date_format') ?? 'DD/MM/YYYY';
      _use24HourTime = prefs.getBool('${_prefsKey}_use_24h') ?? false;
    } catch (_) {
      // Use defaults
    } finally {
      if (mounted) setState(() => _localLoading = false);
    }
  }

  Future<void> _saveLocal() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('${_prefsKey}_date_format', _dateFormat);
    await prefs.setBool('${_prefsKey}_use_24h', _use24HourTime);
    DateTimeFormatter.configure(dateFormat: _dateFormat, use24Hour: _use24HourTime);
  }

  void _hydrateFromTenant(TenantSettingsModel settings) {
    if (_initializedFromTenant) return;
    _initializedFromTenant = true;
    _defaultPayment = settings.defaultPaymentMethod;
    _autoPrintReceipt = settings.autoPrintReceipt;
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await _saveLocal();
      await ref.read(tenantSettingsProvider.notifier).updateCheckoutPreferences(
            autoPrintReceipt: _autoPrintReceipt,
            defaultPaymentMethod: _defaultPayment,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Preferences saved'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tenantAsync = ref.watch(tenantSettingsProvider);
    tenantAsync.whenData((s) {
      if (s != null) _hydrateFromTenant(s);
    });
    final tenantSettings = tenantAsync.valueOrNull;
    final loading = _localLoading || (tenantAsync.isLoading && !_initializedFromTenant);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: const Text('Preferences',
            style: TextStyle(color: AppColors.textPrimary)),
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: loading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary))
          : ContentWrapper(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Currency — tenant-wide, so it can't drift device-to-device
                  // or from what's printed on receipts / shown on web.
                  _sectionHeader('CURRENCY'),
                  const SizedBox(height: 8),
                  _card(
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.currency_exchange,
                          color: AppColors.primary),
                      title: Text(
                        '${tenantSettings?.displayCurrency ?? 'Kyats'} (${tenantSettings?.currency ?? 'MMK'})',
                        style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w600),
                      ),
                      subtitle: const Text(
                        'Set for the whole business in Business Settings',
                        style: TextStyle(
                            color: AppColors.textSecondary, fontSize: 12),
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Date/time display — device-local, like web's time-format setting
                  _sectionHeader('DATE & TIME DISPLAY'),
                  const SizedBox(height: 8),
                  _card(
                    child: Column(
                      children: [
                        RadioGroup<String>(
                          groupValue: _dateFormat,
                          onChanged: (v) => setState(() => _dateFormat = v!),
                          child: Column(
                            children: [
                              RadioListTile<String>(
                                contentPadding: EdgeInsets.zero,
                                title: const Text('DD/MM/YYYY',
                                    style: TextStyle(
                                        color: AppColors.textPrimary,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500)),
                                subtitle: const Text('e.g. 25/06/2026',
                                    style: TextStyle(
                                        color: AppColors.textSecondary,
                                        fontSize: 12)),
                                value: 'DD/MM/YYYY',
                                fillColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? AppColors.primary : AppColors.textSecondary),
                              ),
                              Divider(height: 1, color: AppColors.divider),
                              RadioListTile<String>(
                                contentPadding: EdgeInsets.zero,
                                title: const Text('MM/DD/YYYY',
                                    style: TextStyle(
                                        color: AppColors.textPrimary,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500)),
                                subtitle: const Text('e.g. 06/25/2026',
                                    style: TextStyle(
                                        color: AppColors.textSecondary,
                                        fontSize: 12)),
                                value: 'MM/DD/YYYY',
                                fillColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? AppColors.primary : AppColors.textSecondary),
                              ),
                              Divider(height: 1, color: AppColors.divider),
                              RadioListTile<String>(
                                contentPadding: EdgeInsets.zero,
                                title: const Text('YYYY-MM-DD',
                                    style: TextStyle(
                                        color: AppColors.textPrimary,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500)),
                                subtitle: const Text('e.g. 2026-06-25',
                                    style: TextStyle(
                                        color: AppColors.textSecondary,
                                        fontSize: 12)),
                                value: 'YYYY-MM-DD',
                                fillColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? AppColors.primary : AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                        const Divider(color: AppColors.divider, height: 1),
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('24-Hour Time',
                              style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500)),
                          subtitle: Text(
                              _use24HourTime ? 'e.g. 14:30' : 'e.g. 2:30 PM',
                              style: const TextStyle(
                                  color: AppColors.textSecondary, fontSize: 12)),
                          value: _use24HourTime,
                          onChanged: (v) => setState(() => _use24HourTime = v),
                          activeThumbColor: AppColors.primary,
                          activeTrackColor: AppColors.primary.withValues(alpha: 0.3),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),
                  _sectionHeader('CHECKOUT DEFAULTS'),
                  const SizedBox(height: 8),
                  _card(
                    child: Column(
                      children: [
                        // Default Payment Method
                        const Text('Default Payment Method', style: TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            _paymentChip('Cash', 'CASH', Icons.money_outlined),
                            const SizedBox(width: 8),
                            _paymentChip('Card', 'CARD', Icons.credit_card_outlined),
                          ],
                        ),
                        const SizedBox(height: 16),
                        const Divider(color: AppColors.divider, height: 1),
                        const SizedBox(height: 8),
                        // Auto-Print Receipt
                        SwitchListTile(
                          contentPadding: EdgeInsets.zero,
                          dense: true,
                          title: const Text('Auto-Print Receipt', style: TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w500)),
                          subtitle: const Text('Automatically print after each sale', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                          value: _autoPrintReceipt,
                          onChanged: (v) => setState(() => _autoPrintReceipt = v),
                          activeThumbColor: AppColors.primary,
                          activeTrackColor: AppColors.primary.withValues(alpha: 0.3),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Theme
                  _sectionHeader('THEME'),
                  const SizedBox(height: 8),
                  _card(
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.dark_mode_outlined,
                          color: AppColors.primary),
                      title: const Text('Dark Theme',
                          style: TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 14,
                              fontWeight: FontWeight.w500)),
                      subtitle: const Text('Dark theme is active',
                          style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 12)),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'Active',
                          style: TextStyle(
                              color: AppColors.primary,
                              fontSize: 12,
                              fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.primaryFg,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: _saving ? null : _save,
                      child: _saving
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: AppColors.primaryFg))
                          : const Text('Save Preferences',
                              style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600)),
                    ),
                  ),

                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }

  Widget _paymentChip(String label, String value, IconData icon) {
    final selected = _defaultPayment == value;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _defaultPayment = value),
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
          decoration: BoxDecoration(
            color: selected ? AppColors.primary.withValues(alpha: 0.12) : AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: selected ? AppColors.primary : AppColors.divider),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 16, color: selected ? AppColors.primary : AppColors.textSecondary),
              const SizedBox(width: 6),
              Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: selected ? AppColors.primary : AppColors.textSecondary)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionHeader(String title) => Padding(
        padding: const EdgeInsets.only(left: 4, bottom: 4),
        child: Text(
          title,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppColors.textSecondary,
            letterSpacing: 1.2,
          ),
        ),
      );

  Widget _card({required Widget child}) => Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.divider),
        ),
        padding: const EdgeInsets.all(16),
        clipBehavior: Clip.hardEdge,
        child: child,
      );
}
