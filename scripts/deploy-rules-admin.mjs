import fs from 'fs';
import path from 'path';
import * as appModule from 'firebase-admin/app';
import * as rulesModule from 'firebase-admin/security-rules';

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
console.log('[rules-deployer] Service Account Email:', serviceAccount.client_email);
const app = appModule.initializeApp({
  credential: appModule.cert(serviceAccount)
});

const rulesPath = path.resolve('firestore.rules');
if (!fs.existsSync(rulesPath)) {
  console.error(`[rules-deployer] ✗ firestore.rules file not found at ${rulesPath}`);
  process.exit(1);
}

const rulesContent = fs.readFileSync(rulesPath, 'utf8');
try {
  console.log('[rules-deployer] Creating and releasing Firestore ruleset from source...');
  const rules = rulesModule.getSecurityRules(app);
  await rules.releaseFirestoreRulesetFromSource(rulesContent);
  console.log('✓ Firestore security rules deployed successfully!');
} catch (err) {
  console.error('[rules-deployer] ✗ Failed to deploy rules:', err);
  process.exit(1);
}
