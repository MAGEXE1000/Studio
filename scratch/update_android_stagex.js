import fs from 'fs';

const filePath = 'packages/ui-android/src/components/StageCorePanel.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add SharedNavigationBar to the import list from @workspace/ui-shared
const targetImport =
  "  SharedNavigationContainer,\n  MOTION_DURATIONS,\n  MOTION_EASINGS\n} from '@workspace/ui-shared';";
const replacementImport =
  "  SharedNavigationContainer,\n  MOTION_DURATIONS,\n  MOTION_EASINGS,\n  SharedNavigationBar\n} from '@workspace/ui-shared';";

if (content.includes(targetImport)) {
  content = content.replace(targetImport, replacementImport);
  console.log('Added SharedNavigationBar to ui-android StageCorePanel imports!');
}

// 2. Locate and replace the glass-nav block
const targetNavStart =
  '        {/* ── Glassmorphism bottom nav — matches Chordex BottomNav ── */}\n        <div\n          ref={stageNavRef}\n          className="glass-nav"';
const startIndex = content.indexOf(targetNavStart);

if (startIndex !== -1) {
  // Let's find the matching end of glass-nav div
  // The nav ends around line 2885-2889 with `</div>` (representing the outer glass-nav div)
  // Let's search for handleNavTap])} and then find the closing tags
  const matchEnd = content.indexOf('handleNavTap])}', startIndex);
  if (matchEnd !== -1) {
    const divEnd = content.indexOf('</div>', matchEnd);
    if (divEnd !== -1) {
      const nextDivEnd = content.indexOf('</div>', divEnd + 6);
      if (nextDivEnd !== -1) {
        const fullOldBlock = content.substring(startIndex, nextDivEnd + 6);
        const newNavBlock = `        {/* ── Glassmorphism bottom nav ── */}
        {!(liveMode || hideBottomNav || (isLandscapeEditor && landscapeNavHidden) || navCollapsed || isWebDesktop) && (
          <SharedNavigationBar
            items={navTabs.map(t => ({
              key: t.view,
              icon: t.icon,
              label: t.label,
              isActive: isTabActive(t.view),
              onClick: () => handleNavTap(t.view),
            }))}
            isLight={isLight}
          />
        )}`;

        content = content.replace(fullOldBlock, newNavBlock);
        console.log('Updated ui-android StageCorePanel to render SharedNavigationBar!');
      }
    }
  }
} else {
  console.log('Could not find targetNavStart!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('ui-android StageCorePanel update complete!');
