import os
import re

files_to_update = {
    'packages/studio-core/src/lib/diagnostics/activityLogger.ts': [
        ('useChordStore.getState().settings', 'useSettingsStore.getState().settings'),
        ("import { useChordStore } from '../../store/useChordStore';", "import { useChordStore } from '../../store/useChordStore';\nimport { useSettingsStore } from '../../store/useSettingsStore';")
    ],
    'packages/studio-core/src/lib/diagnostics/devTools.ts': [
        ('useChordStore.getState().settings', 'useSettingsStore.getState().settings'),
        ("import { useChordStore } from '../../store/useChordStore';", "import { useChordStore } from '../../store/useChordStore';\nimport { useSettingsStore } from '../../store/useSettingsStore';"),
        ("import { NavigationDispatcher } from '../../navigation/NavigationDispatcher';", "import { NavigationDispatcher } from '../navigation/NavigationDispatcher';")
    ],
    'packages/studio-core/src/lib/hooks/useT.ts': [
        ('useChordStore.getState().settings', 'useSettingsStore.getState().settings'),
        ("import { useChordStore } from '../../store/useChordStore';", "import { useChordStore } from '../../store/useChordStore';\nimport { useSettingsStore } from '../../store/useSettingsStore';")
    ],
    'packages/studio-core/src/lib/navigation/useApplicationTransitionStore.ts': [
        ("import { type AppKey", "import type { AppKey } from '../../store/useSettingsStore';\nimport {")
    ],
    'packages/studio-core/src/lib/preferences/themeEngine.ts': [
        ("import { NavigationDispatcher } from '../../navigation/NavigationDispatcher';", "import { NavigationDispatcher } from '../navigation/NavigationDispatcher';")
    ],
    'packages/studio-core/src/lib/services/index.ts': [
        ("export * from './auth';", "export * from '../auth';"),
        ("export * from './accountStatus';", "export * from '../accountStatus';")
    ],
    'packages/studio-core/src/lib/services/permissions.ts': [
        ('useChordStore.getState().settings', 'useSettingsStore.getState().settings'),
        ("import { useChordStore } from '../../store/useChordStore';", "import { useChordStore } from '../../store/useChordStore';\nimport { useSettingsStore } from '../../store/useSettingsStore';"),
        ('updateLocalAuthUser(newUser)', 'updateLocalAuthUser()'),
        ('updateLocalAuthUser(auth)', 'updateLocalAuthUser()')
    ],
    'packages/studio-core/src/lib/startup/startupCoordinator.ts': [
        ('useChordStore.getState().settings', 'useSettingsStore.getState().settings'),
        ("import { useChordStore } from '../../store/useChordStore';", "import { useChordStore } from '../../store/useChordStore';\nimport { useSettingsStore } from '../../store/useSettingsStore';"),
        ("import { NavigationDispatcher } from '../../navigation/NavigationDispatcher';", "import { NavigationDispatcher } from '../navigation/NavigationDispatcher';")
    ],
    'packages/studio-core/src/lib/updater/telemetry.ts': [
        ('useChordStore.getState().settings', 'useSettingsStore.getState().settings'),
        ("import { useChordStore } from '../../store/useChordStore';", "import { useChordStore } from '../../store/useChordStore';\nimport { useSettingsStore } from '../../store/useSettingsStore';"),
        ("import { NavigationDispatcher } from '../../navigation/NavigationDispatcher';", "import { NavigationDispatcher } from '../navigation/NavigationDispatcher';")
    ],
    'packages/studio-core/src/lib/sync/sync.ts': [
        ("import { authRepository, type AuthUser } from '../services/auth';", "import { authRepository, type AuthUser } from '../../lib/auth';"),
        ("import type { TakeRecord } from '../../vocalex/takesDb';", "import type { TakeRecord } from '../../store/useVocalexStore';"),
        ("import type { LabLayer, LabSession } from '../../vocalex/labSessionDb';", "import type { LabLayer, LabSession } from '../../store/useVocalexStore';"),
        ("store.settings", "useSettingsStore.getState().settings"),
        ("store.updateSettings", "useSettingsStore.getState().settingsController.updateSettings"),
        ("useChordStore.getState().settingsController", "settingsController"),
        ("import { settingsController } from '../../index';", "import { settingsController, useSettingsStore } from '../../store/useSettingsStore';")
    ],
    'packages/studio-core/src/repositories/UserRepository.ts': [
        ("import { useSettingsStore } from '../../store/useSettingsStore';", "import { useSettingsStore } from '../store/useSettingsStore';"),
        ("useChordStore.getState().settings", "useSettingsStore.getState().settings")
    ]
}

for path, replacements in files_to_update.items():
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        for search, replace in replacements:
            if search in content:
                content = content.replace(search, replace)
        # Fix missing imports safely without regex replacement loops
        if path == 'packages/studio-core/src/lib/sync/sync.ts':
            if 'import { useSettingsStore }' not in content:
                content = "import { useSettingsStore } from '../../store/useSettingsStore';\n" + content
        if path == 'packages/studio-core/src/repositories/UserRepository.ts':
            if 'import { useSettingsStore }' not in content:
                content = "import { useSettingsStore } from '../store/useSettingsStore';\n" + content
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

# Remove local declaration of AppKey from useApplicationTransitionStore.ts
path = 'packages/studio-core/src/lib/navigation/useApplicationTransitionStore.ts'
if os.path.exists(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r'type AppKey =[^;]+;', '', content)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
        
# Fix parseDoc calls in UserRepository.ts
path = 'packages/studio-core/src/repositories/UserRepository.ts'
if os.path.exists(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("private parseDoc(): AccountDoc | null {", "private parseDoc(data: any): AccountDoc | null {")
    content = content.replace("return this.parseDoc());", "return this.parseDoc(snap.data());")
    content = content.replace("cb(snap.exists() ? this.parseDoc()) : null),", "cb(snap.exists() ? this.parseDoc(snap.data()) : null),")
    content = content.replace("this.parseDoc()", "this.parseDoc(snap.data())")
    # But wait, there are multiple places where parseDoc is called.
    # Let's just use regex for all calls:
    content = re.sub(r'this\.parseDoc\(\)', r'this.parseDoc(snap.data())', content)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
