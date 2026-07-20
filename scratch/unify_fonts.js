const fs = require('fs');
const path = require('path');

function replaceInFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  let original = content;

  // Replace font families
  content = content.replace(/'Manrope, sans-serif'/g, "'var(--font-headline)'");
  content = content.replace(/"Manrope, sans-serif"/g, '"var(--font-headline)"');
  content = content.replace(/'Manrope'/g, "'var(--font-headline)'");
  content = content.replace(/"Manrope"/g, '"var(--font-headline)"');

  content = content.replace(/'Inter, sans-serif'/g, "'var(--font-body)'");
  content = content.replace(/"Inter, sans-serif"/g, '"var(--font-body)"');
  content = content.replace(/'Inter'/g, "'var(--font-body)'");
  content = content.replace(/"Inter"/g, '"var(--font-body)"');

  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated fonts in: ${filepath}`);
  }
}

function traverse(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      traverse(full);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      replaceInFile(full);
    }
  }
}

const featuresDir = path.join(__dirname, '../packages/ui-shared/src/features');
traverse(featuresDir);
console.log('Done unifying fonts.');
