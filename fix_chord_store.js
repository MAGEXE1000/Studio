const fs = require('fs');
const path = require('path');

const file = path.join('packages', 'studio-core', 'src', 'store', 'useChordStore.ts');
let code = fs.readFileSync(file, 'utf8');

const importSettings = `import type { Theme, AccentColor, AnimationSpeed, DisplayDensity, Language, ActivePanel, AppKey, PerAppVisuals } from './useSettingsStore';\n`;

if (!code.includes('import type { Theme')) {
  code = code.replace(
    `import { type NavigationRoute } from '../lib/navigation/navigationTypes';`,
    `import { type NavigationRoute } from '../lib/navigation/navigationTypes';\n${importSettings}`
  );
  fs.writeFileSync(file, code, 'utf8');
}
