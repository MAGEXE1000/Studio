import fs from 'fs';

const filePath = 'packages/ui-shared/src/components/hub/StudioHub.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add SharedBottomNavigation import
const importTarget = "import { ProgressiveBlur } from '../design-system/ProgressiveBlur';";
const importReplacement =
  "import { ProgressiveBlur } from '../design-system/ProgressiveBlur';\nimport { SharedBottomNavigation } from '../../navigation/SharedBottomNavigation';";
if (content.includes(importTarget) && !content.includes('SharedBottomNavigation')) {
  content = content.replace(importTarget, importReplacement);
  console.log('Added SharedBottomNavigation import!');
}

// 2. Add langQuery state to HubSettings
const langStateTarget = '  const settings = useChordStore(state => state.settings);';
const langStateReplacement = `  const settings = useChordStore(state => state.settings);
  const [langQuery, setLangQuery] = useState('');`;
if (content.includes(langStateTarget) && !content.includes('langQuery')) {
  content = content.replace(langStateTarget, langStateReplacement);
  console.log('Added langQuery state!');
}

// 3. Completely replace renderLanguageContent function
const langFuncStart = '  function renderLanguageContent() {';
const langFuncEnd = '  function renderPrivacyContent() {';
const startIdx = content.indexOf(langFuncStart);
const endIdx = content.indexOf(langFuncEnd);

if (startIdx !== -1 && endIdx !== -1) {
  const oldFunc = content.substring(startIdx, endIdx);
  const newFunc = `  function renderLanguageContent() {
    const LANG_OPTIONS: { code: string; flag: string; native: string; label: string }[] = [
      { code: 'en', flag: '🇬🇧', native: 'English',    label: t.settings.language.en || 'English (US)' },
      { code: 'es', flag: '🇪🇸', native: 'Español',    label: t.settings.language.es || 'Spanish' },
      { code: 'de', flag: '🇩🇪', native: 'Deutsch',    label: t.settings.language.de || 'German' },
      { code: 'fr', flag: '🇫🇷', native: 'Français',   label: t.settings.language.fr || 'French' },
      { code: 'zh', flag: '🇨🇳', native: '中文',        label: t.settings.language.zh || 'Chinese' },
      { code: 'pt', flag: '🇧🇷', native: 'Português',  label: t.settings.language.pt || 'Portuguese' },
      { code: 'it', flag: '🇮🇹', native: 'Italiano',   label: t.settings.language.it || 'Italian' },
      { code: 'ja', flag: '🇯🇵', native: '日本語',      label: t.settings.language.ja || 'Japanese' },
      { code: 'ko', flag: '🇰🇷', native: '한국어',      label: t.settings.language.ko || 'Korean' },
    ];
    const currentLang = settings.language ?? 'en';
    const filteredLangs = LANG_OPTIONS.filter(opt => 
      opt.native.toLowerCase().includes(langQuery.toLowerCase()) || 
      opt.label.toLowerCase().includes(langQuery.toLowerCase())
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', paddingBottom: 24, animation: 'hub-row-fade 320ms ease both' }}>
        {/* Search bar matching design reference */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, color: 'var(--c-text-secondary)', opacity: 0.5, fontSize: 20 }}>search</span>
          <input
            type="text"
            placeholder="Search languages..."
            value={langQuery}
            onChange={e => setLangQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 48px',
              background: 'var(--app-surface-low, rgba(0,0,0,0.2))',
              border: '1px solid rgba(128,128,128,0.12)',
              borderRadius: 12,
              color: 'var(--c-text-primary)',
              fontSize: 14,
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              transition: 'border-color 200ms ease',
            }}
            className="focus:border-accent"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredLangs.map((opt) => {
            const isSelected = currentLang === opt.code;
            return (
              <motion.button
                key={opt.code}
                whileTap={{ scale: 0.98 }}
                onClick={() => updateSettings({ language: opt.code as any })}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 12,
                  border: \`1.5px solid \${isSelected ? accent.from + '40' : 'rgba(128,128,128,0.06)'}\`,
                  padding: '14px 20px',
                  background: isSelected ? 'var(--app-surface-high, rgba(128,128,128,0.06))' : 'var(--app-surface-low, rgba(128,128,128,0.02))',
                  textAlign: 'left',
                  width: '100%',
                  cursor: 'pointer',
                  boxShadow: isSelected ? \`0 0 12px \${accent.from}15\` : 'none',
                  transition: 'background-color 200ms, border-color 200ms, box-shadow 200ms',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text-primary)', margin: 0, fontFamily: 'Manrope' }}>{opt.native}</h3>
                  <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', margin: 0, fontFamily: 'Inter', opacity: 0.7 }}>{opt.label}</p>
                </div>
                <div
                  style={{
                    width: 22, height: 22,
                    borderRadius: '50%',
                    border: isSelected ? 'none' : '1.5px solid rgba(128,128,128,0.3)',
                    background: isSelected ? accent.from : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 200ms ease',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 12, color: isSelected ? '#fff' : 'transparent', fontWeight: 'bold' }}>check</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Technical Note Section */}
        <div style={{ display: 'flex', gap: 14, padding: 18, borderRadius: 12, background: 'var(--app-surface-low, rgba(128,128,128,0.02))', border: '1px solid rgba(128,128,128,0.06)' }}>
          <div style={{ padding: 6, borderRadius: 8, background: \`\${accent.from}12\`, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'max-content' }}>
            <span className="material-symbols-outlined" style={{ color: accent.from, fontSize: 18 }}>info</span>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-primary)', margin: '0 0 4px', fontFamily: 'Manrope' }}>Technical Note</h4>
            <p style={{ fontSize: 11, color: 'var(--c-text-secondary)', lineHeight: 1.5, margin: 0, fontFamily: 'Inter', opacity: 0.8 }}>
              Changing the display language will affect all menus, labels, and notifications. Artist names and song titles will remain in their original metadata language to preserve technical rider accuracy.
            </p>
          </div>
        </div>
      </div>
    );
  }\n\n`;

  content = content.replace(oldFunc, newFunc);
  console.log('Successfully replaced renderLanguageContent!');
}

