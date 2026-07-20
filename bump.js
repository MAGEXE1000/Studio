const fs = require('fs');
let appV = fs.readFileSync('packages/studio-core/src/lib/startup/appVersion.ts', 'utf8');
appV = appV.replace(
  /export const NATIVE_VERSION = '[^']+';/,
  "export const NATIVE_VERSION = '4.0.33';"
);
appV = appV.replace(/export const WEB_VERSION = '[^']+';/, "export const WEB_VERSION = '4.0.33';");
fs.writeFileSync('packages/studio-core/src/lib/startup/appVersion.ts', appV);

let andP = JSON.parse(fs.readFileSync('apps/studio-android/package.json', 'utf8'));
andP.version = '4.0.33';
fs.writeFileSync('apps/studio-android/package.json', JSON.stringify(andP, null, 2) + '\n');

let webP = JSON.parse(fs.readFileSync('apps/studio-web/package.json', 'utf8'));
webP.version = '4.0.33';
fs.writeFileSync('apps/studio-web/package.json', JSON.stringify(webP, null, 2) + '\n');

let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '4.0.33';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('Version bumped to 4.0.33');
