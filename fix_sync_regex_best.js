const fs = require('fs');

const path = 'packages/studio-core/src/lib/sync/sync.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Top-level imports
code = code.replace(/import\s*\{\s*subscribeAuth,\s*type\s*AuthUser,\s*signOut\s*\}\s*from\s*'[^']+';/, "import { authRepository, type AuthUser } from '../../repositories/AuthRepository';");
code = code.replace(/import\s*\{\s*getAllSessions,\s*saveSession,\s*deleteSession\s*as\s*dbDeleteSession,\s*type\s*LabSession,\s*type\s*LabLayer\s*\}\s*from\s*'[^']+';/, "import type { LabSession, LabLayer } from '../../repositories/VocalexRepository';");

// 2. Auth calls
code = code.replace(/const\s*\{\s*updateLocalAuthUser\s*\}\s*=\s*await\s*import\('[^']+'\);/g, '');
code = code.replace(/import\('[^']+'\)\.then\(\(\{\s*updateLocalAuthUser\s*\}\)\s*=>\s*\{([\s\S]*?updateLocalAuthUser\([^}]+\}\);)\s*\}\);/g, (match, p1) => {
    return p1.replace(/updateLocalAuthUser\(/g, "authRepository.updateLocalAuthUser(");
});
code = code.replace(/(?<!authRepository\.)updateLocalAuthUser\(/g, 'authRepository.updateLocalAuthUser(');
code = code.replace(/subscribeAuth\(/g, 'authRepository.subscribeAuth(');
code = code.replace(/signOut\(/g, 'authRepository.signOut(');

// 3. Settings updates
code = code.replace(/store\.updateSettings/g, 'useSettingsStore.getState().settingsController.updateSettings');
code = code.replace(/useChordStore\.getState\(\)\.updateSettings/g, 'useSettingsStore.getState().settingsController.updateSettings');
code = code.replace(/store\.settings/g, 'useSettingsStore.getState().settings');
code = code.replace(/state\.settings/g, 'useSettingsStore.getState().settings');
code = code.replace(/chordStore\.settings/g, 'useSettingsStore.getState().settings');
code = code.replace(/useChordStore\.getState\(\)\.settings/g, 'useSettingsStore.getState().settings');

// 4. {} iterators (Vocalex calls were mapped successfully in Python, but let's cast them)
code = code.replace(/const\s+sessions\s*=\s*await\s+softTimeout\([^,]+,\s*INDEXEDDB_SNAPSHOT_MS\);/g, 'const sessions = (await softTimeout(vocalexRepository.getAllSessions(), INDEXEDDB_SNAPSHOT_MS)) as any[];');
code = code.replace(/const\s+takes\s*=\s*await\s+softTimeout\([^,]+,\s*INDEXEDDB_SNAPSHOT_MS\);/g, 'const takes = (await softTimeout(vocalexRepository.getAllTakes(), INDEXEDDB_SNAPSHOT_MS)) as any[];');

fs.writeFileSync(path, code, 'utf8');
