import fs from 'fs';

const filePath = 'packages/ui-shared/src/components/hub/StudioHub.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original content size:', content.length);

// 1. Snappy Morph Spring Animation
const oldSpring =
  "const GOOEY_SPRING = { type: 'spring', stiffness: 380, damping: 30, mass: 0.8 } as const;";
const newSpring =
  "const GOOEY_SPRING = { type: 'spring', stiffness: 550, damping: 33, mass: 0.45 } as const;";
if (content.includes(oldSpring)) {
  content = content.replace(oldSpring, newSpring);
  console.log('Updated morph spring animation speed!');
}

// 2. Back Handler Intercept Hook
const searchInputRefLine = '  const searchInputRef = useRef<HTMLInputElement>(null);';
const backHookStr = `  const searchInputRef = useRef<HTMLInputElement>(null);
  useBackHandler('modal', () => {
    if (searchOpen) {
      setSearchOpen(false);
      setSearchQuery('');
      return true;
    }
    return false;
  }, [searchOpen]);`;

if (
  content.includes(searchInputRefLine) &&
  !content.includes("useBackHandler('modal', () => { if (searchOpen)")
) {
  content = content.replace(searchInputRefLine, backHookStr);
  console.log('Injected useBackHandler for search open state!');
}

// 3. Remove circle from Search icon in normal mode
const oldSearchBtn = `                                <motion.div 
                                  layoutId="search-icon-btn"
                                  onClick={() => setSearchOpen(true)}
                                  style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    backgroundColor: 'var(--app-surface-high, rgba(128,128,128,0.06))',
                                    border: '1px solid rgba(128,128,128,0.08)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer'
                                  }}
                                  className="hover:bg-surface-bright active:scale-90 transition-transform text-on-surface-variant"
                                >
                                  <motion.span layoutId="search-icon" className="material-symbols-outlined text-xl">search</motion.span>
                                </motion.div>`;

const newSearchBtn = `                                <motion.div 
                                  layoutId="search-icon-btn"
                                  onClick={() => setSearchOpen(true)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                    padding: 4,
                                    color: 'var(--c-text-secondary)',
                                    opacity: 0.8,
                                  }}
                                  className="hover:opacity-100 active:scale-90 transition-transform"
                                >
                                  <motion.span layoutId="search-icon" className="material-symbols-outlined text-xl">search</motion.span>
                                </motion.div>`;

// Clean up Carriage returns to ensure match
const cleanOldSearchBtn = oldSearchBtn.replace(/\r\n/g, '\n');
const cleanContent = content.replace(/\r\n/g, '\n');

if (cleanContent.includes(cleanOldSearchBtn)) {
  content = cleanContent.replace(cleanOldSearchBtn, newSearchBtn);
  console.log('Removed circle background from Search icon!');
} else {
  // Let's do a substring search or try simpler replace if needed
  console.log('Could not find oldSearchBtn exactly, checking substring...');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done first pass!');
