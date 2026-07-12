const fs = require('fs');
const path = require('path');

const packagesToUpdate = {
  '@capacitor/android': '^6.2.1',
  '@capacitor/app': '^6.0.3',
  '@capacitor/core': '^6.2.1',
  '@capacitor/filesystem': '^6.0.1',
  '@capacitor/local-notifications': '^6.1.3',
  '@capacitor/screen-orientation': '^6.0.4',
  '@capacitor/share': '^6.0.1',
  '@capacitor/status-bar': '^6.0.1',
  '@capacitor/cli': '^6.2.1',
  '@capacitor-firebase/authentication': '^6.3.1',
  '@capacitor/preferences': '^6.0.3'
};

function findPackageJsons(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'dist' || file === 'build') continue;
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findPackageJsons(fullPath, fileList);
    } else if (file === 'package.json') {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const rootDir = path.join(__dirname, '..');
const packageJsonPaths = findPackageJsons(rootDir);

for (const fullPath of packageJsonPaths) {
  try {
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    let modified = false;
    
    for (const section of ['dependencies', 'devDependencies']) {
      if (data[section]) {
        for (const dep in data[section]) {
          if (packagesToUpdate[dep] && data[section][dep] !== packagesToUpdate[dep]) {
            data[section][dep] = packagesToUpdate[dep];
            modified = true;
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n');
      console.log(`Reverted ${path.relative(rootDir, fullPath)}`);
    }
  } catch(e) {}
}
