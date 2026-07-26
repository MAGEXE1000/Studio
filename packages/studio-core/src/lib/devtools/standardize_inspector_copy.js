import fs from 'fs';

const filePath = 'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\ui-shared\\src\\components\\devtools\\inspector\\DeveloperInspectorPanel.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add CopyButton import
if (!content.includes('import CopyButton')) {
  content = `import CopyButton from '../CopyButton';\n` + content;
}

// Replace React Props copy button
const oldPropsCopy = `<button
                  type="button"
                  onClick={() => handleCopy(selectedFiberInfo?.props, 'Props')}
                  style={smallBtnStyle}
                >
                  Copy Props
                </button>`;

const newPropsCopy = `<CopyButton
                  getTextToCopy={() => JSON.stringify(selectedFiberInfo?.props || {}, null, 2)}
                  label="Copy Props"
                  size="sm"
                />`;

content = content.replace(oldPropsCopy, newPropsCopy);

// Replace React State copy button
const oldStateCopy = `<button
                  type="button"
                  onClick={() => handleCopy(selectedFiberInfo?.state, 'State')}
                  style={smallBtnStyle}
                >
                  Copy State
                </button>`;

const newStateCopy = `<CopyButton
                  getTextToCopy={() => JSON.stringify(selectedFiberInfo?.state || {}, null, 2)}
                  label="Copy State"
                  size="sm"
                />`;

content = content.replace(oldStateCopy, newStateCopy);

// Add Copy Styles button to Styles tab
const oldStylesHeader = `<div style={cardTitleStyle}>Computed Layout & Styles</div>`;
const newStylesHeader = `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={cardTitleStyle}>Computed Layout & Styles</div>
                <CopyButton
                  getTextToCopy={() => JSON.stringify(computedStyles || {}, null, 2)}
                  label="Copy Styles"
                  size="sm"
                />
              </div>`;

content = content.replace(oldStylesHeader, newStylesHeader);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully standardized Copy buttons in DeveloperInspectorPanel.tsx with shared CopyButton component');
