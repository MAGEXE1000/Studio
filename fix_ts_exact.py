import os
import re

replacements = {
    'packages/studio-core/src/lib/diagnostics/activityLogger.ts': [
        ('store.settings.activityHistoryEnabled', 'useSettingsStore.getState().settings.activityHistoryEnabled')
    ],
    'packages/studio-core/src/lib/diagnostics/devTools.ts': [
        ('useChordStore?.getState?.()?.settings', 'useSettingsStore?.getState?.()?.settings')
    ],
    'packages/studio-core/src/lib/hooks/useT.ts': [
        ('useChordStore(s => s.settings.language)', 'useSettingsStore(s => s.settings.language)')
    ],
    'packages/studio-core/src/lib/services/permissions.ts': [
        ('state.settings.syncBackendProvider', 'useSettingsStore.getState().settings.syncBackendProvider')
    ],
    'packages/studio-core/src/lib/startup/startupCoordinator.ts': [
        ('storeState.settings', 'useSettingsStore.getState().settings'),
        ('state.settings === prevState.settings', 'false /* settings moved */'),
        ('this.syncSettings(state.settings)', '')
    ],
    'packages/studio-core/src/lib/sync/sync.ts': [
        ('state.settings', 'useSettingsStore.getState().settings'),
        ("'../../store/useVocalexStore'", "'../store/useVocalexStore'")
    ],
    'packages/studio-core/src/lib/updater/telemetry.ts': [
        ('chordStore.settings', 'useSettingsStore.getState().settings')
    ],
    'packages/studio-core/src/repositories/UserRepository.ts': [
        ('state.settings.syncBackendProvider', 'useSettingsStore.getState().settings.syncBackendProvider')
    ]
}

for filepath, reps in replacements.items():
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for search, replace in reps:
        content = content.replace(search, replace)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Clean up duplicate imports in all files
for file in [f for f in os.listdir('packages/studio-core/src/lib/startup') if f.endswith('.ts')] + \
            [f for f in os.listdir('packages/studio-core/src/lib/diagnostics') if f.endswith('.ts')]:
    filepath = ''
    if 'startup' in file:
        filepath = os.path.join('packages/studio-core/src/lib/startup', file)
    else:
        filepath = os.path.join('packages/studio-core/src/lib/diagnostics', file)
    
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remove duplicate useSettingsStore imports using regex
        content = re.sub(r"(import \{ useSettingsStore \} from '[^']+';\s*){2,}", r"\1", content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

