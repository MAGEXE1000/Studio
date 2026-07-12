import fs from 'fs';

const src = fs.readFileSync('packages/studio-core/src/lib/updater/stateMachine.ts', 'utf8');
console.log(src);
