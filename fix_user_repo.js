const fs = require('fs');
const path = require('path');

let userPath = path.join('packages', 'studio-core', 'src', 'repositories', 'UserRepository.ts');
let userCode = fs.readFileSync(userPath, 'utf8');

// Fix parseDoc() back to this.parseDoc(snap.data()) in all places except the signature which is this.parseDoc(data: any)
userCode = userCode.replace(/return this\.parseDoc\(\);/g, 'return this.parseDoc(snap.data());');
userCode = userCode.replace(/cb\(snap\.exists\(\) \? this\.parseDoc\(\) : null\)/g, 'cb(snap.exists() ? this.parseDoc(snap.data()) : null)');

// Add useSettingsStore import if missing
if (!userCode.includes('import { useSettingsStore }')) {
    userCode = "import { useSettingsStore } from '../store/useSettingsStore';\n" + userCode;
}

// Fix settings usages
userCode = userCode.replace(/useChordStore\.getState\(\)\.settings/g, 'useSettingsStore.getState().settings');

fs.writeFileSync(userPath, userCode, 'utf8');

