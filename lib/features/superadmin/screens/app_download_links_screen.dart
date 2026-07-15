import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/responsive.dart';

// Superadmin-only: sets the Android/iOS/Windows download links shown as
// buttons on the web app's public login screen. Same backend resource web's
// AppDownloadLinksPage manages (GET/PUT /subscriptions/admin/platform/app-download-links).
class AppDownloadLinksScreen extends StatefulWidget {
  const AppDownloadLinksScreen({super.key});

  @override
  State<AppDownloadLinksScreen> createState() => _AppDownloadLinksScreenState();
}

enum _Group { download, channel }

enum _Kind { url, phone, email }

class _Field {
  final String key;
  final IconData icon;
  final String label;
  final String placeholder;
  final String? hint;
  final _Kind kind;
  final _Group group;
  const _Field(this.key, this.icon, this.label, this.placeholder, this.group,
      [this.hint, this.kind = _Kind.url]);
}

class _AppDownloadLinksScreenState extends State<AppDownloadLinksScreen> {
  static const _fields = [
    _Field('android', Icons.android, 'Android (Google Play)',
        'https://play.google.com/store/apps/details?id=...', _Group.download,
        'If this isn\'t a Play Store link (e.g. a direct .apk), users see an "Install unknown apps" warning they must approve manually.'),
    _Field('ios', Icons.phone_iphone, 'iOS (App Store)',
        'https://apps.apple.com/app/id...', _Group.download,
        'iOS only allows installs via the App Store or TestFlight — use a TestFlight link if the app isn\'t published yet.'),
    _Field('windows', Icons.desktop_windows_outlined, 'Windows',
        'https://.../SawYunPos-Setup.exe', _Group.download),
    _Field('youtube', Icons.smart_display_outlined, 'YouTube Channel',
        'https://youtube.com/@yourchannel', _Group.channel),
    _Field('telegram', Icons.send_outlined, 'Telegram',
        'https://t.me/yourhandle', _Group.channel),
    _Field('viber', Icons.chat_bubble_outline, 'Viber',
        'https://invite.viber.com/?g=...', _Group.channel),
    _Field('phone', Icons.call_outlined, 'Phone', '+959xxxxxxxxx',
        _Group.channel, null, _Kind.phone),
    _Field('email', Icons.email_outlined, 'Email', 'sales@yourcompany.com',
        _Group.channel, null, _Kind.email),
    _Field('facebook', Icons.facebook_outlined, 'Facebook',
        'https://facebook.com/yourpage', _Group.channel),
    _Field('tiktok', Icons.music_note_outlined, 'TikTok',
        'https://tiktok.com/@youraccount', _Group.channel),
  ];

  static final _downloadFields =
      _fields.where((f) => f.group == _Group.download).toList();
  static final _channelFields =
      _fields.where((f) => f.group == _Group.channel).toList();

  bool _loading = true;
  bool _saving = false;
  bool _dirty = false;
  final Map<String, TextEditingController> _controllers = {
    for (final f in _fields) f.key: TextEditingController(),
  };

