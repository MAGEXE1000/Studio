# Version 4.5.7

Release Date: 2026-08-07

Release Date: 2026-08-07

### Added
- Automated regression test for version 4.5.7 release pipeline.


Each release on the OTA channel is described in its own section below.
The release script (`scripts/release-firebase.mjs`) reads this file and
copies the bullet list under the section that matches the current
`APP_VERSION` into `version.json`'s `changelog` field, so the in-app
"Update available" modal always shows the actual changes that ship in
that bundle.
