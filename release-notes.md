Release Date: 2026-08-04

### Added
- Refactored release infrastructure to use parse-version single source of truth.
- Consolidated duplicate validation checks and optimized pipeline to reduce execution latency.
- Replaced version-locked verifier scripts with a single parameterized post-release checker.
- Fixed undefined appVersionPath ReferenceError in release orchestration signing preflight check.
