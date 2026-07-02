### Fixed
- Rebuilt the App Update subsystem state machine with 16 deterministic uppercase states.
- Re-engineered version comparison engine to explicitly validate metadata and signatures.
- Linearized check, download, and install execution pipelines to eliminate race conditions.
- Adapted UpdateIndicator UI mapping and Simulation Lab assertions to support the new state structure.