  @override
  void initState() {
    super.initState();
    for (final c in _controllers.values) {
      c.addListener(() => setState(() => _dirty = true));
    }
    _load();
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  bool _isValidUrl(String value) {
    if (value.isEmpty) return true;
    final uri = Uri.tryParse(value);
    return uri != null && (uri.scheme == 'http' || uri.scheme == 'https');
  }

  // Phone is a tel number, not a URL — just require it look like one.
  bool _isValidPhone(String value) {
    if (value.isEmpty) return true;
    return RegExp(r'^[+()\d\s-]{5,20}$').hasMatch(value);
  }

  bool _isValidEmail(String value) {
    if (value.isEmpty) return true;
    return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(value);
  }

  bool _isValidField(_Field f) {
    final value = _controllers[f.key]!.text.trim();
    switch (f.kind) {
      case _Kind.phone:
        return _isValidPhone(value);
      case _Kind.email:
        return _isValidEmail(value);
      case _Kind.url:
        return _isValidUrl(value);
    }
  }

  bool get _allValid => _fields.every(_isValidField);

  Future<void> _load() async {
    try {
      final res = await apiClient.dio.get(ApiEndpoints.adminAppDownloadLinks);
      final data = res.data as Map<String, dynamic>? ?? {};
      for (final f in _fields) {
        _controllers[f.key]!.text = data[f.key] as String? ?? '';
      }
    } catch (_) {
      // Start blank — best-effort like the other settings screens.
    } finally {
      if (mounted) setState(() { _loading = false; _dirty = false; });
    }
  }

  Future<void> _save() async {
    if (!_allValid) return;
    setState(() => _saving = true);
    try {
      await apiClient.dio.put(
        ApiEndpoints.adminAppDownloadLinks,
        data: {for (final f in _fields) f.key: _controllers[f.key]!.text.trim()},
      );
      if (mounted) {
        setState(() => _dirty = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('App download links saved'),
          backgroundColor: AppColors.success,
        ));
      }
    } on DioException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(AppException.fromDio(e).message),
          backgroundColor: AppColors.error,
        ));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: const Text('All Links',
            style: TextStyle(color: AppColors.textPrimary)),
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
        actions: [
          if (_dirty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Center(
                child: TextButton(
                  onPressed: (!_allValid || _saving) ? null : _save,
                  child: _saving
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Save'),
                ),
              ),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : ContentWrapper(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  const Text(
                    'Download and channel links shown on the web app\'s public login screen. Leave a field empty to show "Coming Soon" for that platform.',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                  const SizedBox(height: 16),
                  const Text('DOWNLOAD LINKS',
                      style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.2)),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.divider),
                    ),
                    clipBehavior: Clip.hardEdge,
                    child: Column(
                      children: [
                        for (var i = 0; i < _downloadFields.length; i++) ...[
                          if (i > 0) Divider(height: 1, color: AppColors.divider),
                          _fieldTile(_downloadFields[i]),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text('CHANNEL LINKS',
                      style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.2)),
                  const SizedBox(height: 2),
                  const Text(
                    'Social / messaging links shown next to the download buttons.',
                    style: TextStyle(color: AppColors.textDisabled, fontSize: 11),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.divider),
                    ),
                    clipBehavior: Clip.hardEdge,
                    child: Column(
                      children: [
                        for (var i = 0; i < _channelFields.length; i++) ...[
                          if (i > 0) Divider(height: 1, color: AppColors.divider),
                          _fieldTile(_channelFields[i]),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.info.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.info.withValues(alpha: 0.25)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.info_outline, size: 16, color: AppColors.info),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'The login screen\'s "Mobile App" button uses the Android link for Android visitors and the iOS link otherwise, falling back to whichever is set if only one is filled in.',
                            style: TextStyle(color: AppColors.info, fontSize: 11.5),
                          ),
                        ),
                      ],
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
                      onPressed: (!_dirty || !_allValid || _saving) ? null : _save,
                      child: _saving
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.primaryFg))
                          : const Text('Save Changes',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }

  Widget _fieldTile(_Field f) {
    final ctrl = _controllers[f.key]!;
    final valid = _isValidField(f);
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            margin: const EdgeInsets.only(top: 18),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.divider),
            ),
            child: Icon(f.icon, size: 18, color: AppColors.textSecondary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(f.label,
                          style: const TextStyle(
                              color: AppColors.textSecondary, fontSize: 12)),
                    ),
                    if (ctrl.text.trim().isEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text('COMING SOON',
                            style: TextStyle(
                                color: AppColors.primary,
                                fontSize: 9,
                                fontWeight: FontWeight.w700)),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                TextField(
                  controller: ctrl,
                  keyboardType: switch (f.kind) {
                    _Kind.phone => TextInputType.phone,
                    _Kind.email => TextInputType.emailAddress,
                    _Kind.url => TextInputType.url,
                  },
                  style: const TextStyle(
                      color: AppColors.textPrimary, fontSize: 13, fontFamily: 'monospace'),
                  decoration: InputDecoration(
                    isDense: true,
                    hintText: f.placeholder,
                    hintStyle: const TextStyle(color: AppColors.textDisabled, fontSize: 12),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: valid ? AppColors.divider : AppColors.error),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: valid ? AppColors.primary : AppColors.error),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                  ),
                ),
                if (!valid)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                        switch (f.kind) {
                          _Kind.phone => 'Enter a valid phone number, or leave empty.',
                          _Kind.email => 'Enter a valid email address, or leave empty.',
                          _Kind.url => 'Enter a valid http(s) URL, or leave empty.',
                        },
                        style: const TextStyle(color: AppColors.error, fontSize: 11)),
                  )
                else if (f.hint != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(f.hint!,
                        style: const TextStyle(color: AppColors.textDisabled, fontSize: 11)),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
