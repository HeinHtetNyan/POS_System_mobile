import 'package:flutter/material.dart';

/// One resolved Channel Link chip — icon, label, and a ready-to-launch href
/// (tel:/mailto:/https:).
class ChannelLinkChipData {
  final IconData icon;
  final String label;
  final String href;
  const ChannelLinkChipData(this.icon, this.label, this.href);
}

/// Builds the Channel Links chip list from the raw map returned by
/// GET /public/app-download-links (or the admin equivalent) — the same 7
/// superadmin-editable fields (Super Admin > All Links > Channel Links) used
/// on the login screen and on custom/Enterprise plan cards, so there's one
/// single source of truth instead of a per-plan value. Fields left blank by
/// the admin are simply omitted (no "Coming Soon" placeholder).
List<ChannelLinkChipData> buildChannelLinkChips(Map<String, dynamic>? links) {
  String? read(String key) {
    final v = links?[key] as String?;
    return (v != null && v.isNotEmpty) ? v : null;
  }

  final chips = <ChannelLinkChipData>[];
  void add(String key, IconData icon, String label, String Function(String) toHref) {
    final v = read(key);
    if (v != null) chips.add(ChannelLinkChipData(icon, label, toHref(v)));
  }

  add('youtube', Icons.smart_display_outlined, 'YouTube', (v) => v);
  add('telegram', Icons.send_outlined, 'Telegram', (v) => v);
  add('viber', Icons.chat_bubble_outline, 'Viber', (v) => v);
  add('phone', Icons.call_outlined, 'Phone',
      (v) => 'tel:${v.replaceAll(RegExp(r'[^\d+]'), '')}');
  add('email', Icons.email_outlined, 'Email', (v) => 'mailto:$v');
  add('facebook', Icons.facebook_outlined, 'Facebook', (v) => v);
  add('tiktok', Icons.music_note_outlined, 'TikTok', (v) => v);
  return chips;
}
