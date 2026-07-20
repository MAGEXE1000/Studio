import { useChordStore, ACCENT_COLORS, translations, useSettingsStore } from '@workspace/studio-core';

export function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function injectAccentVars(iframe: HTMLIFrameElement, from: string, to: string) {
  try {
    const doc = iframe.contentDocument;
    const root = doc?.documentElement;
    if (!root) return;
    const [r, g, b] = hexToRgb(from);
    const [hr, hg, hb] = hexToRgb(to);
    root.style.setProperty('--accent', from);
    root.style.setProperty('--accent-dark', '#fff');
    root.style.setProperty('--accent-08', `rgba(${r},${g},${b},0.08)`);
    root.style.setProperty('--accent-10', `rgba(${r},${g},${b},0.10)`);
    root.style.setProperty('--accent-12', `rgba(${r},${g},${b},0.12)`);
    root.style.setProperty('--accent-14', `rgba(${r},${g},${b},0.14)`);
    root.style.setProperty('--accent-20', `rgba(${r},${g},${b},0.20)`);
    root.style.setProperty('--accent-22', `rgba(${r},${g},${b},0.22)`);
    root.style.setProperty('--accent-30', `rgba(${r},${g},${b},0.30)`);
    root.style.setProperty('--accent-40', `rgba(${r},${g},${b},0.40)`);
    root.style.setProperty('--accent-50', `rgba(${r},${g},${b},0.50)`);
    root.style.setProperty('--accent-60', `rgba(${r},${g},${b},0.60)`);
    root.style.setProperty('--accent-70', `rgba(${r},${g},${b},0.70)`);
    root.style.setProperty('--hot', to);
    root.style.setProperty('--hot-dark', `rgba(${hr},${hg},${hb},0.25)`);
    root.style.setProperty('--hot-10', `rgba(${hr},${hg},${hb},0.10)`);
    root.style.setProperty('--hot-20', `rgba(${hr},${hg},${hb},0.20)`);
    const pill = doc?.getElementById('sc-nav-pill');
    if (pill) {
      pill.style.background = `linear-gradient(135deg, ${from}, ${to})`;
      pill.style.boxShadow = `0 2px 18px rgba(${r},${g},${b},0.35)`;
    }
  } catch {}
}

export function injectTheme(iframe: HTMLIFrameElement, theme: string) {
  try {
    const root = iframe.contentDocument?.documentElement;
    if (!root) return;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      const win = iframe.contentWindow as
        (Window & { updateCanvasBg?: (c: string) => void }) | null;
      win?.updateCanvasBg?.('#ffffff');
    } else {
      root.removeAttribute('data-theme');
      const win = iframe.contentWindow as
        (Window & { updateCanvasBg?: (c: string) => void }) | null;
      win?.updateCanvasBg?.('#0e0e0e');
    }
  } catch {}
}

export function injectAmoled(iframe: HTMLIFrameElement, amoled: boolean) {
  try {
    const root = iframe.contentDocument?.documentElement;
    if (!root) return;
    if (amoled) {
      root.setAttribute('data-amoled', '1');
      const win = iframe.contentWindow as
        (Window & { updateCanvasBg?: (c: string) => void }) | null;
      win?.updateCanvasBg?.('#000000');
    } else {
      root.removeAttribute('data-amoled');
    }
  } catch {}
}

export function injectStartOnPicker(iframe: HTMLIFrameElement) {
  try {
    const doc = iframe.contentDocument;
    if (!doc) return;
    const prefsScroll = doc.querySelector('.sc-prefs-scroll');
    if (!prefsScroll || doc.getElementById('sc-start-on-injected')) return;

    const store = useSettingsStore.getState();
    const lang = store.settings.language ?? 'en';
    const t = translations[lang as keyof typeof translations] ?? translations.en;
    const sp = t.stagePrefs;
    const cur = store.settings.defaultStageView ?? 'Editor';
    const accentKey = (store.settings.perApp?.stage?.accentColor ??
      store.settings.accentColor ??
      'blue') as keyof typeof ACCENT_COLORS;
    const accent = ACCENT_COLORS[accentKey] ?? ACCENT_COLORS.blue;

    const section = doc.createElement('div');
    section.id = 'sc-start-on-injected';

    const label = doc.createElement('div');
    label.className = 'sc-prefs-section-label';
    label.innerHTML = `<span class="material-symbols-outlined sc-sec-icon">dashboard</span><span class="sc-sec-text">${sp.startOn}</span>`;
    section.appendChild(label);

    const card = doc.createElement('div');
    card.className = 'sc-prefs-card';

    const row = doc.createElement('div');
    row.className = 'sc-prefs-row';
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';

    const textCol = doc.createElement('div');
    const rl = doc.createElement('p');
    rl.className = 'sc-prefs-row-label';
    rl.textContent = sp.startOn;
    const rh = doc.createElement('p');
    rh.className = 'sc-prefs-row-hint';
    rh.textContent = sp.startOnDesc;
    textCol.appendChild(rl);
    textCol.appendChild(rh);
    row.appendChild(textCol);

    const btnWrap = doc.createElement('div');
    btnWrap.style.cssText = 'display:flex;gap:6px;flex-shrink:0;';

    const views: { value: string; icon: string }[] = [
      { value: 'Editor', icon: 'grid_view' },
      { value: 'Setup', icon: 'folder_open' },
      { value: 'Preferences', icon: 'tune' },
    ];

    views.forEach(({ value, icon }) => {
      const btn = doc.createElement('button');
      const active = cur === value;
      btn.style.cssText = `
        width:40px;height:40px;display:flex;align-items:center;justify-content:center;
        border-radius:10px;cursor:pointer;transition:all 150ms ease;flex-shrink:0;
        border:${active ? `2px solid ${accent.from}` : '2px solid transparent'};
        background:${active ? `linear-gradient(135deg, ${accent.from}22, ${accent.to}18)` : 'rgba(255,255,255,0.06)'};
        color:${active ? accent.from : 'rgba(160,160,180,0.8)'};
      `;
      const ic = doc.createElement('span');
      ic.className = 'material-symbols-outlined';
      ic.style.fontSize = '20px';
      ic.textContent = icon;
      btn.appendChild(ic);

      btn.onclick = () => {
        useSettingsStore.getState().updateSettings({ defaultStageView: value as 'Editor' | 'Setup' | 'Preferences' });
        const updated = useSettingsStore.getState().settings.defaultStageView ?? 'Editor';
        const a2 =
          ACCENT_COLORS[
            (useSettingsStore.getState().settings.perApp?.stage?.accentColor ??
              useSettingsStore.getState().settings.accentColor ??
              'blue') as keyof typeof ACCENT_COLORS
          ] ?? ACCENT_COLORS.blue;
        btnWrap.querySelectorAll('button').forEach((b, idx) => {
          const isActive = views[idx].value === updated;
          (b as HTMLButtonElement).style.border = isActive
            ? `2px solid ${a2.from}`
            : '2px solid transparent';
          (b as HTMLButtonElement).style.background = isActive
            ? `linear-gradient(135deg, ${a2.from}22, ${a2.to}18)`
            : 'rgba(255,255,255,0.06)';
          (b as HTMLButtonElement).style.color = isActive ? a2.from : 'rgba(160,160,180,0.8)';
        });
      };

      btnWrap.appendChild(btn);
    });

    row.appendChild(btnWrap);
    card.appendChild(row);
    section.appendChild(card);
    prefsScroll.appendChild(section);
  } catch {}
}
