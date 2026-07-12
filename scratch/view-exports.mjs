import fs from 'fs';

const src = fs.readFileSync('packages/studio-core/src/index.ts', 'utf8');
console.log(src);
