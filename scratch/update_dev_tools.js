import fs from 'fs';

const filePath = 'packages/ui-shared/src/components/devtools/DevToolsDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add import statement
const targetImport =
  "import { SharedNavigationContainer } from '../../navigation/SharedNavigationContainer';";
const replacementImport =
  "import { SharedNavigationContainer } from '../../navigation/SharedNavigationContainer';\nimport MotionPlaygroundView from './MotionPlaygroundView';";

if (content.includes(targetImport) && !content.includes('MotionPlaygroundView')) {
  content = content.replace(targetImport, replacementImport);
  console.log('Added MotionPlaygroundView import!');
}

// 2. Add 'motion_playground' to viewOrder array
const targetViewOrder =
  "viewOrder={['dashboard', 'apps', 'stagex', 'updater_diagnostics', 'system', 'logs', 'performance', 'network']}";
const replacementViewOrder =
  "viewOrder={['dashboard', 'apps', 'stagex', 'updater_diagnostics', 'system', 'logs', 'performance', 'network', 'motion_playground']}";

if (content.includes(targetViewOrder)) {
  content = content.replace(targetViewOrder, replacementViewOrder);
  console.log('Added motion_playground to viewOrder!');
}

// 3. Append motion_playground subView render
const targetNetworkBlock = `      {viewId === 'network' && (
        !isWebDesktop ? (
          <SettingsScaffold
            title="Network Sniffer"
            onBack={handleSubViewBack}
            toolbarActions={renderCopyButton('Network')}
          >
            {renderNetworkTab()}
            <WarningsInspector logs={logs} showToast={showToast} moduleFilter={['network', 'sync']} />
          </SettingsScaffold>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--app-bg)' }}>
            {renderSubViewHeader('Network Sniffer')}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              paddingTop: 16,
              paddingLeft: 20,
              paddingRight: 20,
              paddingBottom: 'calc(var(--content-bottom-pad, 96px) + 20px)'
            }}>
              {renderNetworkTab()}
              <WarningsInspector logs={logs} showToast={showToast} moduleFilter={['network', 'sync']} />
            </div>
          </div>
        )
      )}`;

const replacementNetworkBlock =
  targetNetworkBlock +
  `\n\n      {viewId === 'motion_playground' && (
        <MotionPlaygroundView accent={accent} onBack={handleSubViewBack} />
      )}`;

if (content.includes(targetNetworkBlock)) {
  content = content.replace(targetNetworkBlock, replacementNetworkBlock);
  console.log('Appended motion_playground subview!');
} else {
  // Let's do a search based on parts of it
  console.log('Could not find exact network render block, trying alternative matching...');
  const alternativeTarget =
    "title=\"Network Sniffer\"\n            onBack={handleSubViewBack}\n            toolbarActions={renderCopyButton('Network')}\n          >\n            {renderNetworkTab()}\n            <WarningsInspector logs={logs} showToast={showToast} moduleFilter={['network', 'sync']} />\n          </SettingsScaffold>";
  const altIndex = content.indexOf(alternativeTarget);
  if (altIndex !== -1) {
    // Find the next </div> ) \n      )} or similar
    const closeIdx = content.indexOf('          </div>\n        )\n      )}', altIndex);
    if (closeIdx !== -1) {
      const targetSub = content.substring(
        altIndex,
        closeIdx + '          </div>\n        )\n      )}'.length
      );
      const replacementSub =
        targetSub +
        `\n\n      {viewId === 'motion_playground' && (
        <MotionPlaygroundView accent={accent} onBack={handleSubViewBack} />
      )}`;
      content = content.replace(targetSub, replacementSub);
      console.log('Appended motion_playground subview successfully (alt match)!');
    }
  }
}

