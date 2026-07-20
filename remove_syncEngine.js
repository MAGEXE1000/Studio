const fs = require('fs');

const path = 'packages/studio-core/src/index.ts';
let code = fs.readFileSync(path, 'utf8');
code = code.replace("export * from './lib/sync/syncEngine';", "");
fs.writeFileSync(path, code, 'utf8');
