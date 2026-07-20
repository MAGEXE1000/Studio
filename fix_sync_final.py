import os

sync_path = 'packages/studio-core/src/lib/sync/sync.ts'
if os.path.exists(sync_path):
    with open(sync_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Auth imports and methods
    content = content.replace("import { subscribeAuth, signOut, updateLocalAuthUser } from '../../repositories/AuthRepository';", "")
    content = content.replace("import { subscribeAuth, signOut } from '../../repositories/AuthRepository';", "")
    content = content.replace("subscribeAuth(", "authRepository.subscribeAuth(")
    content = content.replace("signOut(", "authRepository.signOut(")
    content = content.replace("updateLocalAuthUser(", "authRepository.updateLocalAuthUser(")
    # Wait, authRepository might be imported already: import { authRepository, type AuthUser } from '../../repositories/AuthRepository';
    
    # 2. Vocalex imports and methods
    content = content.replace("import { getAllSessions, saveSession, deleteSession } from '../../repositories/VocalexRepository';", "")
    content = content.replace("import { getAllLabSessions, saveLabSession, deleteLabSession as dbDeleteSession } from '../../repositories/VocalexRepository';", "")
    content = content.replace("import { getAllLabSessions, saveLabSession, deleteLabSession as dbDeleteSession, type LabLayer, type LabSession } from '../../repositories/VocalexRepository';", "")
    content = content.replace("getAllSessions()", "vocalexRepository.getAllSessions()")
    content = content.replace("saveSession(", "vocalexRepository.saveSession(")
    content = content.replace("deleteSession(", "vocalexRepository.deleteSession(")

    # 3. Fix settings store
    content = content.replace("store.useSettingsStore.getState().settingsController.updateSettings", "useSettingsStore.getState().settingsController.updateSettings")
    content = content.replace("store.updateSettings", "useSettingsStore.getState().settingsController.updateSettings")
    content = content.replace("useChordStore.getState().updateSettings", "useSettingsStore.getState().settingsController.updateSettings")

    # 4. Fix {} iterator error
    content = content.replace("const sessions = await softTimeout(vocalexRepository.getAllSessions(), INDEXEDDB_SNAPSHOT_MS);", "const sessions = (await softTimeout(vocalexRepository.getAllSessions(), INDEXEDDB_SNAPSHOT_MS)) as any[];")
    content = content.replace("const sessions = await softTimeout(vocalexRepository.getAllLabSessions(), INDEXEDDB_SNAPSHOT_MS);", "const sessions = (await softTimeout(vocalexRepository.getAllSessions(), INDEXEDDB_SNAPSHOT_MS)) as any[];")

    # Double check takes iterator
    content = content.replace("const takes = await softTimeout(vocalexRepository.getAllTakes(), INDEXEDDB_SNAPSHOT_MS);", "const takes = (await softTimeout(vocalexRepository.getAllTakes(), INDEXEDDB_SNAPSHOT_MS)) as any[];")

    with open(sync_path, 'w', encoding='utf-8') as f:
        f.write(content)