// 4. Completely replace renderAppearanceContent function
const appFuncStart = '  function renderAppearanceContent() {';
const appFuncEnd = '  function renderLanguageContent() {';
const appStartIdx = content.indexOf(appFuncStart);
const appEndIdx = content.indexOf(appFuncEnd);

if (appStartIdx !== -1 && appEndIdx !== -1) {
  const oldAppFunc = content.substring(appStartIdx, appEndIdx);
  const newAppFunc = `  function renderAppearanceContent() {
    const isLight = settings.theme === 'light' || (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', paddingBottom: 24, animation: 'hub-row-fade 320ms ease both' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Manrope', margin: '8px 0 0' }}>Theme Mode</h2>
        
        {/* 2x2 Grid of Theme Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { id: 'system', name: 'System', label: 'Auto', bg: 'rgba(128, 128, 128, 0.08)', isAmoled: false },
            { id: 'light', name: 'Light', label: 'Editorial', bg: '#f5f5f5', isAmoled: false, textColor: '#000000' },
            { id: 'dark', name: 'Dark', label: 'Tonal', bg: 'var(--app-surface-high, rgba(128,128,128,0.06))', isAmoled: false },
            { id: 'amoled', name: 'AMOLED', label: 'Pure', bg: '#000000', isAmoled: true, border: '1px solid rgba(255,255,255,0.08)' }
          ].map(tOpt => {
            let isThemeActive = false;
            if (tOpt.id === 'system') {
              isThemeActive = settings.theme === 'system';
            } else if (tOpt.id === 'light') {
              isThemeActive = settings.theme === 'light';
            } else if (tOpt.id === 'dark') {
              isThemeActive = settings.theme === 'dark' && !settings.amoledMode;
            } else if (tOpt.id === 'amoled') {
              isThemeActive = settings.theme === 'dark' && settings.amoledMode;
            }

            return (
              <motion.button
                key={tOpt.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (tOpt.id === 'system') requestChange({ theme: 'system', amoledMode: false });
                  else if (tOpt.id === 'light') requestChange({ theme: 'light', amoledMode: false });
                  else if (tOpt.id === 'dark') requestChange({ theme: 'dark', amoledMode: false });
                  else if (tOpt.id === 'amoled') requestChange({ theme: 'dark', amoledMode: true });
                }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 14,
                  background: tOpt.bg,
                  border: \`1.5px solid \${isThemeActive ? accent.from : 'transparent'}\`,
                  textAlign: 'left',
                  cursor: 'pointer',
                  boxShadow: isThemeActive ? \`0 0 12px \${accent.from}15\` : 'none',
                  transition: 'border-color 200ms, box-shadow 200ms',
                }}
              >
                <div style={{
                  width: 44, height: 44,
                  borderRadius: 8,
                  background: tOpt.id === 'system' 
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.2) 50%)' 
                    : tOpt.id === 'light' ? '#ffffff' : tOpt.id === 'dark' ? 'rgba(255,255,255,0.05)' : '#000000',
                  border: tOpt.border || 'none',
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: tOpt.textColor || 'var(--c-text-primary)', margin: 0, fontFamily: 'Inter' }}>{tOpt.name}</p>
                  <p style={{ fontSize: 9, textTransform: 'uppercase', color: tOpt.textColor ? 'rgba(0,0,0,0.5)' : 'var(--c-text-secondary)', margin: '2px 0 0', fontFamily: 'Manrope', opacity: 0.8 }}>{tOpt.label}</p>
                </div>
                {isThemeActive && (
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: accent.from, position: 'absolute', top: 8, right: 8, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Accent Color Section */}
        <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Manrope', margin: '8px 0 0' }}>Accent Color</h2>
        <div style={{ background: 'var(--app-surface-low, rgba(128,128,128,0.02))', padding: 20, borderRadius: 16, border: '1px solid rgba(128,128,128,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 20 }}>
            {[
              { id: 'blue', hex: '#007AFF' },
              { id: 'purple', hex: '#A855F7' },
              { id: 'green', hex: '#22C55E' },
              { id: 'orange', hex: '#F97316' },
              { id: 'pink', hex: '#EC4899' },
              { id: 'teal', hex: '#14B8A6' },
              { id: 'yellow', hex: '#EAB308' },
              { id: 'red', hex: '#EF4444' }
            ].map(cOpt => {
              const isColorActive = hubVis.accentColor === cOpt.id;
              return (
                <button
                  key={cOpt.id}
                  onClick={() => requestChange({ accentColor: cOpt.id as any })}
                  style={{
                    width: 32, height: 32,
                    borderRadius: '50%',
                    background: cOpt.hex,
                    border: isColorActive ? '3.5px solid #fff' : 'none',
                    boxShadow: isColorActive ? \`0 0 10px \${cOpt.hex}\` : 'none',
                    margin: '0 auto',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'transform 150ms ease',
                  }}
                  className="active:scale-90"
                />
              );
            })}
          </div>

          {/* Custom Accent Hue Slider */}
          {(() => {
            const isCustom = hubVis.accentColor === 'custom';
            const hue = settings.customAccentHue ?? 220;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text-primary)', margin: 0 }}>Custom Color</p>
                    <p style={{ fontSize: 9, color: 'var(--c-text-secondary)', textTransform: 'uppercase', margin: '2px 0 0' }}>Custom Spectrum</p>
                  </div>
                  <div style={{ background: 'var(--app-surface-low, rgba(0,0,0,0.2))', padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(128,128,128,0.1)' }}>
                    <span style={{ fontSize: 11, color: accent.from, fontFamily: 'monospace' }}>#007AFF</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0} max={359} value={hue}
                  onChange={e => {
                    requestChange({ accentColor: 'custom' });
                    updateSettings({ customAccentHue: Number(e.target.value) });
                  }}
                  style={{
                    width: '100%',
                    height: 8,
                    borderRadius: 9999,
                    outline: 'none',
                    background: 'linear-gradient(to right, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                  }}
                />
              </div>
            );
          })()}
        </div>

        {/* Visual Comfort Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          {/* Display Density */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Manrope', marginBottom: 8 }}>Display Density</h2>
            <div style={{ display: 'flex', gap: 1, background: 'var(--app-surface-low, rgba(128,128,128,0.02))', padding: 3, borderRadius: 12, border: '1px solid rgba(128,128,128,0.06)' }}>
              {[
                { id: 'compact', label: 'Compact' },
                { id: 'comfortable', label: 'Normal' },
                { id: 'spacious', label: 'Airy' }
              ].map(opt => {
                const isActive = settings.displayDensity === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => updateSettings({ displayDensity: opt.id as any })}
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      borderRadius: 10,
                      background: isActive ? 'var(--app-surface-high, rgba(128,128,128,0.08))' : 'transparent',
                      border: 'none',
                      color: isActive ? 'var(--c-text-primary)' : 'var(--c-text-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Scale */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Manrope', marginBottom: 8 }}>Text Scale</h2>
            <div style={{ display: 'flex', gap: 1, background: 'var(--app-surface-low, rgba(128,128,128,0.02))', padding: 3, borderRadius: 12, border: '1px solid rgba(128,128,128,0.06)' }}>
              {[
                { id: 'small', label: 'S' },
                { id: 'medium', label: 'M' },
                { id: 'large', label: 'L' }
              ].map(opt => {
                const isActive = settings.fontSize === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => updateSettings({ fontSize: opt.id as any })}
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      borderRadius: 10,
                      background: isActive ? 'var(--app-surface-high, rgba(128,128,128,0.08))' : 'transparent',
                      border: 'none',
                      color: isActive ? 'var(--c-text-primary)' : 'var(--c-text-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

`;
  content = content.replace(oldAppFunc, newAppFunc);
  console.log('Successfully replaced renderAppearanceContent!');
}

