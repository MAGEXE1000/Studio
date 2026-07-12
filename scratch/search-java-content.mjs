import fs from 'fs';

const src = fs.readFileSync('apps/studio-android/android/app/src/main/java/com/chordex/app/AppInstallerPlugin.java', 'utf8');
const lines = src.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('@PluginMethod')) {
    console.log(`${idx + 1}: ${line.trim()}`);
    // Print next 5 lines
    for (let k = 1; k <= 5; k++) {
      console.log(`  +${k}: ${lines[idx + k].trim()}`);
    }
  }
});
