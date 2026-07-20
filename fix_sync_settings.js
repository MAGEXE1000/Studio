const fs = require('fs');

const path = 'packages/studio-core/src/lib/sync/sync.ts';
let code = fs.readFileSync(path, 'utf8');

// Fix updateSettings
code = code.replace(/useSettingsStore\.getState\(\)\.settingsController\.updateSettings/g, 'useSettingsStore.getState().updateSettings');

// Fix saveSession
code = code.replace(/(?<!vocalexRepository\.)saveSession\(/g, 'vocalexRepository.saveSession(');

// Fix remaining auth import
code = code.replace(/import\('\.\.\/services\/auth'\)/g, "import('../../repositories/AuthRepository')");

fs.writeFileSync(path, code, 'utf8');
