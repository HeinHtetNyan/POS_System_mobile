import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/channel_links.dart';

/// Mirrors the web app's `ContactLinksRow`/`ContactFooter` — shown instead of
/// a price/CTA for "contact us" (is_custom) plans, e.g. Enterprise. Renders
/// the same global Channel Links (Super Admin > All Links) shown on the
/// login screen, rather than a per-plan value — one thing to keep updated
/// instead of two. Empty/unset fields are simply omitted.
class ContactLinksRow extends StatelessWidget {
  final Map<String, dynamic>? channelLinks;
  final String emptyMessage;

  const ContactLinksRow({
    super.key,
    required this.channelLinks,
    this.emptyMessage = 'Contact us to discuss your requirements.',
  });

  Future<void> _open(String href) async {
    final uri = Uri.tryParse(href);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final chips = buildChannelLinkChips(channelLinks);
    if (chips.isEmpty) {
      return Text(
        emptyMessage,
        textAlign: TextAlign.center,
        style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
      );
    }
    return Wrap(
      alignment: WrapAlignment.center,
      spacing: 8,
      runSpacing: 8,
      children: chips
          .map((c) => InkWell(
                onTap: () => _open(c.href),
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.divider),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(c.icon, size: 15, color: AppColors.textSecondary),
                      const SizedBox(width: 6),
                      Text(c.label,
                          style: const TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 12,
                              fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ))
          .toList(),
    );
  }
}
