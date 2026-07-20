import os

sync_path = 'packages/studio-core/src/lib/sync/sync.ts'
if os.path.exists(sync_path):
    with open(sync_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix bad imports at top of file
    content = content.replace("import { subscribeAuth, type AuthUser, signOut } from '../../repositories/AuthRepository';", "")
    content = content.replace("import { getAllSessions, saveSession, deleteSession as dbDeleteSession, type LabSession, type LabLayer } from '../../repositories/VocalexRepository';", "import type { LabSession, LabLayer } from '../../repositories/VocalexRepository';")

    # Fix bad method calls
    content = content.replace("useChordStore.getState().useSettingsStore.getState().settingsController.updateSettings", "useSettingsStore.getState().settingsController.updateSettings")
    content = content.replace("store.useSettingsStore.getState().settingsController.updateSettings", "useSettingsStore.getState().settingsController.updateSettings")

    # Fix authRepository usage if it's missing updateLocalAuthUser
    # Wait, `updateLocalAuthUser` was in AuthRepository. But in sync.ts it's called on `authRepository`?
    # error TS2339: Property 'updateLocalAuthUser' does not exist on type 'typeof import("...AuthRepository")'.
    # Oh! `AuthRepository` class might NOT have `updateLocalAuthUser` method!
    # Let's check AuthRepository!

    with open(sync_path, 'w', encoding='utf-8') as f:
        f.write(content)
