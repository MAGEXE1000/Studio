import fs from 'fs';
import path from 'path';

const filePath = 'packages/ui-shared/src/features/stagex/pages/StageCorePanel.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import statement
const importTarget =
  "import { ActionButton } from '../../../components/design-system/ActionButton';";
const importReplacement =
  "import { ActionButton } from '../../../components/design-system/ActionButton';\nimport { SharedBottomNavigation, type SharedBottomNavItem } from '../../../navigation/SharedBottomNavigation';";

if (content.includes(importTarget) && !content.includes('SharedBottomNavigation')) {
  content = content.replace(importTarget, importReplacement);
}

// 2. Locate glass-nav div and replace it
const startToken =
  '        {/* ── Glassmorphism bottom nav ── */}\n        <div\n          ref={stageNavRef}\n          className="glass-nav"';
const alternateStartToken =
  '        {/* ── Glassmorphism bottom nav ── */}\r\n        <div\n          ref={stageNavRef}\n          className="glass-nav"';

// Let's find by searching for "className=\"glass-nav\"" and grabbing the parent block
const navStartIndex = content.indexOf('className="glass-nav"');
if (navStartIndex !== -1) {
  // Let's find the preceding comment start index
  const commentStart = content.lastIndexOf('{/*', navStartIndex);
  // Let's find the closing </div> matching this div
  // Since we know the exact structure, let's look for the </div> that comes after handleNavTap])}
  const matchEnd = content.indexOf('handleNavTap])}', navStartIndex);
  if (matchEnd !== -1) {
    const divEnd = content.indexOf('</div>', matchEnd);
    if (divEnd !== -1) {
      // Find the next </div> representing the end of glass-nav
      const nextDivEnd = content.indexOf('</div>', divEnd + 6);
      if (nextDivEnd !== -1) {
        const fullBlock = content.substring(commentStart, nextDivEnd + 6);
        console.log('Found block of length:', fullBlock.length);

        const replacement = `        {/* ── Glassmorphism bottom nav ── */}
        {!(liveMode || hideBottomNav || (isLandscapeEditor && landscapeNavHidden) || navCollapsed || isWebDesktop) && (
          <SharedBottomNavigation
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

        content = content.replace(fullBlock, replacement);
        console.log('Successfully replaced bottom nav block!');
      }
    }
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('File written successfully!');