// 5. Replace Settings Home main view (pageId === 'main')
const settingsHomeStart = "            if (pageId === 'main') {";
const settingsHomeEnd = '            return null;';
const shStartIdx = content.indexOf(settingsHomeStart);
const shEndIdx = content.indexOf(settingsHomeEnd, shStartIdx);

if (shStartIdx !== -1 && shEndIdx !== -1) {
  const oldShBlock = content.substring(shStartIdx, shEndIdx);
  const newShBlock = `            if (pageId === 'main') {
              return (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div ref={localScrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 20px', paddingBottom: 'calc(var(--content-bottom-pad) + 52px)', WebkitOverflowScrolling: 'touch' }} className="no-scrollbar">
                    <div style={{ paddingTop: 32, paddingBottom: 16 }}>
                      <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--c-text-primary)', margin: 0, letterSpacing: '-0.03em', fontFamily: 'Manrope' }}>Settings</p>
                      <p style={{ fontSize: 10, color: 'var(--c-text-secondary)', margin: '5px 0 0', fontWeight: 600, uppercase: true, letterSpacing: '0.2em' }}>Livex System</p>
                    </div>

                    {/* Preferences Group */}
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 11, fontWeight: 700, uppercase: true, letterSpacing: '0.12em', color: 'var(--c-text-secondary)', opacity: 0.8, paddingLeft: 4, marginBottom: 8, fontFamily: 'Manrope' }}>PREFERENCES</h3>
                      <div style={{ background: 'var(--app-surface-low, rgba(128,128,128,0.02))', borderRadius: 16, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid rgba(128,128,128,0.06)' }}>
                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('appearance')}
                          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, borderRadius: 10, cursor: 'pointer' }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--c-text-secondary)', fontSize: 18 }}>palette</span>
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-primary)', fontFamily: 'Inter' }}>Appearance</span>
                            <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', opacity: 0.7 }}>Theme, dynamic colors, accent</span>
                          </div>
                          <span className="material-symbols-outlined" style={{ color: 'var(--c-text-secondary)', opacity: 0.4, fontSize: 16 }}>chevron_right</span>
                        </motion.div>

                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('language')}
                          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, borderRadius: 10, cursor: 'pointer' }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--c-text-secondary)', fontSize: 18 }}>translate</span>
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-primary)', fontFamily: 'Inter' }}>Language</span>
                            <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', opacity: 0.7 }}>{lang.toUpperCase()}</span>
                          </div>
                          <span className="material-symbols-outlined" style={{ color: 'var(--c-text-secondary)', opacity: 0.4, fontSize: 16 }}>chevron_right</span>
                        </motion.div>
                      </div>
                    </div>

                    {/* Help & Support Group */}
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 11, fontWeight: 700, uppercase: true, letterSpacing: '0.12em', color: 'var(--c-text-secondary)', opacity: 0.8, paddingLeft: 4, marginBottom: 8, fontFamily: 'Manrope' }}>HELP & SUPPORT</h3>
                      <div style={{ background: 'var(--app-surface-low, rgba(128,128,128,0.02))', borderRadius: 16, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid rgba(128,128,128,0.06)' }}>
                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('help-center')}
                          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, borderRadius: 10, cursor: 'pointer' }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--c-text-secondary)', fontSize: 18 }}>help_center</span>
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-primary)', fontFamily: 'Inter' }}>Help & Support</span>
                            <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', opacity: 0.7 }}>Documentation and FAQ</span>
                          </div>
                          <span className="material-symbols-outlined" style={{ color: 'var(--c-text-secondary)', opacity: 0.4, fontSize: 16 }}>chevron_right</span>
                        </motion.div>

                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('bug-report')}
                          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, borderRadius: 10, cursor: 'pointer' }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--c-text-secondary)', fontSize: 18 }}>bug_report</span>
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-primary)', fontFamily: 'Inter' }}>Report a Bug</span>
                            <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', opacity: 0.7 }}>Help us improve the workspace</span>
                          </div>
                          <span className="material-symbols-outlined" style={{ color: 'var(--c-text-secondary)', opacity: 0.4, fontSize: 16 }}>chevron_right</span>
                        </motion.div>
                      </div>
                    </div>

                    {/* System & About Group */}
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 11, fontWeight: 700, uppercase: true, letterSpacing: '0.12em', color: 'var(--c-text-secondary)', opacity: 0.8, paddingLeft: 4, marginBottom: 8, fontFamily: 'Manrope' }}>SYSTEM & ABOUT</h3>
                      <div style={{ background: 'var(--app-surface-low, rgba(128,128,128,0.02))', borderRadius: 16, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid rgba(128,128,128,0.06)' }}>
                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('updater')}
                          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, borderRadius: 10, cursor: 'pointer' }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--c-text-secondary)', fontSize: 18 }}>system_update</span>
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-primary)', fontFamily: 'Inter' }}>Updater</span>
                              <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 12, color: 'var(--c-text-secondary)', fontFamily: 'Inter' }}>{APP_VERSION_LABEL}</span>
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', opacity: 0.7 }}>System is up to date</span>
                          </div>
                          <span className="material-symbols-outlined" style={{ color: 'var(--c-text-secondary)', opacity: 0.4, fontSize: 16 }}>chevron_right</span>
                        </motion.div>

                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('about')}
                          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, borderRadius: 10, cursor: 'pointer' }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--c-text-secondary)', fontSize: 18 }}>info</span>
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-primary)', fontFamily: 'Inter' }}>About</span>
                            <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', opacity: 0.7 }}>Beta program info & legal</span>
                          </div>
                          <span className="material-symbols-outlined" style={{ color: 'var(--c-text-secondary)', opacity: 0.4, fontSize: 16 }}>chevron_right</span>
                        </motion.div>

                        {settings.developerMode && (
                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('developer')}
                            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 12, borderRadius: 10, cursor: 'pointer' }}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <span className="material-symbols-outlined" style={{ color: 'var(--c-text-secondary)', fontSize: 18 }}>code</span>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-primary)', fontFamily: 'Inter' }}>Developer Options</span>
                              <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', opacity: 0.7 }}>Advanced configurations</span>
                            </div>
                            <span className="material-symbols-outlined" style={{ color: 'var(--c-text-secondary)', opacity: 0.4, fontSize: 16 }}>chevron_right</span>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
`;
  content = content.replace(oldShBlock, newShBlock);
  console.log('Successfully replaced Settings Home main view!');
}

