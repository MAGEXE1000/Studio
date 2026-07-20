const fs = require('fs');
let c = fs.readFileSync('packages/ui-shared/src/components/cards/AccountCard.tsx', 'utf8');

c = c.replace(/const\s+\{\s*getCacheSize\s*\}\s*=\s*await\s+import\(['"].*?stemCache['"]\);/g, "const { groovexStemRepository } = await import('@workspace/studio-core');");
c = c.replace(/const\s+sizeInfo\s*=\s*await\s+getCacheSize\(\);/g, "const sizeInfo = await groovexStemRepository.getCacheSize();");

c = c.replace(/const\s+\{\s*clearAllCache\s*\}\s*=\s*await\s+import\(['"].*?stemCache['"]\);/g, "const { groovexStemRepository } = await import('@workspace/studio-core');");
c = c.replace(/await\s+clearAllCache\(\);/g, "await groovexStemRepository.clearAllCache();");

fs.writeFileSync('packages/ui-shared/src/components/cards/AccountCard.tsx', c);
