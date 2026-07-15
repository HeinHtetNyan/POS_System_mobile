// Device-local date/time display preferences (Settings → Preferences),
// configured once via `configure()` and read by any screen formatting a
// DateTime for display — mirrors CurrencyFormatter's pattern so changing the
// preference doesn't require touching every call site.
class DateTimeFormatter {
  static String _dateFormat = 'DD/MM/YYYY';
  static bool _use24Hour = false;

  static void configure({required String dateFormat, required bool use24Hour}) {
    _dateFormat = dateFormat;
    _use24Hour = use24Hour;
  }

  static String formatDate(DateTime dt) {
    final d = dt.day.toString().padLeft(2, '0');
    final m = dt.month.toString().padLeft(2, '0');
    final y = dt.year.toString();
    switch (_dateFormat) {
      case 'MM/DD/YYYY':
        return '$m/$d/$y';
      case 'YYYY-MM-DD':
        return '$y-$m-$d';
      case 'DD/MM/YYYY':
      default:
        return '$d/$m/$y';
    }
  }

  static String formatTime(DateTime dt) {
    if (_use24Hour) {
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    }
    final hour12 = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final period = dt.hour < 12 ? 'AM' : 'PM';
    return '$hour12:${dt.minute.toString().padLeft(2, '0')} $period';
  }

  static String formatDateTime(DateTime dt) => '${formatDate(dt)}  ${formatTime(dt)}';
}
