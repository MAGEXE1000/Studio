import fs from 'fs';

const src = fs.readFileSync('packages/ui-shared/src/components/StudioHub.tsx', 'utf8');
const lines = src.split('\n');

// Search for imports from studio-core or references to checkForUpdate or globalOtaState
lines.forEach((line, idx) => {
  if (line.includes('@workspace/studio-core') || line.includes('checkForUpdate') || line.includes('globalOtaState') || line.includes('otaUpdateState')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
