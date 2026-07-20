const fs = require('fs');
let c = fs.readFileSync('packages/studio-core/src/lib/updater/stateMachine.ts', 'utf8');

c = c.replace(/vocalexRepository\.saveSession\(\);/g, 'saveSession();');
c = c.replace(/import\s+\{\s*vocalexRepository\s*\}\s*from\s+['"]\.\.\/\.\.\/repositories\/VocalexRepository['"];?\n?/g, '');

fs.writeFileSync('packages/studio-core/src/lib/updater/stateMachine.ts', c);
