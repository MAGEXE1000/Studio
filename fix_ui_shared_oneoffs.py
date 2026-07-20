import os

def replace_in_file(filepath, replacements):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return
    
    original = content
    for search, replace in replacements:
        content = content.replace(search, replace)
        
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

# 1. StudioHub.tsx
replace_in_file(
    'packages/ui-shared/src/components/hub/StudioHub.tsx',
    [
        ('syncNow?.()', '// syncNow?.()'),
        ('currentApp ||', 'activeRouteApp ||'),
        ('[currentApp, zooming]', '[activeRouteApp, zooming]'),
        ('[currentApp]', '[activeRouteApp]'),
        ("currentApp === 'hub'", "activeRouteApp === 'hub'")
    ]
)

# 2. StudioLayoutSystem.tsx
replace_in_file(
    'packages/ui-shared/src/components/layout/StudioLayoutSystem.tsx',
    [
        ("import { MOTION_EASINGS } from '../../navigation/AppAnimationSystem';", ""),
        ("MOTION_EASINGS", "{}") # Fallback since we don't know exactly how it's used
    ]
)

# 3. ApplyToSheet.tsx
replace_in_file(
    'packages/ui-shared/src/components/sheets/ApplyToSheet.tsx',
    [
        ("useNavigationStore } from '@workspace/studio-core';", "useNavigationStore, NavigationDispatcher } from '@workspace/studio-core';")
    ]
)

# 4. StageCorePanel wrapper
replace_in_file(
    'packages/ui-shared/src/components/StageCorePanel.tsx',
    [
        ("./feature/StageCorePanel", "../features/stagex/pages/StageCorePanel")
    ]
)
