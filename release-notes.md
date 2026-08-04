Release Date: 2026-08-04

### Added
- Refactored release infrastructure to use parse-version single source of truth.
- Consolidated duplicate validation checks and optimized pipeline to reduce execution latency.
- Replaced version-locked verifier scripts with a single parameterized post-release checker.
- Fixed undefined appVersionPath ReferenceError in release orchestration signing preflight check.
- Fixed GHA checkout latency by removing blobless clone filters.
- Fixed missing Supabase environment variables in Job 3 Publish step.
- Fixed signing preflight conditional check during --skip-build execution.
- Fixed Capacitor sync and Gradle compile conditionals during --skip-build execution.
