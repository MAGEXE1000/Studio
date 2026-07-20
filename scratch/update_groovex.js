import fs from 'fs';

const filePath = 'packages/ui-shared/src/features/groovex/pages/GroovexApp.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add import statement
const targetImport =
  "import { SharedNavigationContainer } from '../../../navigation/SharedNavigationContainer';";
const replacementImport =
  "import { SharedNavigationContainer } from '../../../navigation/SharedNavigationContainer';\nimport { SharedNavigationBar, type SharedNavigationItem } from '../../../navigation/SharedNavigationBar';";
if (content.includes(targetImport) && !content.includes('SharedNavigationBar')) {
  content = content.replace(targetImport, replacementImport);
  console.log('Added SharedNavigationBar import in GroovexApp.tsx!');
}

// 2. Locate and replace the glass-nav block
const targetNavStart = '  return (\n    <nav\n      ref={navRef}\n      className="glass-nav"';
const startIndex = content.indexOf(targetNavStart);

if (startIndex !== -1) {
  const closeNavIndex = content.indexOf('</nav>\n  );\n}', startIndex);
  if (closeNavIndex !== -1) {
    const fullOldBlock = content.substring(startIndex, closeNavIndex + '</nav>\n  );\n}'.length);
    const newNavBlock = `  if (navHidden || navCollapsed) return null;

  return (
    <SharedNavigationBar
      items={items.map(item => ({
        key: item.id,
        icon: item.icon,
        label: item.label,
        isActive: view === item.id,
        onClick: () => setView(item.id),
      }))}
      isLight={isLight}
    />
  );
}`;
    content = content.replace(fullOldBlock, newNavBlock);
    console.log('Updated Groovex navigation to render SharedNavigationBar!');
  } else {
    console.log('Could not find closing block for Groovex nav!');
  }
} else {
  console.log('Could not find targetNavStart!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('GroovexApp.tsx update complete!');
