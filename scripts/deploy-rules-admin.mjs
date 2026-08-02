import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Dyn-install firebase-admin if not present
try {
  await import('firebase-admin');
} catch (e) {
  console.log('[rules-deployer] Installing firebase-admin...');
  execSync('npm install firebase-admin', { stdio: 'inherit' });
}

const adminModule = await import('firebase-admin');
const admin = adminModule.default;

const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!saJson) {
  console.error('[rules-deployer] ✗ FIREBASE_SERVICE_ACCOUNT env var is missing');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(saJson);
} catch (e) {
  console.error('[rules-deployer] ✗ FIREBASE_SERVICE_ACCOUNT is not valid JSON:', e);
  process.exit(1);
}

console.log('[rules-deployer] Initializing firebase-admin for project:', serviceAccount.project_id);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const rulesPath = path.resolve('firestore.rules');
if (!fs.existsSync(rulesPath)) {
  console.error(`[rules-deployer] ✗ firestore.rules file not found at ${rulesPath}`);
  process.exit(1);
}

const rulesContent = fs.readFileSync(rulesPath, 'utf8');
try {
  console.log('[rules-deployer] Creating new Firestore ruleset...');
  const rules = admin.securityRules();
  const ruleset = await rules.createRuleset({
    source: [{ name: 'firestore.rules', content: rulesContent }]
  });
  console.log(`[rules-deployer] Ruleset created successfully: ${ruleset.name}`);

  console.log('[rules-deployer] Releasing ruleset for Cloud Firestore...');
  await rules.releaseFirestoreRuleset(ruleset);
  console.log('✓ Firestore security rules deployed successfully!');
} catch (err) {
  console.error('[rules-deployer] ✗ Failed to deploy rules:', err);
  process.exit(1);
}
