import fs from 'fs';

const filePath = 'packages/ui-shared/src/components/hub/StudioHub.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Remove legacy HubNav usage
const oldHubNavUsage =
  '      {!isWebDesktop && <HubNav tab={tab} setTab={setTab} accent={accent} introFinished={introFinished} />}';
const newHubNavUsage = ''; // Removed!
if (content.includes(oldHubNavUsage)) {
  content = content.replace(oldHubNavUsage, newHubNavUsage);
  console.log('Removed legacy HubNav usage in StudioHub.tsx!');
} else {
  // Let's check with spaces
  const target =
    '{!isWebDesktop && <HubNav tab={tab} setTab={setTab} accent={accent} introFinished={introFinished} />}';
  const startIdx = content.indexOf(target);
  if (startIdx !== -1) {
    content = content.replace(target, '');
    console.log('Removed legacy HubNav usage (loose match)!');
  } else {
    console.log('Could not find oldHubNavUsage exactly!');
  }
}

// 2. Remove useHubNavItems and HubNav function definitions completely
const functionStartToken = 'function useHubNavItems()';
const functionEndToken = "type HelpPageActiveId = 'main' | HelpPageId;";

const startIndex = content.indexOf(functionStartToken);
const endIndex = content.indexOf(functionEndToken);

if (startIndex !== -1 && endIndex !== -1) {
  const legacyFunctionsBlock = content.substring(startIndex, endIndex);
  content = content.replace(legacyFunctionsBlock, '');
  console.log(
    'Removed useHubNavItems and HubNav function definitions completely from StudioHub.tsx!'
  );
} else {
  console.log('Could not find bounds of legacy HubNav functions!', startIndex, endIndex);
}

// 3. Update the global SharedNavigationBar items to have exactly three tabs in order: Notifications, Home, Settings
// Let's locate the SharedNavigationBar rendering block at the end of the file
const oldSharedNavBlockStart = '      {/* Global Shared Bottom Navigation for mobile Hub */}';
const oldSharedNavBlockEnd = '        />\n      )}';

const navBlockIndex = content.indexOf(oldSharedNavBlockStart);
if (navBlockIndex !== -1) {
  // Let's find the closing brace matching this block
  const navBlockCloseIndex = content.indexOf(
    'isLight={isLight}\n        />\n      )}',
    navBlockIndex
  );
  if (navBlockCloseIndex !== -1) {
    const fullOldBlock = content.substring(
      navBlockIndex,
      navBlockCloseIndex + 'isLight={isLight}\n        />\n      )}'.length
    );
    const newSharedNavBlock = `      {/* Global Shared Bottom Navigation for mobile Hub */}
      {!isWebDesktop && (
        <SharedNavigationBar
          items={[
            {
              key: 'notifications',
              icon: 'notifications',
              label: 'Updates',
              isActive: tab === 'settings' && page === 'updater',
              onClick: () => NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'updater' }),
            },
            {
              key: 'home',
              icon: 'home',
              label: 'Home',
              isActive: tab === 'home',
              onClick: () => NavigationDispatcher.push({ app: 'hub', tab: 'home', page: 'main' }),
            },
            {
              key: 'settings',
              icon: 'settings',
              label: 'Settings',
              isActive: tab === 'settings' && page !== 'updater',
              onClick: () => NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'main' }),
            },
          ]}
          isLight={isLight}
        />
      )}`;
    content = content.replace(fullOldBlock, newSharedNavBlock);
    console.log(
      'Updated SharedNavigationBar items to contain exactly 3 tabs (Notifications, Home, Settings)!'
    );
  } else {
    console.log('Could not find closing block for SharedNavigationBar!');
  }
} else {
  console.log('Could not find oldSharedNavBlockStart!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('StudioHub.tsx navigation revamp pass complete!');
