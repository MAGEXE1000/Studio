# Chordex Studio — Web Platform Guide

This document describes web-specific styles, Vite compilation setups, Netlify hosting configurations, and browser compatibility fallbacks.

---

## 1. Web Technology Stack & Compilers

The web application compiles React code into static SPA files deployed to Content Delivery Networks.

* **Vite Compilation**: The web workspace utilizes `apps/studio-web/vite.config.ts` to bundle components.
* **Asset Optimization**: Bundles are minified via ESBuild and split into dynamic chunks to improve initial page load speeds.
* **Platform Exclusivity**: Web views and Netlify redirects stay in web-focused packages. They are not allowed to load native Android assemblies or query Capacitor interfaces directly.

---

## 2. Netlify Hosting & Routing (`netlify.toml`)

To support client-side routers (e.g. React Router SPA routes), Netlify is configured to redirect all request paths back to `index.html`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  force = false
```

This prevents `404 Not Found` errors when users refresh deep application links (such as `/songs/123` or `/practice`).

---

## 3. Responsive Styling & Viewport Rules

The web client adapts automatically between mobile viewports and desktop resolutions:

* **Desktop Layout Grid**: Uses CSS grid layouts wrapping main panels into sidebar categories, navigation drawers, and floating panels.
* **Mobile-First Breakpoints**: Utilizes Tailwind breakpoints (`sm:`, `md:`, `lg:`) to scale UI elements:
  * Phone layouts (down to 360dp): Render simple vertical lists and full-width card elements.
  * Tablets & Laptops: Split layouts horizontally into double-column dashboards.
* **Hover Safety**: Web UI elements are allowed to utilize CSS hovers (`:hover`), whereas mobile templates must avoid hover states to prevent tap-freeze bugs on touch displays.

---

## 4. Web Browser Fallbacks

Since native bridge utilities are missing in standard browsers, the core package falls back to web standard APIs:

* **Web Clipboard Fallback**: If the native `AppInstaller` bridge is absent, copy controls route content via `navigator.clipboard.writeText(text)`:
  ```typescript
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  } else {
    throw new Error('Clipboard API not supported in this browser.');
  }
  ```
* **Offline LocalStorage**: Offline database features fall back to standard `localStorage` indices if native SQLite instances are blocked or uninstalled.
