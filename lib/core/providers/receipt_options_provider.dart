import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/receipt_options_model.dart';

class ReceiptOptionsNotifier extends StateNotifier<ReceiptOptions> {
  static const _prefsKey = 'receipt_options';

  ReceiptOptionsNotifier() : super(ReceiptOptions.defaults) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_prefsKey);
    if (raw == null) return;
    try {
      state = ReceiptOptions.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      // Keep defaults on corrupt/old data
    }
  }

  Future<void> update(ReceiptOptions options) async {
    state = options;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefsKey, jsonEncode(options.toJson()));
  }
}

final receiptOptionsProvider =
    StateNotifierProvider<ReceiptOptionsNotifier, ReceiptOptions>(
        (ref) => ReceiptOptionsNotifier());
