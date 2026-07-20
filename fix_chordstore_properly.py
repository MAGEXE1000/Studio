import re
import os

file_path = 'packages/studio-core/src/store/useChordStore.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove AppSettings interface
content = re.sub(r'export interface AppSettings \{.*?\n\}\n*', '', content, flags=re.DOTALL)

# Add imports
if 'Theme, AccentColor' not in content:
    content = content.replace(
        "import { type NavigationRoute } from '../lib/navigation/navigationTypes';",
        "import { type NavigationRoute } from '../lib/navigation/navigationTypes';\nimport type { Theme, AccentColor, AnimationSpeed, DisplayDensity, Language, ActivePanel, AppKey, PerAppVisuals } from './useSettingsStore';"
    )

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