// 4. Append Motion Playground button card in renderDashboardBody
const targetUpdaterCard = `                  {/* Updater */}
                  <button
                    onClick={() => setSubView('updater_diagnostics')}
                    className="btn-smooth"
                    style={cardContainerStyle('updater_diagnostics')}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', gap: 16, textAlign: 'left' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--studio-accent-from, #679cff)', fontVariationSettings: "'FILL' 0" }}>system_update</span>
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-text-primary)', margin: '0 0 4px' }}>Updater Diagnostics</h3>
                          <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', margin: 0, lineHeight: 1.3 }}>Inspect update and native APK diagnostics.</p>
                        </div>
                      </div>
                      <span style={badgeStyle('stable')}>Stable</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 16 }}>
                      <span style={{ fontSize: 10, color: 'var(--c-text-secondary)' }}>Updater system initialized</span>
                      <span className="material-symbols-outlined" style={{ color: 'var(--c-text-secondary)', opacity: 0.5 }}>arrow_forward</span>
                    </div>
                  </button>`;

const replacementUpdaterCard =
  targetUpdaterCard +
  `\n\n                  {/* Motion Playground */}
                  <button
                    onClick={() => setSubView('motion_playground')}
                    className="btn-smooth"
                    style={cardContainerStyle('motion_playground')}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', gap: 16, textAlign: 'left' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#a78bfa', fontVariationSettings: "'FILL' 0" }}>motion_photos_on</span>
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-text-primary)', margin: '0 0 4px' }}>Motion Playground</h3>
                          <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', margin: 0, lineHeight: 1.3 }}>Prototype and compare different launch animations.</p>
                        </div>
                      </div>
                      <span style={badgeStyle('experimental')}>Experimental</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 16 }}>
                      <span style={{ fontSize: 10, color: 'var(--c-text-secondary)' }}>5 Flagship concepts loaded</span>
                      <span className="material-symbols-outlined" style={{ color: 'var(--c-text-secondary)', opacity: 0.5 }}>arrow_forward</span>
                    </div>
                  </button>`;

if (content.includes(targetUpdaterCard)) {
  content = content.replace(targetUpdaterCard, replacementUpdaterCard);
  console.log('Appended Motion Playground button card in bento grid!');
} else {
  console.log('Could not find exact updater card, trying loose search...');
  const looseTarget = "onClick={() => setSubView('updater_diagnostics')}";
  const index = content.indexOf(looseTarget);
  if (index !== -1) {
    const nextBtnClose = content.indexOf('</button>', index);
    if (nextBtnClose !== -1) {
      const targetSub = content.substring(index - 100, nextBtnClose + '</button>'.length);
      // Let's match from <button to </button>
      const btnStart = content.lastIndexOf('<button', index);
      if (btnStart !== -1) {
        const fullButtonBlock = content.substring(btnStart, nextBtnClose + '</button>'.length);
        const replacementButtonBlock =
          fullButtonBlock +
          `\n\n                  {/* Motion Playground */}
                  <button
                    onClick={() => setSubView('motion_playground')}
                    className="btn-smooth"
                    style={cardContainerStyle('motion_playground')}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', gap: 16, textAlign: 'left' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#a78bfa', fontVariationSettings: "'FILL' 0" }}>motion_photos_on</span>
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-text-primary)', margin: '0 0 4px' }}>Motion Playground</h3>
                          <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', margin: 0, lineHeight: 1.3 }}>Prototype and compare different launch animations.</p>
                        </div>
                      </div>
                      <span style={badgeStyle('experimental')}>Experimental</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 16 }}>
                      <span style={{ fontSize: 10, color: 'var(--c-text-secondary)' }}>5 Flagship concepts loaded</span>
                      <span className="material-symbols-outlined" style={{ color: 'var(--c-text-secondary)', opacity: 0.5 }}>arrow_forward</span>
                    </div>
                  </button>`;
        content = content.replace(fullButtonBlock, replacementButtonBlock);
        console.log(
          'Appended Motion Playground button card in bento grid successfully (loose match)!'
        );
      }
    }
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('DevToolsDashboard.tsx modification script complete!');
