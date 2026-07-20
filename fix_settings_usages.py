import re
import os

files = [
    'src/lib/diagnostics/activityLogger.ts',
    'src/lib/diagnostics/devTools.ts',
    'src/lib/hooks/useT.ts',
    'src/lib/services/permissions.ts',
    'src/lib/startup/startupCoordinator.ts',
    'src/lib/sync/sync.ts',
    'src/lib/updater/telemetry.ts',
    'src/repositories/UserRepository.ts'
]

for file in files:
    path = os.path.join('packages', 'studio-core', file)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace useChordStore.getState().settings with useSettingsStore.getState().settings
        # And ensure useSettingsStore is imported
        if 'useChordStore.getState().settings' in content:
            content = content.replace('useChordStore.getState().settings', 'useSettingsStore.getState().settings')
            if 'useSettingsStore' not in content:
                content = "import { useSettingsStore } from '../../store/useSettingsStore';\n" + content
                content = content.replace("import { useSettingsStore } from '../../store/useSettingsStore';\nimport { useSettingsStore }", "import { useSettingsStore }") # basic deduplication just in case
                
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
