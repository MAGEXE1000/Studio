import fs from 'fs';

const filePath = 'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\components\\devtools\\DevToolsDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldErrorsCardHeader = `<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                [{new Date(err.timestamp).toLocaleTimeString()}] Source: {err.source}
              </span>
              <span
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 900,
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                {err.module.toUpperCase()}
              </span>`;

const newErrorsCardHeader = `<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    background: err.count && err.count > 1 ? '#10b981' : '#ef4444',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  Occurred: x{err.count || 1}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  First: {new Date(err.firstSeen || err.timestamp).toLocaleTimeString()} | Last: {new Date(err.lastSeen || err.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <span
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 9,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 4,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {err.source || err.module.toUpperCase()}
              </span>`;

if (content.includes(oldErrorsCardHeader)) {
  content = content.replace(oldErrorsCardHeader, newErrorsCardHeader);
  console.log('✓ Successfully updated renderErrorsTab card header with occurrence counter & timestamps');
  fs.writeFileSync(filePath, content, 'utf8');
} else {
  console.log('❌ Could not locate old errors card header in DevToolsDashboard.tsx');
}
