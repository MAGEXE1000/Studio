import fs from 'fs';

const src = fs.readFileSync('packages/ui-shared/src/components/DevToolsDashboard.tsx', 'utf8');
const lines = src.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('Inject Download Failure') || line.includes('Inject Connection Timeout') || line.includes('Inject SHA Failure') || line.includes('Inject Signature Conflict') || line.includes('Inject Invalid APK')) {
    console.log(`${idx + 1}: ${line.trim()}`);
    // Print next 10 lines
    for (let k = 1; k <= 10; k++) {
      console.log(`  +${k}: ${lines[idx + k].trim()}`);
    }
  }
});
