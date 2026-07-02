# Reusable Knowledge — Firestore Rules

This document outlines Firestore database security rules.

---

## User Gating Profile
- Gated path: `users/{userId}`
- Checked rule: `request.auth.uid == userId`
- Rejects unauthorized profile elevations.

Source:
* [firestore.rules](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/firestore.rules#L4-L10)
