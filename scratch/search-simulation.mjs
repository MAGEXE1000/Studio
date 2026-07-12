import fs from 'fs';

const otaUpdateSrc = fs.readFileSync('packages/studio-core/src/lib/otaUpdate.ts', 'utf8');
const lines = otaUpdateSrc.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('updaterSimulation') || line.includes('Simulation')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
