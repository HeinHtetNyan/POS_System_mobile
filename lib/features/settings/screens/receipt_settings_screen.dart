import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/tenant_settings_provider.dart';
import '../../../core/providers/receipt_options_provider.dart';
import '../../../core/utils/responsive.dart';
import '../../../models/tenant_settings_model.dart';

class ReceiptSettingsScreen extends ConsumerStatefulWidget {
  const ReceiptSettingsScreen({super.key});

  @override
  ConsumerState<ReceiptSettingsScreen> createState() =>
      _ReceiptSettingsScreenState();
}

class _ReceiptSettingsScreenState extends ConsumerState<ReceiptSettingsScreen> {
  bool _saving = false;
  bool _initialized = false;

  final _headerCtrl = TextEditingController();
  final _footerCtrl = TextEditingController();
  bool _showTaxOnReceipt = true;

  File? _pendingLogo; // picked but not yet uploaded
  bool _logoBusy = false;
  Uint8List? _logoBytes;

  @override
  void initState() {
    super.initState();
    _headerCtrl.addListener(() => setState(() {}));
    _footerCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _headerCtrl.dispose();
    _footerCtrl.dispose();
    super.dispose();
  }

  void _hydrateFromSettings(TenantSettingsModel settings) {
    if (_initialized) return;
    _initialized = true;
    _headerCtrl.text = settings.receiptHeader ?? '';
    _footerCtrl.text = settings.receiptFooter ?? '';
    _showTaxOnReceipt = settings.showTaxOnReceipt;
    if (settings.hasLogo) _loadLogoBytes();
  }

  Future<void> _loadLogoBytes() async {
    final tenantId = ref.read(tenantSettingsProvider).valueOrNull?.tenantId;
    if (tenantId == null) return;
    final bytes =
        await ref.read(tenantSettingsRepositoryProvider).fetchLogoBytes(tenantId);
    if (mounted && bytes != null) {
      setState(() => _logoBytes = Uint8List.fromList(bytes));
    }
  }

