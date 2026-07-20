import fs from 'fs';

const files = [
  'packages/ui-shared/src/index.ts',
  'packages/ui-shared/src/navigation/BottomNav.tsx',
  'packages/ui-shared/src/components/hub/StudioHub.tsx',
  'packages/ui-shared/src/features/stagex/pages/StageCorePanel.tsx',
];

files.forEach((filePath) => {
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist:', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace imports and usages
  content = content.replaceAll('SharedBottomNavigation', 'SharedNavigationBar');
  content = content.replaceAll('SharedBottomNavItem', 'SharedNavigationItem');

  // Replace file references in imports
  content = content.replaceAll('/SharedBottomNavigation', '/SharedNavigationBar');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated navigation references in:', filePath);
});

console.log('Renaming usages complete!');
