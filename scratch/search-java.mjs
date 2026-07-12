import fs from 'fs';
import path from 'path';

function findJava(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findJava(fullPath);
    } else if (file === 'AppInstallerPlugin.java') {
      console.log(`Found: ${fullPath}`);
    }
  }
}

findJava('apps/studio-android/android');
