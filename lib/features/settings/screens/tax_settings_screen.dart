import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/tenant_settings_provider.dart';
import '../../../core/utils/responsive.dart';
import '../../../models/tenant_settings_model.dart';

class TaxSettingsScreen extends ConsumerStatefulWidget {
  const TaxSettingsScreen({super.key});

  @override
  ConsumerState<TaxSettingsScreen> createState() => _TaxSettingsScreenState();
}

class _TaxSettingsScreenState extends ConsumerState<TaxSettingsScreen> {
  bool _saving = false;
  bool _initialized = false;

  bool _taxEnabled = false;
  final _rateCtrl = TextEditingController(text: '0');
  final _nameCtrl = TextEditingController(text: 'Tax');
  String _taxType = 'exclusive'; // 'inclusive' or 'exclusive'

  @override
  void dispose() {
    _rateCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  // Tenant Settings is the single source of truth (same as web) — this
  // screen no longer keeps its own local shared_preferences copy, so a
  // change here (or on web) is reflected everywhere immediately on refresh.
  void _hydrateFromSettings(TenantSettingsModel settings) {
    if (_initialized) return;
    _initialized = true;
    _taxEnabled = settings.taxEnabled;
    _rateCtrl.text = (settings.taxRate ?? 0.0).toString();
    _nameCtrl.text = settings.taxName;
    _taxType = settings.taxInclusive ? 'inclusive' : 'exclusive';
  }

  Future<void> _save() async {
    final rate = double.tryParse(_rateCtrl.text);
    if (_taxEnabled && (rate == null || rate < 0 || rate > 100)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Enter a valid tax rate between 0 and 100'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      await ref.read(tenantSettingsProvider.notifier).updateTax(
            enabled: _taxEnabled,
            rate: rate ?? 0.0,
            inclusive: _taxType == 'inclusive',
            name: _nameCtrl.text.trim(),
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Tax settings saved'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final settingsAsync = ref.watch(tenantSettingsProvider);
    final loading = settingsAsync.isLoading && !_initialized;
    settingsAsync.whenData((s) {
      if (s != null) _hydrateFromSettings(s);
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: const Text('Tax Settings',
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
                  // Enable tax toggle
                  _sectionHeader('TAX'),
                  const SizedBox(height: 8),
                  _card(
                    child: SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text(
                        'Enable Tax',
                        style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 15,
                            fontWeight: FontWeight.w600),
                      ),
                      subtitle: const Text(
                        'Apply tax to all sales transactions',
                        style: TextStyle(
                            color: AppColors.textSecondary, fontSize: 12),
                      ),
                      value: _taxEnabled,
                      onChanged: (v) => setState(() => _taxEnabled = v),
                      activeThumbColor: AppColors.primaryFg,
                      activeTrackColor: AppColors.primary,
                    ),
                  ),

                  if (_taxEnabled) ...[
                    const SizedBox(height: 20),

                    // Tax details
                    _sectionHeader('TAX DETAILS'),
                    const SizedBox(height: 8),
                    _card(
                      child: Column(
                        children: [
                          // Tax name
                          TextFormField(
                            controller: _nameCtrl,
                            style: const TextStyle(
                                color: AppColors.textPrimary),
                            decoration: _inputDecoration(
                              label: 'Tax Name',
                              hint: 'e.g. GST, VAT, SST',
                              prefixIcon: Icons.label_outline,
                            ),
                          ),
                          const SizedBox(height: 12),
                          // Tax rate
                          TextFormField(
                            controller: _rateCtrl,
                            keyboardType:
                                const TextInputType.numberWithOptions(
                                    decimal: true),
                            style: const TextStyle(
                                color: AppColors.textPrimary),
                            decoration: _inputDecoration(
                              label: 'Tax Rate',
                              hint: '0.0',
                              prefixIcon: Icons.percent,
                            ).copyWith(
                              suffixText: '%',
                              suffixStyle: const TextStyle(
                                  color: AppColors.textSecondary,
                                  fontSize: 15),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Tax type
                    _sectionHeader('TAX TYPE'),
                    const SizedBox(height: 8),
                    _card(
                      child: RadioGroup<String>(
                        groupValue: _taxType,
                        onChanged: (v) => setState(() => _taxType = v!),
                        child: Column(
                          children: [
                            RadioListTile<String>(
                              contentPadding: EdgeInsets.zero,
                              title: const Text(
                                'Exclusive',
                                style: TextStyle(
                                    color: AppColors.textPrimary,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500),
                              ),
                              subtitle: const Text(
                                'Tax is added on top of the price (price + tax)',
                                style: TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 12),
                              ),
                              value: 'exclusive',
                              fillColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? AppColors.primary : AppColors.textSecondary),
                            ),
                            Divider(height: 1, color: AppColors.divider),
                            RadioListTile<String>(
                              contentPadding: EdgeInsets.zero,
                              title: const Text(
                                'Inclusive',
                                style: TextStyle(
                                    color: AppColors.textPrimary,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500),
                              ),
                              subtitle: const Text(
                                'Tax is already included in the price',
                                style: TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 12),
                              ),
                              value: 'inclusive',
                              fillColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? AppColors.primary : AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],

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
                          : const Text('Save Settings',
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

  InputDecoration _inputDecoration({
    required String label,
    String? hint,
    required IconData prefixIcon,
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      hintStyle: const TextStyle(color: AppColors.textDisabled),
      prefixIcon:
          Icon(prefixIcon, color: AppColors.textSecondary, size: 20),
      labelStyle: const TextStyle(color: AppColors.textSecondary),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.divider),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.primary),
      ),
    );
  }
}
