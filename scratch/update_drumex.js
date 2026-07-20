import fs from 'fs';

const filePath = 'packages/ui-shared/src/features/drumex/pages/DrumEditor.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add import statement
const targetImport =
  "import { SharedNavigationContainer } from '../../../navigation/SharedNavigationContainer';";
const replacementImport =
  "import { SharedNavigationContainer } from '../../../navigation/SharedNavigationContainer';\nimport { SharedNavigationBar, type SharedNavigationItem } from '../../../navigation/SharedNavigationBar';";
if (content.includes(targetImport) && !content.includes('SharedNavigationBar')) {
  content = content.replace(targetImport, replacementImport);
  console.log('Added SharedNavigationBar import in DrumEditor.tsx!');
}

// 2. Rewrite DrumNav to render SharedNavigationBar
const targetDrumNavStart =
  'function DrumNav({ activeTab, setTab, accent, isLight, isAmoled, hidden }: {';
const targetDrumNavEnd =
  '  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [activeTab]);\n\n  return (';

const startIndex = content.indexOf(targetDrumNavStart);
if (startIndex !== -1) {
  // Let's find the closing return block
  // The nav ends around line 665/666 with `</nav>\n  );\n}`
  const closeNavIndex = content.indexOf('</nav>\n  );\n}', startIndex);
  if (closeNavIndex !== -1) {
    const fullOldBlock = content.substring(startIndex, closeNavIndex + '</nav>\n  );\n}'.length);
    const newDrumNavBlock = `function DrumNav({ activeTab, setTab, accent, isLight, isAmoled, hidden }: {
  activeTab: DrumTab; setTab: (t: DrumTab) => void;
  accent: { from: string; to: string };
  isLight: boolean; isAmoled: boolean;
  hidden?: boolean;
}) {
  const ALL_NAV_TABS = useDrumNavTabs();
  const navCollapsed = useNavCollapsed();

  if (hidden || navCollapsed) return null;

  return (
    <SharedNavigationBar
      items={ALL_NAV_TABS.map(tab => ({
        key: tab.id,
        icon: <tab.Icon active={activeTab === tab.id} />,
        label: tab.label,
        isActive: activeTab === tab.id,
        onClick: () => setTab(tab.id),
      }))}
      isLight={isLight}
    />
  );
}`;
    content = content.replace(fullOldBlock, newDrumNavBlock);
    console.log('Updated DrumNav to render SharedNavigationBar!');
  } else {
    console.log('Could not find closing block for DrumNav!');
  }
} else {
  console.log('Could not find targetDrumNavStart!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('DrumEditor.tsx update complete!');