// 6. Global Shared Bottom Navigation injection inside StudioHub root div
const lastLineToReplace = `            {/* Click-away overlay */}
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 40,
                background: "transparent",
              }}
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
            />
          </>
        )}
      </AnimatePresence>`;

// Since our previous pass removed CRLF, let's use exact match with Unix line breaks
const lastLineTarget = `            {/* Click-away overlay */}
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 40,
                background: 'transparent',
              }}
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
            />
          </>
        )}
      </AnimatePresence>`;

const lastLineReplacement = `${lastLineTarget}

      {/* Global Shared Bottom Navigation for mobile Hub */}
      {!isWebDesktop && (
        <SharedBottomNavigation
          items={[
            {
              key: 'settings',
              icon: 'settings',
              label: 'Settings',
              isActive: tab === 'settings' && page !== 'updater',
              onClick: () => NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'main' }),
            },
            {
              key: 'home',
              icon: 'home',
              label: 'Home',
              isActive: tab === 'home',
              onClick: () => NavigationDispatcher.push({ app: 'hub', tab: 'home', page: 'main' }),
            },
            {
              key: 'layers',
              icon: 'layers',
              label: 'Modules',
              isActive: false,
              onClick: () => { setSearchOpen(true); },
            },
            {
              key: 'notifications',
              icon: 'notifications',
              label: 'Updates',
              isActive: tab === 'settings' && page === 'updater',
              onClick: () => NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'updater' }),
            },
          ]}
          isLight={isLight}
        />
      )}`;

if (content.includes(lastLineTarget)) {
  content = content.replace(lastLineTarget, lastLineReplacement);
  console.log('Injected Global Shared Bottom Navigation in StudioHub root!');
} else {
  console.log('Could not find lastLineTarget exactly!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done settings pass!');
