import fs from 'fs';

const filePath = 'packages/ui-shared/src/features/vocalex/pages/VocalexApp.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add import statement
const targetImport =
  "import { SharedNavigationContainer } from '../../../navigation/SharedNavigationContainer';";
const replacementImport =
  "import { SharedNavigationContainer } from '../../../navigation/SharedNavigationContainer';\nimport { SharedNavigationBar, type SharedNavigationItem } from '../../../navigation/SharedNavigationBar';";
if (content.includes(targetImport) && !content.includes('SharedNavigationBar')) {
  content = content.replace(targetImport, replacementImport);
  console.log('Added SharedNavigationBar import in VocalexApp.tsx!');
}

// 2. Locate and replace the glass-nav block
const targetNavStart = '      <nav\n        ref={navRef}\n        className="glass-nav fixed"';
const startIndex = content.indexOf(targetNavStart);

if (startIndex !== -1) {
  const closeNavIndex = content.indexOf('</nav>\n    </div>\n  );\n}', startIndex);
  if (closeNavIndex !== -1) {
    const fullOldBlock = content.substring(
      startIndex,
      closeNavIndex + '</nav>\n    </div>\n  );\n}'.length
    );
    const newNavBlock = `      {!(navHidden || navCollapsed) && (
        <SharedNavigationBar
          items={NAV_ITEMS.map(item => ({
            key: item.panel,
            icon: <item.Icon active={activeTab === item.panel} />,
            label: item.label,
            isActive: activeTab === item.panel,
            onClick: () => NavigationDispatcher.push({ app: 'vocalex', page: item.panel }),
          }))}
          isLight={isLight}
        />
      )}
    </div>
  );
}`;
    content = content.replace(fullOldBlock, newNavBlock);
    console.log('Updated Vocalex navigation to render SharedNavigationBar!');
  } else {
    console.log('Could not find closing block for Vocalex nav!');
  }
} else {
  console.log('Could not find targetNavStart!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('VocalexApp.tsx update complete!');
