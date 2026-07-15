import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../utils/currency_formatter.dart';
import '../../models/tenant_settings_model.dart';
import 'auth_provider.dart';

/// Repository for the tenant-wide settings that must stay identical across
/// web and mobile (currency, tax, receipt content, checkout defaults).
/// Mirrors `frontend/src/services/tenant/tenant.service.ts` — same endpoints,
/// same `extra_settings` keys, so a change made on one platform is visible
/// on the other.
class TenantSettingsRepository {
  Future<TenantSettingsModel> fetch(String tenantId) async {
    try {
      final results = await Future.wait([
        apiClient.get(ApiEndpoints.tenant(tenantId)),
        apiClient.get(ApiEndpoints.tenantSettings(tenantId)),
      ]);
      return TenantSettingsModel.merge(
        tenantId: tenantId,
        tenantJson: results[0].data as Map<String, dynamic>,
        settingsJson: results[1].data as Map<String, dynamic>,
      );
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }

  Future<void> updateSettings(
    String tenantId, {
    double? taxRate,
    bool? taxInclusive,
    Map<String, dynamic>? extraSettings,
    Map<String, bool>? featuresEnabled,
  }) async {
    try {
      await apiClient.patch(
        ApiEndpoints.tenantSettings(tenantId),
        data: {
          if (taxRate != null) 'tax_rate': taxRate,
          if (taxInclusive != null) 'tax_inclusive': taxInclusive,
          if (extraSettings != null) 'extra_settings': extraSettings,
          if (featuresEnabled != null) 'features_enabled': featuresEnabled,
        },
      );
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }

  Future<void> updateBusinessLocale(
    String tenantId, {
    String? currency,
    String? locale,
    String? timezone,
  }) async {
    try {
      await apiClient.patch(
        ApiEndpoints.tenant(tenantId),
        data: {
          if (currency != null) 'currency': currency,
          if (locale != null) 'locale': locale,
          if (timezone != null) 'timezone': timezone,
        },
      );
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }

  Future<void> uploadLogo(String tenantId, File file) async {
    try {
      final fileName = file.path.split('/').last;
      final form = FormData.fromMap({
        'file': await MultipartFile.fromFile(file.path, filename: fileName),
      });
      await apiClient.post(ApiEndpoints.tenantLogo(tenantId), data: form);
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }

  Future<void> deleteLogo(String tenantId) async {
    try {
      await apiClient.delete(ApiEndpoints.tenantLogo(tenantId));
    } on DioException catch (e) {
      throw AppException.fromDio(e);
    }
  }

  /// Fetches the logo as raw bytes for preview/printing (own-tenant only, per backend rule).
  Future<List<int>?> fetchLogoBytes(String tenantId) async {
    try {
      final res = await apiClient.get(
        ApiEndpoints.tenantLogo(tenantId),
        options: Options(responseType: ResponseType.bytes),
      );
      return res.data as List<int>;
    } on DioException {
      return null;
    }
  }
}

final tenantSettingsRepositoryProvider =
    Provider((ref) => TenantSettingsRepository());

class TenantSettingsNotifier extends StateNotifier<AsyncValue<TenantSettingsModel?>> {
  final TenantSettingsRepository _repo;
  final String? _tenantId;

  TenantSettingsNotifier(this._repo, this._tenantId)
      : super(const AsyncValue.data(null)) {
    if (_tenantId != null && _tenantId.isNotEmpty) refresh();
  }

  Future<void> refresh() async {
    if (_tenantId == null || _tenantId.isEmpty) return;
    state = const AsyncValue.loading();
    try {
      final settings = await _repo.fetch(_tenantId);
      CurrencyFormatter.configure(
        currency: settings.currency,
        displayCurrency: settings.displayCurrency,
        locale: settings.locale,
      );
      state = AsyncValue.data(settings);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> updateTax({
    required bool enabled,
    required double rate,
    required bool inclusive,
    required String name,
  }) async {
    if (_tenantId == null) return;
    // Matches web: disabling tax persists rate=0 rather than hiding a stale rate.
    await _repo.updateSettings(
      _tenantId,
      taxRate: enabled ? rate : 0,
      taxInclusive: inclusive,
      extraSettings: {'tax_name': name.isEmpty ? 'Tax' : name},
    );
    await refresh();
  }

  Future<void> updateReceiptContent({
    String? header,
    String? footer,
    required bool showTaxOnReceipt,
  }) async {
    if (_tenantId == null) return;
    await _repo.updateSettings(
      _tenantId,
      extraSettings: {
        'receipt_header': header?.isEmpty == true ? null : header,
        'receipt_footer': footer?.isEmpty == true ? null : footer,
        'show_tax_on_receipt': showTaxOnReceipt,
      },
    );
    await refresh();
  }

  Future<void> updateCheckoutPreferences({
    required bool autoPrintReceipt,
    required String defaultPaymentMethod,
  }) async {
    if (_tenantId == null) return;
    await _repo.updateSettings(
      _tenantId,
      extraSettings: {
        'auto_print_receipt': autoPrintReceipt,
        'default_payment_method': defaultPaymentMethod,
      },
    );
    await refresh();
  }

  Future<void> updateBusinessLocale({
    String? currency,
    String? locale,
    String? timezone,
  }) async {
    if (_tenantId == null) return;
    await _repo.updateBusinessLocale(
      _tenantId,
      currency: currency,
      locale: locale,
      timezone: timezone,
    );
    await refresh();
  }

  Future<void> uploadLogo(File file) async {
    if (_tenantId == null) return;
    await _repo.uploadLogo(_tenantId, file);
    await refresh();
  }

  Future<void> deleteLogo() async {
    if (_tenantId == null) return;
    await _repo.deleteLogo(_tenantId);
    await refresh();
  }
}

final tenantSettingsProvider = StateNotifierProvider<TenantSettingsNotifier,
    AsyncValue<TenantSettingsModel?>>((ref) {
  final repo = ref.watch(tenantSettingsRepositoryProvider);
  final tenantId = ref.watch(currentUserProvider)?.tenantId;
  return TenantSettingsNotifier(repo, tenantId);
});
