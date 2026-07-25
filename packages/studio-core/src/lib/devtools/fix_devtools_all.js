import fs from 'fs';

const filePath = 'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\components\\devtools\\DevToolsDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Remove old local CopyDropdown component definition
const oldCopyDropdownStart = content.indexOf('export interface CopyDropdownProps');
const oldCopyDropdownEnd = content.indexOf('export interface DevToolsDashboardProps');

if (oldCopyDropdownStart !== -1 && oldCopyDropdownEnd !== -1) {
  content = content.substring(0, oldCopyDropdownStart) + content.substring(oldCopyDropdownEnd);
  console.log('✓ Fix 1: Removed old local CopyDropdown component definition');
}

// Fix 2: Remove duplicate renderCopyButton declaration
const firstRenderCopyButton = content.indexOf('const renderCopyButton = (module: string) => {');
const secondRenderCopyButton = content.indexOf('const renderCopyButton = (module: string) => {', firstRenderCopyButton + 10);

if (firstRenderCopyButton !== -1 && secondRenderCopyButton !== -1) {
  // Remove the first obsolete one
  const endOfFirst = content.indexOf('};', firstRenderCopyButton) + 2;
  content = content.substring(0, firstRenderCopyButton) + content.substring(endOfFirst);
  console.log('✓ Fix 2: Removed duplicate renderCopyButton definition');
}

// Fix 3: Fix tab selectors map JSX
const brokenTabSelectorsStart = content.indexOf('{/* Severity Toggles / Tab Selectors */}');
const brokenTabSelectorsEnd = content.indexOf('{activeTab === \'logs\' && renderLogsTab()}');

if (brokenTabSelectorsStart !== -1 && brokenTabSelectorsEnd !== -1) {
  const cleanTabSelectors = `{/* Severity Toggles / Tab Selectors */}
        <div
          className="toggle-scroll"
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            padding: '4px 0',
            width: '100%',
          }}
        >
          {[
            {
              label: 'All',
              id: 'all_logs',
              active: activeTab === 'logs' && logLevelFilter === 'all',
              color: '#acabaa',
              onClick: () => {
                setActiveTab('logs');
                setLogLevelFilter('all');
              },
            },
            {
              label: 'Info',
              id: 'info_logs',
              active: activeTab === 'logs' && logLevelFilter === 'info',
              color: '#60a5fa',
              onClick: () => {
                setActiveTab('logs');
                setLogLevelFilter('info');
              },
            },
            {
              label: 'Warnings',
              id: 'warn_logs',
              active: activeTab === 'logs' && logLevelFilter === 'warn',
              color: '#fbbf24',
              onClick: () => {
                setActiveTab('logs');
                setLogLevelFilter('warn');
              },
            },
            {
              label: \`Errors (\${errors.length})\`,
              id: 'errors_tab',
              active: activeTab === 'errors',
              color: '#ee7d77',
              onClick: () => {
                setActiveTab('errors');
              },
            },
            {
              label: \`Events (\${events.length})\`,
              id: 'events_tab',
              active: activeTab === 'events',
              color: '#10b981',
              onClick: () => {
                setActiveTab('events');
              },
            },
          ].map((toggle) => (
            <button
              key={toggle.id}
              onClick={toggle.onClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: '10px',
                background: toggle.active
                  ? 'var(--studio-accent-from, #679cff)'
                  : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.02)',
                color: toggle.active ? '#fff' : 'rgba(255,255,255,0.6)',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: toggle.active ? '#fff' : toggle.color,
                  display: 'inline-block',
                }}
              />
              {toggle.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: isMobile ? 'none' : 1,
          overflowY: isMobile ? 'visible' : 'auto',
          paddingTop: 16,
          paddingLeft: isMobile ? 0 : 20,
          paddingRight: isMobile ? 0 : 20,
          paddingBottom: isMobile ? 20 : 'calc(var(--content-bottom-pad, 96px) + 20px)',
        }}
      >
        `;

  content = content.substring(0, brokenTabSelectorsStart) + cleanTabSelectors + content.substring(brokenTabSelectorsEnd);
  console.log('✓ Fix 3: Fixed tab selectors JSX structure');
}

fs.writeFileSync(filePath, content, 'utf8');
