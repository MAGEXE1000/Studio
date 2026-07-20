import os
import re

path = 'packages/studio-core/src/lib/sync/sync.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Auth imports
code = code.replace("import { authRepository, type AuthUser } from '../services/auth';", "import { authRepository, type AuthUser } from '../../repositories/AuthRepository';")
code = code.replace("const { updateLocalAuthUser } = await import('../services/auth');", "")
code = code.replace("import('../services/auth').then(({ updateLocalAuthUser }) => {\n                  updateLocalAuthUser({\n                    displayName: data.displayName,\n                    photoURL: data.photoURL,\n                  });\n                });", "authRepository.updateLocalAuthUser({\n                  displayName: data.displayName,\n                  photoURL: data.photoURL,\n                });")
code = code.replace("updateLocalAuthUser({\n          displayName: profileData.displayName,\n          photoURL: profileData.photoURL,\n        });", "authRepository.updateLocalAuthUser({\n          displayName: profileData.displayName,\n          photoURL: profileData.photoURL,\n        });")

# 2. Vocalex takes
code = code.replace("import { getAllTakes, saveTake, deleteTake as dbDeleteTake, type TakeRecord } from '../../vocalex/takesDb';", "import { vocalexRepository } from '../../repositories/VocalexRepository';\nimport type { TakeRecord } from '../../repositories/VocalexRepository';")
code = code.replace("getAllTakes()", "vocalexRepository.getAllTakes()")
code = code.replace("saveTake(", "vocalexRepository.saveTake(")
code = code.replace("dbDeleteTake(", "vocalexRepository.deleteTake(")

# 3. Vocalex lab sessions
code = code.replace("import { getAllLabSessions, saveLabSession, deleteLabSession as dbDeleteSession, type LabLayer, type LabSession } from '../../vocalex/labSessionDb';", "import type { LabLayer, LabSession } from '../../repositories/VocalexRepository';")
code = code.replace("getAllLabSessions()", "vocalexRepository.getAllSessions()")
code = code.replace("saveLabSession(", "vocalexRepository.saveSession(")
code = code.replace("dbDeleteSession(", "vocalexRepository.deleteSession(")

# 4. Settings store properties
# "Property 'settings' does not exist on type 'ChordStore'"
# We just replace `store.settings` or `state.settings` with `useSettingsStore.getState().settings`
code = code.replace("store.settings", "useSettingsStore.getState().settings")
code = code.replace("state.settings", "useSettingsStore.getState().settings")
code = code.replace("chordStore.settings", "useSettingsStore.getState().settings")

# "Property 'updateSettings' does not exist on type 'ChordStore'"
code = code.replace("store.updateSettings", "useSettingsStore.getState().settingsController.updateSettings")

# 5. Type iterator error
code = code.replace("const takes = await softTimeout(vocalexRepository.getAllTakes(), INDEXEDDB_SNAPSHOT_MS);", "const takes = (await softTimeout(vocalexRepository.getAllTakes(), INDEXEDDB_SNAPSHOT_MS)) as any[];")
code = code.replace("const sessions = await softTimeout(vocalexRepository.getAllSessions(), INDEXEDDB_SNAPSHOT_MS);", "const sessions = (await softTimeout(vocalexRepository.getAllSessions(), INDEXEDDB_SNAPSHOT_MS)) as any[];")

# Also add import for useSettingsStore if missing
if 'import { useSettingsStore }' not in code:
    code = "import { useSettingsStore } from '../../store/useSettingsStore';\n" + code

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)
