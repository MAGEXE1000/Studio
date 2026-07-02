# Chordex Studio — Firebase Services Guide

This document describes the Firebase database schemas, authentication architectures, security rules, and metadata hosting structures.

---

## 1. Firebase Service Architecture

```
                                  ┌─────────────────┐
                                  │  Firebase Auth  │
                                  └────────┬────────┘
                                           │
                ┌──────────────────────────┼──────────────────────────┐
                ▼                          ▼                          ▼
      ┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
      │     Firestore     │      │   Cloud Storage   │      │ Firebase Hosting  │
      │  (User Databases) │      │  (Asset Packages) │      │  (OTA & SPA Web)  │
      └───────────────────┘      └───────────────────┘      └───────────────────┘
```

* **Firebase Authentication**: User accounts authorization system. Handles email/password and anonymous credentials.
* **Cloud Firestore**: Document database storing user preferences, chords sessions, sequencer templates, and practice progress.
* **Cloud Storage**: Hosts compiled APK release files, assets packs, and changelog markdown fragments.
* **Firebase Hosting**: Distributes compiled web SPA packages and houses public OTA check files (`version.json`, `app-release.json`).

---

## 2. OTA Metadata Structure

Firebase Hosting distributes version metadata consumed by the app's OTA update manager.

### Version Mapping File (`version.json`)
Located at Hosting root `/version.json`. Specifies the latest valid version tag.
```json
{
  "version": "3.7.56"
}
```

### App Release Package Manifest (`app-release.json`)
Located at Hosting root `/app-release.json`. Defines the target release file, version labels, minimum requirements, and integrity checks.
```json
{
  "version": "3.7.56",
  "versionCode": 184,
  "apkUrl": "https://github.com/MAGEXE1000/Studio/releases/download/v3.7.56/studio-release.apk",
  "sha256": "4a7b8c...d9ef01",
  "mandatory": false,
  "changelog": [
    "Improved diagnostics dashboard styling",
    "Resolved touch interception bugs on scrolling views",
    "Cleaned up React hooks compiler errors"
  ]
}
```

---

## 3. Firestore Security Rules (`firestore.rules`)

To enforce data privacy, Firestore documents are locked to authenticated owner contexts:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 4. Cloud Storage Rules (`storage.rules`)

Storage buckets separate public release binaries from private user audio recording uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /releases/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
