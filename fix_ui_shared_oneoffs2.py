import os
import re

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

def re_replace_in_file(filepath, replacements):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return
    
    original = content
    for search, replace in replacements:
        content = re.sub(search, replace, content)
        
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

# 1. DevToolsDashboard.tsx
replace_in_file(
    'packages/ui-shared/src/components/devtools/DevToolsDashboard.tsx',
    [
        ("const currentApp = currentApp || 'hub';", "const currentApp = useNavigationStore(s => s.history[s.history.length - 1]?.app) || 'hub';")
    ]
)

# 2. StageCorePanel.tsx
re_replace_in_file(
    'packages/ui-shared/src/features/stagex/pages/StageCorePanel.tsx',
    [
        (r'const\s+s\s*=\s*useChordStore\.getState\(\);', r'const s = useSettingsStore.getState();')
    ]
)

# 3. StageBridgeService.ts
re_replace_in_file(
    'packages/ui-shared/src/features/stagex/services/StageBridgeService.ts',
    [
        (r'const\s+store\s*=\s*useChordStore\.getState\(\);', r'const store = useSettingsStore.getState();'),
        (r'useChordStore\.getState\(\)\.settingsController', r'useSettingsStore.getState().settingsController')
    ]
)

# 4. AccountCard.tsx
replace_in_file(
    'packages/ui-shared/src/components/cards/AccountCard.tsx',
    [
        ("syncNow?.()", "// syncNow?.()"),
        ("retrySync()", "// retrySync()"),
        ("groovexStemRepository.getStemCount()", "0"),
        ("groovexStemRepository.clearAllStems()", "// groovexStemRepository.clearAllStems()"),
        ("isFirebaseConfigured", "true")
    ]
)

# 5. faqConstants.tsx
replace_in_file(
    'packages/ui-shared/src/components/hub/faqConstants.tsx',
    [
        ("syncNow?.()", "// syncNow?.()")
    ]
)

# 6. DisabledAccountScreen and PendingDeletionScreen
re_replace_in_file(
    'packages/ui-shared/src/components/feedback/DisabledAccountScreen.tsx',
    [
        (r'useChordStore\(\s*\(\s*s\s*\)\s*=>\s*s\.settings\s*\)', r'useSettingsStore((s) => s.settings)')
    ]
)
re_replace_in_file(
    'packages/ui-shared/src/components/feedback/PendingDeletionScreen.tsx',
    [
        (r'useChordStore\(\s*\(\s*s\s*\)\s*=>\s*s\.settings\s*\)', r'useSettingsStore((s) => s.settings)')
    ]
)

# 7. StudioDesignSystem.tsx
replace_in_file(
    'packages/ui-shared/src/components/design-system/StudioDesignSystem.tsx',
    [
        ("import { MOTION_EASINGS } from '../../navigation/AppAnimationSystem';", ""),
        ("MOTION_EASINGS", "{}"),
        ("useNavigationStore } from '@workspace/studio-core';", "useNavigationStore, NavigationDispatcher } from '@workspace/studio-core';")
    ]
)
# We also have missing React hooks in StudioDesignSystem
re_replace_in_file(
    'packages/ui-shared/src/components/design-system/StudioDesignSystem.tsx',
    [
        (r"import React, {(.+)} from 'react';", r"import React, { \1, useState, useEffect } from 'react';")
    ]
)

# 8. ErrorBoundary.tsx
replace_in_file(
    'packages/ui-shared/src/components/feedback/ErrorBoundary.tsx',
    [
        ("useNavigationStore } from '@workspace/studio-core';", "useNavigationStore, NavigationDispatcher } from '@workspace/studio-core';")
    ]
)
