const fs = require('fs');
const content = fs.readFileSync('packages/ui-shared/src/components/hub/StudioHub.tsx', 'utf8');

const constantsStart = content.indexOf('const FAQ_ITEMS');
if (constantsStart === -1) {
  console.error('Could not find FAQ_ITEMS');
  process.exit(1);
}

const constantsContent = content.substring(constantsStart);
const faqConstantsFile = 'packages/ui-shared/src/components/hub/faqConstants.ts';

const newContent = constantsContent.replace('const FAQ_ITEMS', 'export const FAQ_ITEMS');
fs.writeFileSync(faqConstantsFile, newContent);

const updatedHub = content.substring(0, constantsStart) + '\n';
const lines = updatedHub.split('\n');
const lastImportIdx = lines.findLastIndex((l) => l.startsWith('import '));
lines.splice(lastImportIdx + 1, 0, "import { FAQ_ITEMS } from './faqConstants';");
fs.writeFileSync('packages/ui-shared/src/components/hub/StudioHub.tsx', lines.join('\n'));

console.log('Extracted FAQ_ITEMS');
