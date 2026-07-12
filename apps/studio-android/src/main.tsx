import { createRoot } from "react-dom/client";
import { lazy, Suspense, useState, useEffect } from "react";
import { TolgeeProvider } from "@tolgee/react";
import App from "./App";
import {
  tolgee,
  ensureNotificationPermission,
  seedAudioAssets,
  NATIVE_VERSION,
  initDevToolsFramework,
  UpdaterFlightRecorder,
  initLongTaskObserver
} from "@workspace/studio-core";
import { PerformanceProfiler } from "@workspace/ui-shared";
import { Capacitor } from "@capacitor/core";
import "./index.css";

initLongTaskObserver();

const LazyEmergencyOverlay = lazy(() => import("./EmergencyDebugOverlay"));

function EmergencyDebugOverlayWrapper() {
  const [shouldRender, setShouldRender] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isDebugModeEnabled = localStorage.getItem('studio_debug_mode') === 'true' ||
      (window as any).__studio_debug_mode === true;
    const hasUnviewedFailed = localStorage.getItem('studio_failed_navigation_unviewed') === 'true';
    return isDebugModeEnabled || hasUnviewedFailed;
  });

  useEffect(() => {
    (window as any).__openEmergencyOverlay = (targetTab?: string) => {
      setShouldRender(true);
      setTimeout(() => {
        if (typeof (window as any).__openEmergencyOverlay === 'function' && (window as any).__openEmergencyOverlay !== openEmergencyStub) {
          (window as any).__openEmergencyOverlay(targetTab);
        }
      }, 50);
    };

    const openEmergencyStub = (window as any).__openEmergencyOverlay;

    return () => {
      if ((window as any).__openEmergencyOverlay === openEmergencyStub) {
        delete (window as any).__openEmergencyOverlay;
      }
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <Suspense fallback={null}>
      <LazyEmergencyOverlay />
    </Suspense>
  );
}

// Initialize DevTools
initDevToolsFramework();

// Defer non-critical background initialization by 2 seconds to keep critical frames clear
setTimeout(() => {
  // Ask for notification permission on first launch.
  void ensureNotificationPermission();

  // Kick off the drum-sample seed in the background.
  void seedAudioAssets();
}, 2000);

const UpdateIndicator = lazy(() => import("@workspace/ui-shared/src/components/UpdateIndicator"));

function GlobalOverlays() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <UpdateIndicator accentFrom="#7c3aed" accentTo="#a855f7" />
    </Suspense>
  );
}

function RootAppContainer() {
  UpdaterFlightRecorder.record({ thread: 'js', sessionId: null, workflowId: null, eventType: 'FORENSIC_ROOTAPP_RENDER', caller: 'main', reason: '<RootAppContainer /> rendered' });
  const [appKey, setAppKey] = useState(0);

  useEffect(() => {
    (window as any).__forceRerenderApp = () => {
      setAppKey(prev => prev + 1);
    };
    return () => {
      delete (window as any).__forceRerenderApp;
    };
  }, []);

  return <App key={appKey} />;
}

// Create the emergency overlay root synchronously directly under document.body before mount
if (typeof document !== 'undefined') {
  let overlayRoot = document.getElementById("livex-emergency-overlay-root");
  if (!overlayRoot) {
    overlayRoot = document.createElement("div");
    overlayRoot.id = "livex-emergency-overlay-root";
    overlayRoot.style.position = "fixed";
    overlayRoot.style.inset = "0";
    overlayRoot.style.zIndex = "2147483647";
    overlayRoot.style.isolation = "isolate";
    overlayRoot.style.pointerEvents = "none";
    overlayRoot.style.transform = "translateZ(0)";
    overlayRoot.style.contain = "none";
    overlayRoot.style.background = "transparent";
    document.body.appendChild(overlayRoot);
  }
}

// Log React bootstrap start time
if (typeof window !== 'undefined' && (window as any).__bootTimings) {
  (window as any).__bootTimings.reactBootstrapStart = performance.now();
  console.log("[LivexBoot] React bootstrap started: " + (window as any).__bootTimings.reactBootstrapStart.toFixed(2) + "ms");
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    UpdaterFlightRecorder.record({ thread: 'js', sessionId: null, workflowId: null, eventType: 'FORENSIC_UNCAUGHT_ERROR', caller: 'main', reason: 'Uncaught error event', error: event.error?.stack || event.message });
  });
  window.addEventListener('unhandledrejection', (event) => {
    UpdaterFlightRecorder.record({ thread: 'js', sessionId: null, workflowId: null, eventType: 'FORENSIC_UNHANDLED_REJECTION', caller: 'main', reason: 'Unhandled promise rejection', error: event.reason?.stack || String(event.reason) });
  });
}

// Mount React immediately (native splash screen takes care of hiding visual load transitions)
if (typeof window !== 'undefined') {
  (window as any).__reactMounted = true;
}
UpdaterFlightRecorder.record({ thread: 'js', sessionId: null, workflowId: null, eventType: 'FORENSIC_REACT_MOUNT', caller: 'main', reason: 'createRoot.render called' });
createRoot(document.getElementById("root")!).render(
  <PerformanceProfiler id="AppRoot_Android">
    <RootAppContainer />
    <GlobalOverlays />
    <EmergencyDebugOverlayWrapper />
  </PerformanceProfiler>,
);

// Clean up all service workers since they are not supported in native wrappers.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      void reg.unregister();
    });
  }).catch((err) => {
    console.warn('[sw] Failed to clean up service workers:', err);
  });
}

// Clear Web Cache Storage on native platform version change.
if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
  const LAST_NATIVE_VERSION_KEY = 'studio:lastNativeVersionForCache';
  const lastVersion = localStorage.getItem(LAST_NATIVE_VERSION_KEY);
  if (lastVersion !== NATIVE_VERSION) {
    if (typeof caches !== 'undefined' && typeof caches.keys === 'function') {
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      }).then(() => {
        console.log('[Cache Migration] Cleared all Web asset caches successfully.');
        localStorage.setItem(LAST_NATIVE_VERSION_KEY, NATIVE_VERSION);
      }).catch((err) => {
        console.warn('[Cache Migration] Failed to clear caches:', err);
      });
    } else {
      localStorage.setItem(LAST_NATIVE_VERSION_KEY, NATIVE_VERSION);
    }
  }
}
