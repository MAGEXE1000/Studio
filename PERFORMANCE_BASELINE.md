# Performance Baseline Contract (Permanent)

## Purpose

Studio has reached a performance and responsiveness level that is now considered the permanent engineering baseline.
This baseline represents the minimum acceptable user experience.
Every future implementation must preserve or improve it.
Performance regressions are considered architectural regressions.

---

## User Experience Contract

Studio must feel instantaneous.
Users should never perceive unnecessary waiting.
Navigation should feel immediate.
Animations should remain smooth.
The application should always feel responsive.

---

## Performance Goals

Target experience:

• Instant startup
• Instant application switching
• Instant tab switching
• Instant Settings navigation
• Instant Preferences navigation
• Instant Updater navigation
• Instant modal opening
• Instant sheet opening
• Stable rendering
• No visible freezes
• No navigation lag
• No animation stutter
• No unnecessary loading indicators

The objective is to maintain a native 120 Hz experience whenever the hardware allows it.

---

## Architectural Principle

Performance is a feature.

Every implementation must attempt to reduce:
• render count
• allocations
• subscriptions
• listeners
• layout invalidations
• paint operations
• React reconciliation work
• Zustand updates
• startup work
• synchronous storage operations
• unnecessary component mounting
• unnecessary component recreation
• memory growth
• main-thread blocking

---

## Mandatory Performance Review

Every implementation must evaluate whether it:
• reduces latency
• reduces rendering
• reduces memory
• reduces startup work
• reduces navigation work
• reduces blocking work

If a better implementation exists with equal functionality and lower cost, it should be preferred.

---

## Regression Policy

The following are considered regressions:
• slower startup
• slower navigation
• slower app switching
• slower tab switching
• additional loading delays
• additional freezes
• dropped frames
• animation jitter
• black screens
• render storms
• unnecessary rerenders
• additional listeners
• additional subscriptions
• memory leaks
• long tasks
• layout thrashing

Regression fixes take priority over new features.

---

## Baseline Validation

Before every release verify:
• Startup remains equal or faster.
• Navigation remains equal or faster.
• Settings remain instantaneous.
• Updater remains responsive.
• Stagex remains responsive.
• Chordex remains responsive.
• Drumex remains responsive.
• Groovex remains responsive.
• Vocalex remains responsive.
• Hub remains responsive.

If any area becomes slower than the established baseline, the implementation must stop and resolve the regression before release.

---

## Engineering Philosophy

Never optimize only one screen.
Optimize the entire application continuously.
Small improvements accumulated across every subsystem are preferred over isolated micro-optimizations.
Every implementation should leave Studio faster than it was before.
