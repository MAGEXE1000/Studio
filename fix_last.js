const fs = require('fs');

const path = 'packages/studio-core/src/lib/sync/sync.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/const\s+\{\s*updateLocalAuthUser\s*\}\s*=\s*await\s+import\('[^']+'\);/g, '');
code = code.replace(/import\('[^']+'\)\.then\(\(\{\s*updateLocalAuthUser\s*\}\)\s*=>\s*\{/g, '');
code = code.replace(/\}\);\s*\/\/\s*end auth import/g, ''); // just in case I need to clean up closing brace, wait, I'll just leave it and fix manually if needed. Wait, it's easier to just do a string replacement.

code = code.replace("import('../../repositories/AuthRepository').then(({ updateLocalAuthUser }) => {", "");
code = code.replace("authRepository.updateLocalAuthUser({", "authRepository.updateLocalAuthUser({\n"); // wait, just remove the then closure
// Actually, it's easier to just do:
code = code.replace("import('../../repositories/AuthRepository').then(({ updateLocalAuthUser }) => {\n                  authRepository.updateLocalAuthUser({\n                    displayName: data.displayName,\n                    photoURL: data.photoURL,\n                  });\n                });", "authRepository.updateLocalAuthUser({\n                  displayName: data.displayName,\n                  photoURL: data.photoURL,\n                });");

code = code.replace(/useChordStore\.getState\(\)\.useSettingsStore/g, 'useSettingsStore');

fs.writeFileSync(path, code, 'utf8');
