# Lessons Learned Database

This database serves as the permanent memory of resolved engineering problems, bugs, and design errors, providing details on how to avoid recurring issues.

---

## 1. Absolute Path reference errors in Subsystem Documentation

- **Problem**: Running document validation on local developer machines or CI servers reported multiple file-not-found `[ERROR]` references.
- **Root Cause**: Absolute link references in sub-app guides were hardcoded to a specific local path: `file:///c:/Users/ayuda/Documents/Studio/chordex-app/`.
- **Fix**:
  1. Ran a recursive file-prefix replacement across all `.md` files to point absolute links to the local workspace location.
  2. Upgraded `scripts/validate-documentation.mjs` path parsing logic to normalize and resolve paths relative to the current workspace root `process.cwd()`.
- **How to Avoid**: Always use relative markdown links or standard `file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/` patterns, and run `pnpm docs:validate` locally before committing.

Source:

- [validate-documentation.mjs](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/scripts/validate-documentation.mjs#L37-L50)
- [internal-index.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/architecture/internal-index.md#L20-L36)

---

## 2. Empty Markdown Headers causing Validator Warnings

- **Problem**: Multiple `[WARNING]` logs reported empty section headers during validation checks.
- **Root Cause**: Headers like `## 2. Platform-Specific Manual QA Checklist` had no immediate text blocks before subsequent subsections or dividers.
- **Fix**: Added brief introductory text under headers to satisfy the validator condition that checks for non-empty text lines.
- **How to Avoid**: Do not leave headers completely empty. Provide a short introductory sentence describing what the subsections contain.

Source:

- [validate-documentation.mjs](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/scripts/validate-documentation.mjs#L95-L125)
