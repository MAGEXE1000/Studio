# Chordex Studio

A comprehensive music tools platform for musicians. Available as a web application (Netlify) and native Android application (APK via Capacitor).

## For AI Agents

If you are an AI agent working on this repository, start here:

1. **[ARCHITECTURE_INDEX.md](ARCHITECTURE_INDEX.md)** — Monorepo structure, dependency graph, all modules
2. **[FEATURE_MAP.md](FEATURE_MAP.md)** — Find any feature's implementation files
3. **[WHERE_IS_EVERYTHING.md](WHERE_IS_EVERYTHING.md)** — Quick-reference lookup by concept
4. **[HOW_TO_IMPLEMENT_FEATURES.md](HOW_TO_IMPLEMENT_FEATURES.md)** — Step-by-step modification recipes
5. **[COMMON_MODIFICATION_POINTS.md](COMMON_MODIFICATION_POINTS.md)** — Files commonly modified per change type
6. **[STATE_FLOW.md](STATE_FLOW.md)** — All Zustand stores, persistence, and data flow
7. **[DEBUGGING_GUIDE.md](DEBUGGING_GUIDE.md)** — Structured debugging for common issues
8. **[AGENTS.md](AGENTS.md)** — Platform-scope policy and engineering protocol

## Monorepo Structure

```
Studio/
├── apps/
│   ├── studio-web/           # Vite + React web app (Netlify)
│   └── studio-android/       # Capacitor + Android native app (APK)
├── packages/
│   ├── studio-core/          # Platform-neutral business logic & stores
│   ├── ui-shared/            # Cross-platform React components
│   ├── ui-web/               # Web-only layout components
│   └── ui-android/           # Android-only components
├── lib/
│   ├── api-spec/             # OpenAPI YAML definitions
│   ├── api-zod/              # Zod schemas (auto-generated)
│   ├── api-client-react/     # React Query hooks (auto-generated)
│   └── db/                   # Drizzle ORM schema (Supabase)
├── scripts/                  # Build, test & release tooling
├── docs/                     # Architecture docs, bug KB, ADRs, workflows
│   ├── architecture/         # Detailed architecture documentation
│   ├── bugs/                 # Bug knowledge base
│   ├── decisions/            # Architectural Decision Records
│   └── workflows/            # Engineering workflow docs
└── knowledge/                # Lessons learned
```

Every major directory has its own **README.md** explaining its purpose, structure, and key files.

## Technology Stack

- **Monorepo**: pnpm workspaces
- **Runtime**: Node.js v24, TypeScript 5.9
- **Frontend**: React 19, Vite 7, Tailwind CSS 4
- **State**: Zustand 5 (persisted via encrypted localStorage)
- **Animation**: Framer Motion / Motion 12
- **Mobile**: Capacitor 6 (Android WebView)
- **Auth**: Firebase Auth 12
- **Database**: Firestore + Supabase (PostgreSQL via Drizzle ORM)
- **i18n**: i18next + Tolgee
- **Audio**: Web Audio API (custom engines)
- **Build**: Vite 7 (web), Gradle (Android APK)
- **CI/CD**: GitHub Actions

## App Modes

Studio contains 6 sub-applications, all rendered inside a single SPA:

| Mode        | Description                                           |
| ----------- | ----------------------------------------------------- |
| **Hub**     | Main navigation shell and app switcher                |
| **Chordex** | Chord library, diagrams, progressions, song practice  |
| **Drumex**  | Step sequencer, drum kits, pattern library, FX chain  |
| **Stagex**  | Stage plot editor (iframe-based)                      |
| **Groovex** | Multi-stem song practice mixer                        |
| **Vocalex** | Vocal training: pitch detection, exercises, recording |

## Platform Separation

| Scope      | Owned Paths                                    |
| ---------- | ---------------------------------------------- |
| **WEB**    | `apps/studio-web/`, `packages/ui-web/`         |
| **APK**    | `apps/studio-android/`, `packages/ui-android/` |
| **SHARED** | `packages/studio-core/`, `packages/ui-shared/` |

Cross-scope import rules: WEB must not import from APK. APK must not import from WEB. Validate with: `pnpm scope:check`

## Quick Start & Local Preview

```bash
# 1. Start Web Preview (Vite HMR on port 5173)
pnpm dev:web
# URL: http://localhost:5173 (Antigravity & browser ready)

# 2. Start Android / Capacitor Live Reload Preview (Port 5174)
pnpm dev:android
# • USB Device: Uses `adb reverse tcp:5174 tcp:5174` (loads http://localhost:5174)
# • Emulator:   Uses loopback alias (http://10.0.2.2:5174)
# • Wi-Fi LAN:  Uses host LAN address (http://<HOST_IP>:5174)

# 3. Start Dual Preview Simultaneously (Web + Mobile Live Reload)
pnpm dev:preview

# Compile Android Debug APK
pnpm preview:android

# Run quality guards & tests
pnpm check:tokens
pnpm check:hook-order
pnpm test
pnpm typecheck:web
```

## User Preferences

- Concise and clear communication preferred
- Iterative development approach with regular feedback
- Discuss major architectural changes before implementing
- Detailed explanations for complex technical decisions
- Do not modify `lib/api-spec/` without prior approval
- Do not modify `tsconfig.base.json` without explicit instruction
