import os
import re

def fix_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace useChordStore.getState().settings with useSettingsStore.getState().settings
    content = re.sub(r'useChordStore(\.getState\(\))?\.settings', 'useSettingsStore.getState().settings', content)

    # Add import if missing
    if 'useSettingsStore.getState().settings' in content and 'useSettingsStore' not in content[:content.find(';')]:
        # Simple heuristic: find useChordStore import and append if useSettingsStore not already imported
        if 'import { useSettingsStore }' not in content:
            content = re.sub(
                r"(import \{[^}]*useChordStore[^}]*\} from '[^']+';)",
                r"\1\nimport { useSettingsStore } from '../../store/useSettingsStore';",
                content,
                count=1
            )

    # Specific fix for sync.ts
    if filepath.endswith('sync.ts'):
        content = re.sub(r"store\.settings", "useSettingsStore.getState().settings", content)
        content = re.sub(r"store\.updateSettings", "useSettingsStore.getState().settingsController.updateSettings", content)
        content = re.sub(r"import \{ authRepository, type AuthUser \} from '\.\./services/auth';", "import { authRepository, type AuthUser } from '../../lib/auth';", content)
        content = re.sub(r"import type \{ TakeRecord \} from '\.\./\.\./vocalex/takesDb';", "import type { TakeRecord } from '../../store/useVocalexStore';", content)
        content = re.sub(r"import type \{ LabLayer, LabSession \} from '\.\./\.\./vocalex/labSessionDb';", "import type { LabLayer, LabSession } from '../../store/useVocalexStore';", content)

    # Specific fix for devTools.ts / startupCoordinator.ts / telemetry.ts duplicate imports
    content = re.sub(r"(import \{ useSettingsStore \} from '\.\./\.\./store/useSettingsStore';\s*){2,}", r"\1", content)
    
    # NavigationDispatcher paths
    content = content.replace("from '../../navigation/NavigationDispatcher'", "from '../navigation/NavigationDispatcher'")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Apply to all
files = [
    'packages/studio-core/src/lib/diagnostics/activityLogger.ts',
    'packages/studio-core/src/lib/diagnostics/devTools.ts',
    'packages/studio-core/src/lib/hooks/useT.ts',
    'packages/studio-core/src/lib/preferences/themeEngine.ts',
    'packages/studio-core/src/lib/services/permissions.ts',
    'packages/studio-core/src/lib/startup/startupCoordinator.ts',
    'packages/studio-core/src/lib/updater/telemetry.ts',
    'packages/studio-core/src/lib/sync/sync.ts',
    'packages/studio-core/src/repositories/UserRepository.ts'
]

for f in files:
    fix_file(f)
