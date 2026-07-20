import fs from 'fs';

const filePath = 'packages/ui-shared/src/components/hub/StudioHub.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Replace Close (X) button inside searching state of top bar
const oldCloseBtn = `                              <button
                                onClick={() => {
                                  setSearchOpen(false);
                                  setSearchQuery('');
                                }}
                                style={{
                                  background: 'rgba(255, 255, 255, 0.04)',
                                  border: '1px solid rgba(255, 255, 255, 0.06)',
                                  borderRadius: 12,
                                  padding: '4px 10px',
                                  color: 'var(--c-text-secondary)',
                                  fontSize: 13,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <span className="material-symbols-outlined text-lg leading-none">close</span>
                              </button>`;

const newCloseBtn = `                              <button
                                onClick={() => {
                                  setSearchOpen(false);
                                  setSearchQuery('');
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--c-text-secondary)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: 4,
                                  opacity: 0.8,
                                  transition: 'opacity 150ms ease'
                                }}
                                className="hover:opacity-100 active:scale-90 transition-transform"
                              >
                                <span className="material-symbols-outlined text-xl leading-none">close</span>
                              </button>`;

if (content.includes(oldCloseBtn)) {
  content = content.replace(oldCloseBtn, newCloseBtn);
  console.log('Removed circle background from searching Close button!');
} else {
  console.log('Could not find oldCloseBtn exactly!');
}

// 2. Remove setSearchOpen(false) in handleSearchRowClick
const oldRowClick = `  const handleSearchRowClick = (item: SearchableItem) => {
    addToSearchHistory(searchQuery);
    setSearchOpen(false);
    setSearchQuery('');`;

const newRowClick = `  const handleSearchRowClick = (item: SearchableItem) => {
    addToSearchHistory(searchQuery);
    // Keep search open on row interaction
    setSearchQuery('');`;

if (content.includes(oldRowClick)) {
  content = content.replace(oldRowClick, newRowClick);
  console.log('Updated handleSearchRowClick to keep search open!');
} else {
  console.log('Could not find oldRowClick exactly!');
}

// 3. Remove setSearchOpen(false) in Suggested Actions (Sync Cloud & User Profile)
content = content.replace(
  `                                        onClick={() => {
                                          setSearchOpen(false);
                                          setSearchQuery('');
                                          syncNow?.();
                                        }}`,
  `                                        onClick={() => {
                                          setSearchQuery('');
                                          syncNow?.();
                                        }}`
);
content = content.replace(
  `                                        onClick={() => {
                                          setSearchOpen(false);
                                          setSearchQuery('');
                                          NavigationDispatcher.push({ app: 'hub', tab: 'profile', page: 'profile' });
                                        }}`,
  `                                        onClick={() => {
                                          setSearchQuery('');
                                          NavigationDispatcher.push({ app: 'hub', tab: 'profile', page: 'profile' });
                                        }}`
);

// 4. Remove setSearchOpen(false) in Pinned Destinations click handler
content = content.replace(
  `                                          onClick={() => {
                                            setSearchOpen(false);
                                            setSearchQuery('');
                                            launchApp(pinned.app as any);
                                          }}`,
  `                                          onClick={() => {
                                            setSearchQuery('');
                                            launchApp(pinned.app as any);
                                          }}`
);

console.log('Completed second pass edits!');
fs.writeFileSync(filePath, content, 'utf8');
