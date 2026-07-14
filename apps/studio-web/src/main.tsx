import { tolgee, initDevToolsFramework, NavigationDispatcher } from '@workspace/studio-core';

// Initialize DevTools
initDevToolsFramework();

import { createRoot } from "react-dom/client";
import { lazy, Suspense, useState, useEffect } from "react";
import { TolgeeProvider } from "@tolgee/react";
import App from "./App";
import "./index.css";

// @ts-ignore
window.NavigationDispatcher = NavigationDispatcher;

createRoot(document.getElementById("root")!).render(
  <TolgeeProvider tolgee={tolgee} fallback={null}>
    <App />
  </TolgeeProvider>,
);

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      void reg.unregister();
    });
  }).catch((err) => {
    console.warn('[sw] Failed to clean up service workers:', err);
  });
}
