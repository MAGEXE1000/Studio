# Chordex Studio — Documentation Validation

This document describes the automated documentation validation system used to prevent doc-drift and verify references.

---

## 1. How Validation Works

The validation suite is driven by a custom Node.js script located at `scripts/validate-documentation.mjs`. The script performs the following validation passes:

* **File Reference Checks**: Scans all `.md` files in `docs/` and extracts markdown link URLs (e.g. `[label](url)`) and lists under `Source:` headers. It resolves relative files and absolute `file:///` URLs relative to the workspace root, checking that the referenced files or folders exist on disk.
* **Placeholder Auditing**: Identifies words matching case-insensitive terms such as `TODO`, `TBD`, `Coming Soon`, or `placeholder` within documentation content.
* **Structural Auditing**: Checks for duplicate headers in the same file to prevent table of contents overlap, and reports empty headers.

---

## 2. How to Run It

To execute the validator, run the script from the repository workspace root:

```bash
node scripts/validate-documentation.mjs
```

Source:
* `scripts/validate-documentation.mjs`

---

## 3. How to Interpret Reports

The validator outputs issues classified under three levels:

* **ERROR**: Critical file references or links that point to files or directories that do not exist in the repository. The script returns an exit code of `1` on error.
* **WARNING**: Placeholders, TBD markers, empty headers, or duplicate section titles. These do not fail the build, but should be cleaned up.
* **INFO**: Informational suggestions.

---

## 4. How to Fix Failures

* **For ERRORs**: Check the filepath. Ensure that the file hasn't been deleted or moved. If it has been moved, update the markdown link or source block reference to point to the new location.
* **For WARNINGs**: Fill in placeholder sections with actual implementation plans and configurations, or remove empty section headers.
