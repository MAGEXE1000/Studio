Release Date: 2026-07-24

## Improved
- Real DOM highlight sizing: attached ResizeObserver layout measurements directly to active item content wrappers (getBoundingClientRect + 16px horizontal padding) for perfect content-hugging highlights across all font scales and localizations.
- Bouncy 40% center scale animation: re-enabled scroll offset tracking to scale the Bottom Navigation and App Switcher button by 40% (1.00 -> 0.60) toward their center-center point on scroll down, with bouncy spring recovery on scroll up and zero vertical translation or hiding.
