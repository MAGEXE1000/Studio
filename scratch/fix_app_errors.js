import fs from 'fs';

// 1. Fix App.tsx compilation errors
const appFilePath = 'apps/studio-android/src/App.tsx';
let appContent = fs.readFileSync(appFilePath, 'utf8').replace(/\r\n/g, '\n');

const oldAppBlock = `              {cachedApp === 'chords' && (
                <SharedNavigationBar
                  items={[
                    {
                      key: 'songs',
                      icon: 'music_note',
                      label: t?.nav?.songs || 'Songs',
                      isActive: panel === 'songs',
                      onClick: () => NavigationDispatcher.push({ app: 'chords', page: 'songs' }),
                    },
                    {
                      key: 'library',
                      icon: 'library_music',
                      label: t?.nav?.library || 'Library',
                      isActive: panel === 'library' || !panel,
                      onClick: () => NavigationDispatcher.push({ app: 'chords', page: 'library' }),
                    },
                    {
                      key: 'chord',
                      icon: 'grid_on',
                      label: t?.nav?.chords || 'Chords',
                      isActive: panel === 'chord',
                      onClick: () => NavigationDispatcher.push({ app: 'chords', page: 'chord' }),
                    },
                    {
                      key: 'settings',
                      icon: 'settings',
                      label: t?.nav?.settings || 'Settings',
                      isActive: panel === 'settings',
                      onClick: () => NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'main' }),
                    },
                  ]}
                  isLight={settings.theme === 'light' || (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches)}
                />
              )}`;

const newAppBlock = `              {cachedApp === 'chords' && (
                <SharedNavigationBar
                  items={[
                    {
                      key: 'songs',
                      icon: 'music_note',
                      label: 'Songs',
                      isActive: cachedPanel === 'songs',
                      onClick: () => NavigationDispatcher.push({ app: 'chords', page: 'songs' }),
                    },
                    {
                      key: 'library',
                      icon: 'library_music',
                      label: 'Library',
                      isActive: cachedPanel === 'library' || !cachedPanel,
                      onClick: () => NavigationDispatcher.push({ app: 'chords', page: 'library' }),
                    },
                    {
                      key: 'chord',
                      icon: 'grid_on',
                      label: 'Chords',
                      isActive: cachedPanel === 'chord',
                      onClick: () => NavigationDispatcher.push({ app: 'chords', page: 'chord' }),
                    },
                    {
                      key: 'settings',
                      icon: 'settings',
                      label: 'Settings',
                      isActive: cachedPanel === 'settings',
                      onClick: () => NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'main' }),
                    },
                  ]}
                  isLight={settings.theme === 'light' || (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches)}
                />
              )}`;

if (appContent.includes(oldAppBlock)) {
  appContent = appContent.replace(oldAppBlock, newAppBlock);
  console.log('Fixed App.tsx compilation errors successfully!');
} else {
  console.log('Could not find oldAppBlock in App.tsx!');
}
fs.writeFileSync(appFilePath, appContent, 'utf8');

// 2. Fix packages/ui-android/src/components/StageCorePanel.tsx compilation errors
const stageFilePath = 'packages/ui-android/src/components/StageCorePanel.tsx';
let stageContent = fs.readFileSync(stageFilePath, 'utf8').replace(/\r\n/g, '\n');

const targetState = '  const [isExiting, setIsExiting] = useState(false);';
const replacementState =
  '  const [isExiting, setIsExiting] = useState(false);\n  const [landscapeNavHidden, setLandscapeNavHidden] = useState(false);';

if (stageContent.includes(targetState) && !stageContent.includes('landscapeNavHidden')) {
  stageContent = stageContent.replace(targetState, replacementState);
  console.log('Added landscapeNavHidden state to ui-android StageCorePanel!');
} else {
  console.log('Could not find targetState in ui-android StageCorePanel!');
}
fs.writeFileSync(stageFilePath, stageContent, 'utf8');

console.log('Fix compile errors scripts run completed!');
