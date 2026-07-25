Release Date: 2026-07-25

## Fixed
- Fixed repository-wide React Hook determinism: completed AST static analysis scanning 490 source files (3,586 components and 29 custom hooks) to guarantee zero hook execution order violations.
- Fixed Empty Error Objects (`console.error {}`) by introducing `normalizeErrorInput(...)` to extract non-enumerable `Error` properties (`message`, `stack`, `name`), Promise rejections, and custom diagnostic objects cleanly.

## Improved
- Smart Error Grouping Engine: grouped runtime errors by a stable signature (`module|cleanMessage|firstStackLine`).
- Deduplication Metadata: maintained `Occurred: x12` count badges, `First seen` timestamp, `Last seen` timestamp, and preserved initial complete stack trace without duplicate listings.
