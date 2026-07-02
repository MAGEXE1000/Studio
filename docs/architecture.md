# Chordex Studio — Architectural Specification

This document provides a detailed overview of the system architecture, component layout, data communication models, and folder structures.

---

## 1. Modular Subsystem Overview

Chordex Studio is composed of five active functional subsystems built on a shared platform architecture.

```
                  ┌─────────────────────────────────────────┐
                  │          Studio Hub (Dashboard)         │
                  └────────────────────┬────────────────────┘
                                       │
         ┌───────────────┬─────────────┼──────────────┬──────────────┐
         ▼               ▼             ▼              ▼              ▼
    ┌──────────┐   ┌───────────┐   ┌──────────┐   ┌──────────┐   ┌───────────┐
    │ Chordex  │   │  Stagex   │   │  Drumex  │   │ Groovex  │   │  Vocalex  │
    └──────────┘   └───────────┘   └──────────┘   └──────────┘   └───────────┘
```

### Subsystems
* **Studio Hub**: The user landing screen and settings manager. Orchestrates active panels, account sync statuses, and developer debugging subviews.
* **Chordex**: The song discovery catalog and chords practice dashboard. Integrates real-time chord detection overlays and sheet renderers.
* **Stagex**: An interactive layout stage utilizing iframe wrappers to run sandboxed canvas widgets, communicating via cross-document messaging.
* **Drumex**: A 16-step grid drum sequencer and drum pads editor backed by a high-performance web audio sampler.
* **Groovex**: An interactive backing track generator with dynamic tempo and instrumentation controls.
* **Vocalex**: A vocal tuning sandbox incorporating microphone frequency analyzer waves and multi-track recording takes.

---

## 2. Package Topology & Responsibilities

The codebase divides responsibilities across shared modules and platform packages:

```
                          ┌─────────────────────────┐
                          │    @workspace/studio    │
                          │     (Root Monorepo)     │
                          └────────────┬────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
       ┌───────────────────┐                         ┌───────────────────┐
       │   studio-android  │                         │     studio-web    │
       │    (Android App)  │                         │     (Web App)     │
       └────────┬──────────┘                         └────────┬──────────┘
                │                                             │
                ├──────────────────────┐       ┌──────────────┤
                ▼                      ▼       ▼              ▼
       ┌───────────────────┐         ┌───────────┐         ┌───────────────────┐
       │     ui-android    │         │ ui-shared │         │       ui-web      │
       │   (Android UI)    │         │ (Shared)  │         │      (Web UI)     │
       └───────────────────┘         └─────┬─────┘         └───────────────────┘
                                           │
                                           ▼
                                     ┌───────────┐
                                     │studio-core│
                                     │  (Core)   │
                                     └───────────┘
```

### Packages
* **`apps/studio-android`**: Android build workspace running under Capacitor. Wraps compiled assets into the native app package shell.
* **`apps/studio-web`**: Web target build directory, deployed to Netlify using optimized SPA assets.
* **`packages/studio-core`**: The single source of truth for business logic. Contains audio samplers, Firestore synchronization logic, settings stores, updates lifecycle hooks, and internationalization directories.
* **`packages/ui-shared`**: Core component library containing layouts, modal sheets, panels, and devtools.
* **`packages/ui-android`**: Custom views implementing Capacitor plugins, Android navigation interfaces, and notch/status bar spacing rules.
* **`packages/ui-web`**: Specialized desktop UI controls and landing portals.

---

## 3. Communication & Data Flows

### Module Communication: Stagex IFrame Bridge
Stagex executes sandbox scripts in a separate document context to prevent execution blockages on the main React thread. Communication is managed via postMessage:

```
┌────────────────────────────────┐            ┌────────────────────────────────┐
│      Main React Application    │            │     Stagex Sandboxed IFrame    │
│  (packages/ui-android/Stage)   │            │        (public/stage-core)     │
├────────────────────────────────┤            ├────────────────────────────────┤
│                                │            │                                │
│  postMessage({ cmd: 'play' }) ─┼───────────>│  window.addEventListener       │
│                                │            │    ('message', handler)        │
│                                │            │                                │
│  onMessage(ackPayload) <───────┼────────────┼─ postMessage({ status: 'ack' })│
│                                │            │                                │
└────────────────────────────────┘            └────────────────────────────────┘
```

### State Storage & State Flow
All system configurations and state variables use `zustand` stores. The stores partition state logically:
* **`useChordStore`**: User dashboard layout settings, developer modes, active dashboard tabs, active subviews.
* **`useAuthStore`**: Firebase authentication profile mapping, permissions credentials, active user roles.
* **`useOtaStore`**: Current updater states (Idle, Checking, Downloading, Ready to Install, Failed).

### Offline Synchronization Flow
```
┌───────────┐         ┌──────────────┐         ┌───────────┐
│ React UI  │────────>│ Zustand Store│────────>│ SQLite/Local │
│ Mutations │         │    Actions   │         │    Cache  │
└───────────┘         └──────┬───────┘         └─────┬─────┘
                             │                       │
                             ▼                       ▼
                      ┌──────────────┐         ┌───────────┐
                      │ Sync Engine  ├────────>│ Cloud DB  │
                      │ Queue Handler│         │(Firestore)│
                      └──────────────┘         └───────────┘
```
