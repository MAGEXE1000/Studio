import fs from 'fs';

const filePath = 'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\components\\devtools\\DevToolsDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const brokenStart = content.indexOf('{desc && (');
const brokenEnd = content.indexOf('const parseLogItem =');

if (brokenStart !== -1 && brokenEnd !== -1) {
  const replacement = `{desc && (
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: isWebDesktop ? '12px' : '10px',
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: 'Inter',
                }}
              >
                {desc}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {moduleName && renderCopyButton(moduleName)}
          {isWebDesktop && (
            <button
              onClick={handleGoBack}
              style={{
                padding: '7px 16px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.6)',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Back
            </button>
          )}
        </div>
      </header>
    );
  };\n\n  `;

  content = content.substring(0, brokenStart) + replacement + content.substring(brokenEnd);
  console.log('✓ Successfully fixed header JSX structure');
  fs.writeFileSync(filePath, content, 'utf8');
} else {
  console.log('❌ Could not locate broken header JSX');
}
