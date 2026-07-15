import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// The app's brand mark — same source image used for the Android launcher
/// icon (assets/icons/app_icon.png) and the web app's logo-icon.png, so all
/// three surfaces show the identical logo.
class AppLogo extends StatelessWidget {
  final double size;
  final double radius;

  const AppLogo({super.key, this.size = 34, this.radius = 10});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: Image.asset(
        'assets/icons/app_icon.png',
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(radius),
          ),
          child: Center(
            child: Text('S',
                style: TextStyle(
                    color: AppColors.primaryFg,
                    fontWeight: FontWeight.w900,
                    fontSize: size * 0.5)),
          ),
        ),
      ),
    );
  }
}