  Future<void> _pickLogo() async {
    final picker = ImagePicker();
    final picked =
        await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked == null) return;
    setState(() {
      _pendingLogo = File(picked.path);
      _logoBusy = true;
    });
    try {
      await ref.read(tenantSettingsProvider.notifier).uploadLogo(_pendingLogo!);
      await _loadLogoBytes();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Logo uploaded'),
          backgroundColor: AppColors.success,
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Upload failed: $e'),
          backgroundColor: AppColors.error,
        ));
      }
    } finally {
      if (mounted) setState(() => _logoBusy = false);
    }
  }

  Future<void> _removeLogo() async {
    setState(() => _logoBusy = true);
    try {
      await ref.read(tenantSettingsProvider.notifier).deleteLogo();
      setState(() {
        _logoBytes = null;
        _pendingLogo = null;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Remove failed: $e'),
          backgroundColor: AppColors.error,
        ));
      }
    } finally {
      if (mounted) setState(() => _logoBusy = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ref.read(tenantSettingsProvider.notifier).updateReceiptContent(
            header: _headerCtrl.text.trim(),
            footer: _footerCtrl.text.trim(),
            showTaxOnReceipt: _showTaxOnReceipt,
          );
      // Display/hardware options are device-local (paper size, which toggles
      // to print) — saved separately, instantly, per toggle below.
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Receipt settings saved'),
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
    final settingsAsync = ref.watch(tenantSettingsProvider);
    final loading = settingsAsync.isLoading && !_initialized;
    settingsAsync.whenData((s) {
      if (s != null) _hydrateFromSettings(s);
    });
    final options = ref.watch(receiptOptionsProvider);
    final optionsNotifier = ref.read(receiptOptionsProvider.notifier);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: const Text('Receipt Settings',
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
                  _sectionHeader('RECEIPT CONTENT'),
                  const SizedBox(height: 4),
                  const Text(
                    'Synced across all devices and the web dashboard.',
                    style: TextStyle(color: AppColors.textDisabled, fontSize: 11),
                  ),
                  const SizedBox(height: 8),
                  _card(
                    child: Column(
                      children: [
                        _multilineField(
                          controller: _headerCtrl,
                          label: 'Header Text',
                          hint: 'e.g. Thank you for shopping!',
                        ),
                        const SizedBox(height: 12),
                        _multilineField(
                          controller: _footerCtrl,
                          label: 'Footer Text',
                          hint: 'e.g. Returns accepted within 7 days.',
                        ),
                        const SizedBox(height: 8),
                        _toggle(
                          title: 'Show Tax on Receipt',
                          subtitle: 'Print the tax line above the total',
                          value: _showTaxOnReceipt,
                          onChanged: (v) => setState(() => _showTaxOnReceipt = v),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  _sectionHeader('LOGO'),
                  const SizedBox(height: 8),
                  _card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_pendingLogo != null) ...[
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.file(_pendingLogo!,
                                height: 80, fit: BoxFit.contain),
                          ),
                          const SizedBox(height: 10),
                        ] else if (_logoBytes != null) ...[
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Image.memory(_logoBytes!,
                                height: 64, fit: BoxFit.contain),
                          ),
                          const SizedBox(height: 10),
                        ] else ...[
                          Container(
                            width: double.infinity,
                            height: 80,
                            decoration: BoxDecoration(
                              color: AppColors.surfaceVariant,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppColors.divider),
                            ),
                            child: const Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.image_outlined,
                                    color: AppColors.textDisabled, size: 28),
                                SizedBox(height: 4),
                                Text('No logo uploaded',
                                    style: TextStyle(
                                        color: AppColors.textDisabled,
                                        fontSize: 12)),
                              ],
                            ),
                          ),
                          const SizedBox(height: 10),
                        ],
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.primary,
                                  side: const BorderSide(color: AppColors.primary),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8)),
                                ),
                                icon: const Icon(Icons.photo_library_outlined,
                                    size: 16),
                                label: Text(
                                    _logoBytes != null ? 'Replace' : 'Choose from Gallery',
                                    style: const TextStyle(fontSize: 13)),
                                onPressed: _logoBusy ? null : _pickLogo,
                              ),
                            ),
                            if (_logoBytes != null) ...[
                              const SizedBox(width: 8),
                              OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.error,
                                  side: const BorderSide(color: AppColors.error),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8)),
                                ),
                                onPressed: _logoBusy ? null : _removeLogo,
                                child: _logoBusy
                                    ? const SizedBox(
                                        width: 14,
                                        height: 14,
                                        child: CircularProgressIndicator(strokeWidth: 2))
                                    : const Text('Remove', style: TextStyle(fontSize: 13)),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Uploaded to your business profile — used on receipts printed from any device.',
                          style: TextStyle(color: AppColors.textDisabled, fontSize: 11),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  _sectionHeader('THIS DEVICE\'S PRINTER'),
                  const SizedBox(height: 4),
                  const Text(
                    'Paper size, font size, and which lines print — specific to the printer connected to this device.',
                    style: TextStyle(color: AppColors.textDisabled, fontSize: 11),
                  ),
                  const SizedBox(height: 8),
                  _card(
                    child: Column(
                      children: [
                        _toggle(
                          title: 'Show Logo',
                          subtitle: 'Print business logo at top',
                          value: options.showLogo,
                          onChanged: (v) => optionsNotifier.update(options.copyWith(showLogo: v)),
                        ),
                        _divider(),
                        _toggle(
                          title: 'Show Order Number',
                          subtitle: 'Print order/receipt number',
                          value: options.showOrderNumber,
                          onChanged: (v) => optionsNotifier.update(options.copyWith(showOrderNumber: v)),
                        ),
                        _divider(),
                        _toggle(
                          title: 'Show Cashier Name',
                          subtitle: 'Print name of cashier who processed sale',
                          value: options.showCashierName,
                          onChanged: (v) => optionsNotifier.update(options.copyWith(showCashierName: v)),
                        ),
                        _divider(),
                        _toggle(
                          title: 'Show Barcode',
                          subtitle: 'Print a scannable barcode of the order number',
                          value: options.showBarcode,
                          onChanged: (v) => optionsNotifier.update(options.copyWith(showBarcode: v)),
                        ),
                        _divider(),
                        _toggle(
                          title: 'Show Tax Per Item',
                          subtitle: 'Display tax amount per line item',
                          value: options.showItemTax,
                          onChanged: (v) => optionsNotifier.update(options.copyWith(showItemTax: v)),
                        ),
                        _divider(),
                        _toggle(
                          title: 'Show Cost Price',
                          subtitle: 'Print cost price alongside sale price',
                          value: options.showCostPrice,
                          onChanged: (v) => optionsNotifier.update(options.copyWith(showCostPrice: v)),
                        ),
                        _divider(),
                        _toggle(
                          title: 'Show Margin',
                          subtitle: 'Display profit margin per item',
                          value: options.showMargin,
                          onChanged: (v) => optionsNotifier.update(options.copyWith(showMargin: v)),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  _sectionHeader('PAPER SIZE'),
                  const SizedBox(height: 8),
                  _card(
                    child: RadioGroup<String>(
                      groupValue: options.paperSize,
                      onChanged: (v) => optionsNotifier.update(options.copyWith(paperSize: v)),
                      child: Column(
                        children: [
                          _radioOption(title: '58mm', subtitle: 'Narrow thermal paper (compact printer)', value: '58mm'),
                          _divider(),
                          _radioOption(title: '80mm', subtitle: 'Standard thermal paper (most POS printers)', value: '80mm'),
                          _divider(),
                          _radioOption(title: 'A4', subtitle: 'Standard paper (office printer)', value: 'A4'),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  _sectionHeader('FONT SIZE'),
                  const SizedBox(height: 8),
                  _card(
                    child: RadioGroup<String>(
                      groupValue: options.fontSize,
                      onChanged: (v) => optionsNotifier.update(options.copyWith(fontSize: v)),
                      child: Column(
                        children: [
                          _radioOption(title: 'Small', subtitle: '9px — compact, fits more lines', value: 'small'),
                          _divider(),
                          _radioOption(title: 'Medium', subtitle: '12px — default, balanced readability', value: 'medium'),
                          _divider(),
                          _radioOption(title: 'Large', subtitle: '14px — easier to read', value: 'large'),
                        ],
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
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: _saving ? null : _save,
                      child: _saving
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.primaryFg))
                          : const Text('Save Receipt Content',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
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

  Widget _divider() => Divider(height: 1, color: AppColors.divider);

  Widget _toggle({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(title,
          style: const TextStyle(
              color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w500)),
      subtitle: Text(subtitle,
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
      value: value,
      onChanged: onChanged,
      activeThumbColor: AppColors.primaryFg,
      activeTrackColor: AppColors.primary,
    );
  }

  Widget _radioOption<T>({
    required String title,
    required String subtitle,
    required T value,
  }) {
    return RadioListTile<T>(
      contentPadding: EdgeInsets.zero,
      title: Text(title,
          style: const TextStyle(
              color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w500)),
      subtitle: Text(subtitle,
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
      value: value,
      fillColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected) ? AppColors.primary : AppColors.textSecondary),
    );
  }

  Widget _multilineField({
    required TextEditingController controller,
    required String label,
    String? hint,
  }) {
    return TextFormField(
      controller: controller,
      maxLines: 3,
      style: const TextStyle(color: AppColors.textPrimary),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        hintStyle: const TextStyle(color: AppColors.textDisabled),
        labelStyle: const TextStyle(color: AppColors.textSecondary),
        alignLabelWithHint: true,
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.divider),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.primary),
        ),
      ),
    );
  }
}
