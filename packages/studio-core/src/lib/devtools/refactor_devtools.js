import fs from 'fs';

const filePath = 'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\components\\devtools\\DevToolsDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace search bar container & remove Copy Section button
const oldSearchBarStart = content.indexOf('<div style={{ display: \'flex\', gap: 12, alignItems: \'center\', width: \'100%\' }}>');
const oldSearchBarEnd = content.indexOf('{/* Severity Toggles / Tab Selectors */}');

if (oldSearchBarStart !== -1 && oldSearchBarEnd !== -1) {
  const newSearchBar = `<div style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.4)',
                pointerEvents: 'none',
                fontSize: 20,
              }}
            >
              search
            </span>
            <input
              type="text"
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              placeholder="Search system events, pids, threads, or messages..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'var(--app-surface-high, #1c1c1e)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '999px',
                padding: '12px 20px 12px 46px',
                color: '#fff',
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                transition: 'all 0.15s ease',
              }}
            />
          </div>
        </div>

        `;

  content = content.substring(0, oldSearchBarStart) + newSearchBar + content.substring(oldSearchBarEnd);
  console.log('✓ Updated search bar to circular-pill design & removed Copy Section button');
} else {
  console.log('❌ Could not locate search bar in DevToolsDashboard.tsx');
}

// 2. Remove Navigation Stack tab from Tab Selectors
const navTabStr = `            {
              label: 'Navigation Stack',
              id: 'nav_tab',
              active: activeTab === 'nav',
              color: '#a78bfa',
              onClick: () => {
                setActiveTab('nav');
              },
            },`;

if (content.includes(navTabStr)) {
  content = content.replace(navTabStr, '');
  console.log('✓ Removed Navigation Stack tab toggle');
}

// 3. Remove {activeTab === 'nav' && renderNavTab()}
content = content.replace("{activeTab === 'nav' && renderNavTab()}", "");

fs.writeFileSync(filePath, content, 'utf8');
