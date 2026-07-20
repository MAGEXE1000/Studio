const fs = require('fs');

const path = 'packages/studio-core/src/lib/sync/sync.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove bad imports completely
code = code.replace(/import\s*\{\s*subscribeAuth,\s*signOut\s*(,\s*updateLocalAuthUser)?\s*\}\s*from\s*'[^']+';/g, '');
code = code.replace(/import\s*\{\s*getAllSessions,\s*saveSession,\s*deleteSession\s*\}\s*from\s*'[^']+';/g, '');
code = code.replace(/import\s*\{\s*getAllLabSessions,\s*saveLabSession,\s*deleteLabSession\s*as\s*dbDeleteSession\s*\}\s*from\s*'[^']+';/g, '');
code = code.replace(/import\s*\{\s*getAllLabSessions,\s*saveLabSession,\s*deleteLabSession\s*as\s*dbDeleteSession,\s*type\s*LabLayer,\s*type\s*LabSession\s*\}\s*from\s*'[^']+';/g, '');

// Ensure authRepository is imported
if (!code.includes('import { authRepository')) {
  code = "import { authRepository, type AuthUser } from '../../repositories/AuthRepository';\n" + code;
}

// Ensure vocalexRepository is imported
if (!code.includes('import { vocalexRepository }')) {
  code = "import { vocalexRepository } from '../../repositories/VocalexRepository';\n" + code;
}

// 2. Fix the useSettingsStore on ChordStore error
code = code.replace(/store\.useSettingsStore\.getState\(\)\.settingsController\.updateSettings/g, "useSettingsStore.getState().settingsController.updateSettings");
code = code.replace(/store\.updateSettings/g, "useSettingsStore.getState().settingsController.updateSettings");

fs.writeFileSync(path, code, 'utf8');
