import os
import re

files_to_fix = [
    'packages/studio-core/src/lib/diagnostics/devTools.ts',
    'packages/studio-core/src/lib/preferences/themeEngine.ts',
    'packages/studio-core/src/lib/startup/startupCoordinator.ts',
    'packages/studio-core/src/lib/updater/telemetry.ts'
]

for f in files_to_fix:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        if 'NavigationDispatcher' in content and 'import { NavigationDispatcher }' not in content:
            # Insert import at the top
            content = "import { NavigationDispatcher } from '../navigation/NavigationDispatcher';\n" + content
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)

# Fix sync.ts
sync_path = 'packages/studio-core/src/lib/sync/sync.ts'
if os.path.exists(sync_path):
    with open(sync_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # VocalexRepository
    content = content.replace("'../store/useVocalexStore'", "'../../repositories/VocalexRepository'")
    content = content.replace("'../../vocalex/labSessionDb'", "'../../repositories/VocalexRepository'")
    
    # Auth
    content = content.replace("'../services/auth'", "'../../repositories/AuthRepository'")
    
    # Store settings update method
    content = content.replace("store.updateSettings", "useSettingsStore.getState().settingsController.updateSettings")
    content = re.sub(r"(?<!useSettingsStore\.getState\(\)\.settingsController\.)updateSettings", "useSettingsStore.getState().settingsController.updateSettings", content)
    
    # Fix length error on takes snapshot by making sure the type is cast to TakeRecord[]
    content = content.replace("const takes = await softTimeout(vocalexRepository.getAllTakes(), INDEXEDDB_SNAPSHOT_MS);", "const takes = await softTimeout(vocalexRepository.getAllTakes(), INDEXEDDB_SNAPSHOT_MS) as any[];")
    content = content.replace("const takes = await softTimeout(getAllTakes(), INDEXEDDB_SNAPSHOT_MS);", "const takes = await softTimeout(vocalexRepository.getAllTakes(), INDEXEDDB_SNAPSHOT_MS) as any[];")
    
    # Same for lab sessions
    content = content.replace("const sessions = await softTimeout(vocalexRepository.getAllSessions(), INDEXEDDB_SNAPSHOT_MS);", "const sessions = await softTimeout(vocalexRepository.getAllSessions(), INDEXEDDB_SNAPSHOT_MS) as any[];")
    content = content.replace("const sessions = await softTimeout(getAllLabSessions(), INDEXEDDB_SNAPSHOT_MS);", "const sessions = await softTimeout(vocalexRepository.getAllSessions(), INDEXEDDB_SNAPSHOT_MS) as any[];")
    
    with open(sync_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
