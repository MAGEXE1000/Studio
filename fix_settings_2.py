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
            
        original_content = content
        
        # In some files, we have: const store = useChordStore.getState();
        # and then store.settings
        # Let's replace `store.settings` with `useSettingsStore.getState().settings`
        # IF it's in a place where `store = useChordStore.getState()` exists.
        # Alternatively, since useSettingsStore holds settings, let's just replace `.settings` on `useChordStore` instances.
        
        content = re.sub(r'store\.settings', 'useSettingsStore.getState().settings', content)
        content = re.sub(r'useChordStore\.getState\(\)\.settingsController', 'settingsController', content)
        
        if 'useSettingsStore.getState().settings' in content or 'settingsController' in content:
            if 'useSettingsStore' not in content:
                content = "import { useSettingsStore, settingsController } from '../../store/useSettingsStore';\n" + content
            elif 'settingsController' not in content and 'useSettingsStore.getState().settings' in content:
                # Need settingsController? Not necessarily, but maybe.
                pass
                
        # For sync.ts specifically:
        if file == 'src/lib/sync/sync.ts':
            content = content.replace("import { settingsController } from '../../index';", "import { settingsController, useSettingsStore } from '../../index';")
            
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
