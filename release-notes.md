# Version 4.5.30

Release Date: 2026-08-13

### Added

- Integrated Android Liquid Glass navigation dock via CMP Backdrop (`io.github.kyant0:backdrop`) with live blur, lens refraction, vibrancy, specular highlight contour, and theme-adaptive styling.
- Mounted native Compose Liquid Glass overlay onto host ViewGroup to render seamless backdrop shaders behind navigation elements.
- Embedded crisp native vector icons on top of the Liquid Glass surface while maintaining transparent DOM hitboxes for touch routing.
- Fixed critical RootApp runtime TDZ ReferenceErrors in SharedNavigationBar and SharedAppShell.
- Introduced automated TDZ hook order & variable scope regression guard (`scripts/check-hook-order.mjs`) into the lint/build CI pipeline.
