# Studio/Livex Custom Agents — Setup & Usage

## What's here

```
.agents/
  agents/
    livex-architect/agent.md      diagnose & design fixes (no write tools, on purpose)
    livex-android-ui/agent.md     implement UI: bottom nav, top bar, layout, animation
    livex-debugger/agent.md       crashes, TDZ errors, stack traces, race conditions
    livex-release/agent.md        versioning, signed builds, GitHub/Firebase release pipeline
  hooks.json                       wires the safety-gate script below into PreToolUse
scripts/
  verify-git-safety.sh             blocks `git add .`, flags force-push
  verify-platform-scope.sh         soft reminder of WEB vs APK scope on file writes
```

Install: copy the `.agents/` folder and `scripts/` folder into the root of your `chordex-app`
repo, then `chmod +x scripts/*.sh`. Antigravity auto-discovers agents under
`.agents/agents/<name>/agent.md` and hooks under `.agents/hooks.json` — this is the
officially documented workspace-local location, confirmed against current Antigravity docs.

## Starting with 4, not 6

The original proposal listed 6 agents. Starting with 4 (Architect, Android UI, Debugger,
Release) is the right call — QA and Researcher are real candidates later, but only if you
find yourself repeating the same "run these smoke tests" or "look up how X API works"
instructions across sessions. Add them when that pattern actually shows up, not preemptively.

## When to use which

**livex-architect** — when you don't yet know *why* something is happening, or a fix will
touch more than one subsystem (e.g. "the bottom nav and the top bar are both drifting, is
that the same root cause?"). It has no write tools by design, so it can't jump ahead to a fix
before the cause is nailed down. Hand its output to android-ui, debugger, or release.

**livex-android-ui** — the one you'll use most, based on this project's history: bottom nav
material/behavior, top bar position, design-token migration, icon animation, collapse/scroll
jank. Good for self-contained visual work even without a prior architect pass, since it
carries the DFV discipline itself.

**livex-debugger** — anything with a stack trace or an error message: the TDZ crashes, the
recurring `ReferenceError: Cannot access 'X' before initialization` pattern, race conditions.
It knows the project's specific crash history and won't assume a new crash matches an old
one just because the shape looks similar.

**livex-release** — version bumps, the 3-stage pipeline, changelog requirements, actual
publishing. Its `commandExecutionPolicy: confirm` plus an explicit instruction in the prompt
body means it should pause before anything that actually ships — verify this behavior once
in practice, since it's the one agent where a mistake is genuinely hard to undo.

## How to select one

- GUI: pick it from the agent dropdown, or let the Default agent delegate to it automatically
  (each agent has `subagent: true`, so the coordinator can invoke it via `invoke_subagent`
  based on its `description` field — write good descriptions, they're what routing decisions
  are made from).
- CLI: `agy --agent livex-android-ui`, or `/agents` to browse and select interactively.

You don't have to pick manually every time — talking to the Default/coordinator agent and
describing the problem should route correctly on its own, since the `description` fields are
written to be distinguishing. Manual selection is worth it when you already know exactly
which specialist you want and don't want to spend a turn on routing.

## Two things to verify live before trusting this fully

1. **Exact tool names.** Antigravity's docs flag a known issue: a misspelled or unmapped tool
   name in an agent's `tools` list can cause it to hang rather than error clearly. The names
   used here (`view_file`, `grep_search`, `run_command`, `replace_file_content`,
   `write_to_file`) match what's shown in current examples, but double-check them against
   your installed Antigravity version's actual tool list before relying on these agents for
   anything time-sensitive.

2. **Hook input JSON shape.** The exact key path for a command's argument string inside the
   PreToolUse input JSON isn't fully pinned down across current public documentation. Both
   scripts in `scripts/` check a few plausible paths defensively, but test the safety gate
   once deliberately — ask an agent to run `git add .` and confirm the hook actually fires
   and denies it — before depending on it as a real guardrail.

## What moved out of every prompt and into these agents permanently

Instead of repeating in every prompt: read AGENTS.md, read ARCHITECTURE_INDEX.md, don't use
`git add .`, respect WEB vs APK scope, diagnose before fixing, measure before/after, validate
on Android not just the web dev server, don't touch unrelated code — all of that now lives in
the relevant agent's system prompt. A prompt to `livex-android-ui` can now just be the
objective and the evidence, the same way the DFV prompts in this thread have looked, minus
the boilerplate rules that were being retyped every time.
