Release Date: 2026-08-04

### Fixed
- Fixed StageX collaboration connection reliability by enabling Firestore offline persistence.
- Resolved memory leaks and background heartbeat persistence by calling leaveRoom on component unmount and page unload.
- Added max retry limit and exponential backoff to OperationQueue to prevent infinite blocking on permanent errors.
- Added timestamp filtering to operations subscription to prevent replaying historical operations on room join.
- Debounced local state diffing in CollaborationService to optimize Firestore write performance during continuous edits.
- Enforced presence user ownership in Firestore security rules.
- Added auto-leave handler on auth state sign-out in CollaborationService.
