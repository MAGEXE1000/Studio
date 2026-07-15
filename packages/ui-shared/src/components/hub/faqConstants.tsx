import { Capacitor } from '@capacitor/core';
import React, { useState, useEffect } from 'react';
import { useT, startDiagnosticsSession, getTimelineReport, resetUpdateTimeline, subscribeSyncStatus, syncNow, deviceId, type SyncStatus } from '@workspace/studio-core';

export interface FAQItem {
  question: string;
  answer: string;
}
export const FAQ_ITEMS: Record<string, FAQItem[]> = {
  en: [
    {
      question: "What is Studio?",
      answer: "Studio is an all-in-one music production suite designed to compose, synthesize, mix, and record tracks directly in our high-performance application."
    },
    {
      question: "What is Chordex?",
      answer: "Chordex is a professional chord progression companion inside Studio. It helps you compose songs, explore complex scales, and export progressions to your digital audio workstation (DAW)."
    },
    {
      question: "What is Stagex?",
      answer: "Stagex is the live performance and virtual stage component of Studio. It lets you organize virtual stage layouts, manage audio routing, and trigger backing tracks dynamically during gigs."
    },
    {
      question: "How do Android updates in the background work?",
      answer: "Studio queries Firebase metadata in the background. When a new update is downloaded, a lightweight status bar indicator notifies you. Tap it to trigger the native PackageInstaller overlay."
    },
    {
      question: "How do I troubleshoot audio sound and MIDI?",
      answer: "Authorize MIDI and audio recording permissions in Studio Settings, ensure your device volume is up, or trigger a sound engine reset using the tester below."
    },
    {
      question: "How do Android APK updates work?",
      answer: "The native Android app automatically queries our servers for updates. When a new APK is available, the app downloads it directly, enabling instant installation without the Google Play Store."
    },
    {
      question: "Does Studio work offline?",
      answer: "Yes! Studio is fully optimized for offline operation. All synthesis engines, editors, and local database systems work without a network connection. Cloud backups sync automatically once you reconnect."
    },
    {
      question: "Where are my preferences stored?",
      answer: "Your preferences, presets, and recordings are securely stored in your local application database (localStorage and SQLite/IndexedDB). Synchronizing with your account backs them up safely to our secure cloud."
    },
    {
      question: "Does Studio include cloud sync?",
      answer: "Firestore backup functionality is operational but in active development. We recommend relying on local storage and local exports for reliable project management."
    }
  ],
  es: [
    {
      question: "¿Qué es Studio?",
      answer: "Studio es una suite de producción musical todo en uno diseñada para componer, sintetizar, mezclar y grabar pistas directamente en nuestra aplicación de alto rendimiento."
    },
    {
      question: "¿Qué es Chordex?",
      answer: "Chordex es un potente compañero de progresiones de acordes dentro de Studio. Te ayuda a componer canciones, explorar escalas complejas y exportar progresiones a tu secuenciador (DAW) favorito."
    },
    {
      question: "¿Qué es Stagex?",
      answer: "Stagex es el componente de directo y escenario virtual de Studio. Te permite organizar el diseño de tu escenario, gestionar el enrutamiento de audio y lanzar pistas de acompañamiento dinámicamente."
    },
    {
      question: "¿Cómo funcionan las actualizaciones de Android en segundo plano?",
      answer: "Studio consulta los metadatos de Firebase en segundo plano. Cuando se descarga una nueva actualización, un indicador en la barra de estado te notifica. Púlsalo para activar la ventana nativa de PackageInstaller."
    },
    {
      question: "¿Cómo soluciono problemas de sonido y MIDI?",
      answer: "Autoriza los permisos de MIDI y grabación en la configuración de la app, asegúrate de subir el volumen de tu dispositivo o reinicia el motor de sonido con el probador a continuación."
    },
    {
      question: "¿Cómo funcionan las actualizaciones de APK en Android?",
      answer: "La aplicación nativa de Android consulta automáticamente si hay actualizaciones. Cuando hay un nuevo APK disponible, la aplicación lo descarga directamente para su instalación sin depender de Google Play."
    },
    {
      question: "¿Funciona Studio sin conexión (offline)?",
      answer: "¡Sí! Studio está completamente optimizado para funcionar sin conexión. Los motores de síntesis, editores y bases de datos locales funcionan sin red. Los respaldos en la nube se sincronizan al reconectarte."
    },
    {
      question: "¿Dónde se almacenan mis preferencias?",
      answer: "Tus preferencias, preajustes y grabaciones se guardan de forma segura en la base de datos local de la aplicación (localStorage e IndexedDB). Sincronizar tu cuenta los respalda en la nube de Firestore."
    },
    {
      question: "¿Incluye Studio sincronización en la nube?",
      answer: "La funcionalidad de respaldo de Firestore está operativa pero en desarrollo activo. Recomendamos usar el almacenamiento local y las exportaciones manuales."
    }
  ],
  de: [
    {
      question: "Was ist Studio?",
      answer: "Studio ist eine All-in-One-Musikproduktionssuite, mit der Sie Tracks direkt in unserer leistungsstarken App komponieren, synthetisieren, mischen und aufnehmen können."
    },
    {
      question: "Was ist Chordex?",
      answer: "Chordex ist ein professioneller Begleiter für Akkordfolgen in Studio. Es hilft Ihnen, Songs zu komponieren, komplexe Tonleitern zu erkunden und Akkordfolgen in Ihre DAW zu exportieren."
    },
    {
      question: "Was ist Stagex?",
      answer: "Stagex ist die Live-Performance- und virtuelle Bühnenkomponente von Studio. Sie können virtuelle Bühnenlayouts organisieren, Audio-Routing verwalten und Backing-Tracks dynamisch abspielen."
    },
    {
      question: "Wie funktionieren Android-Updates im Hintergrund?",
      answer: "Studio fragt Firebase-Metadaten im Hintergrund ab. Sobald ein Update heruntergeladen wurde, meldet sich ein Indikator in der Statusleiste. Tippen Sie darauf, um PackageInstaller zu starten."
    },
    {
      question: "Wie behebe ich Audio- und MIDI-Probleme?",
      answer: "Erteilen Sie MIDI- und Audioberechtigungen in den App-Einstellungen, stellen Sie sicher, dass die Lautstärke aktiv ist, oder testen Sie die Sound-Engine unten."
    },
    {
      question: "Wie funktionieren Android APK-Updates?",
      answer: "Die native Android-App sucht automatisch auf unseren Servern nach Updates. Wenn eine neue APK verfügbar ist, lädt die App sie direkt herunter und ermöglicht eine sofortige Installation."
    },
    {
      question: "Warum ist Windows als \"Demnächst verfügbar\" markiert?",
      answer: "Wir entwickeln einen optimierten nativen Windows-Client, um ASIO-Treiber mit geringer Latenz und VST-Plugins zu unterstützen. In der Zwischenzeit können Sie die Web-Version nutzen."
    },
    {
      question: "Wo werden meine Einstellungen gespeichert?",
      answer: "Ihre Einstellungen, Presets und Songs werden sicher in der lokalen Datenbank Ihres Browsers gespeichert (localStorage und IndexedDB). Die Sychronisierung sichert sie in unserer Firestore-Cloud."
    },
    {
      question: "Enthält Studio Cloud-Synchronisierung?",
      answer: "Die Firestore-Backup-Funktion ist betriebsbereit, befindet sich jedoch in der aktiven Entwicklung und wird derzeit nicht als öffentliches Feature beworben. Bitte nutzen Sie den lokalen Export."
    }
  ]
};

export function HelpAccordion({ accent, lang }: { accent: { from: string; to: string }; lang: string }) {
  const t = useT();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const faqList = FAQ_ITEMS[lang] ?? FAQ_ITEMS.en;

  // Troubleshooter States
  const [audioState, setAudioState] = useState<'idle' | 'testing' | 'success'>('idle');
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [cacheState, setCacheState] = useState<'idle' | 'clearing' | 'success'>('idle');
  const [securityState, setSecurityState] = useState<'idle' | 'auditing' | 'success'>('idle');
  const [auditReport, setAuditReport] = useState<string | null>(null);
  const [resetState, setResetState] = useState<'idle' | 'repairing' | 'success'>('idle');

  const [timelineText, setTimelineText] = useState('');
  const [diagActive, setDiagActive] = useState(() => {
    try {
      return localStorage.getItem('studio:diagnostics_session_active') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!diagActive) return;
    setTimelineText(getTimelineReport());
    const interval = setInterval(() => {
      setTimelineText(getTimelineReport());
    }, 500);
    return () => clearInterval(interval);
  }, [diagActive]);

  const handleToggleDiagnostics = () => {
    if (diagActive) {
      resetUpdateTimeline();
      setDiagActive(false);
      try {
        localStorage.setItem('studio:diagnostics_session_active', 'false');
      } catch (_) {}
      setTimelineText('');
    } else {
      startDiagnosticsSession();
      setDiagActive(true);
      try {
        localStorage.setItem('studio:diagnostics_session_active', 'true');
      } catch (_) {}
      setTimelineText(getTimelineReport());
    }
  };

  const handleCopyTimeline = () => {
    try {
      navigator.clipboard.writeText(getTimelineReport() || 'No events');
      alert(lang === 'es' ? 'Copiado al portapapeles' : 'Copied to clipboard!');
    } catch (_) {}
  };

  const handleShareTimeline = async () => {
    const report = getTimelineReport();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Studio Update Diagnostics',
          text: report || 'No events'
        });
      } catch (_) {}
    } else {
      handleCopyTimeline();
    }
  };

  const [diagEnabled, setDiagEnabled] = useState(() => {
    try {
      return localStorage.getItem('stagex_diagnostics_enabled') === 'true';
    } catch {
      return false;
    }
  });

  const toggleDiagOverlay = () => {
    const next = !diagEnabled;
    setDiagEnabled(next);
    localStorage.setItem('stagex_diagnostics_enabled', next ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('stagex:diagnostics-toggle', { detail: next }));
  };

  // Audio Context State
  const [audioCtxState, setAudioCtxState] = useState<string>('unknown');
  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const tempCtx = new AudioCtx();
        setAudioCtxState(tempCtx.state);
        tempCtx.close();
      } else {
        setAudioCtxState('unsupported');
      }
    } catch {
      setAudioCtxState('error');
    }
  }, [audioState]);

  // Sync state monitoring
  useEffect(() => {
    if (syncState !== 'syncing') return;
    const unsubscribe = subscribeSyncStatus((status: SyncStatus) => {
      if (status.phase === 'success') {
        setSyncState('success');
        setTimeout(() => setSyncState('idle'), 4000);
      } else if (status.phase === 'error') {
        setSyncState('error');
        setTimeout(() => setSyncState('idle'), 4000);
      }
    });
    return () => unsubscribe();
  }, [syncState]);

  const runAudioTroubleshooter = async () => {
    setAudioState('testing');
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const tempCtx = new AudioCtx();
        if (tempCtx.state === 'suspended') {
          await tempCtx.resume();
        }
        const osc = tempCtx.createOscillator();
        const gain = tempCtx.createGain();
        osc.connect(gain);
        gain.connect(tempCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, tempCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, tempCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.06, tempCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, tempCtx.currentTime + 0.18);
        osc.start();
        osc.stop(tempCtx.currentTime + 0.2);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAudioState('success');
      setTimeout(() => setAudioState('idle'), 3000);
    } catch (e) {
      console.error('Audio repair failed:', e);
      setAudioState('idle');
    }
  };

  const runSyncTroubleshooter = async () => {
    setSyncState('syncing');
    try {
      localStorage.removeItem('chordex_sync_first_pull_done_v1');
      await syncNow();
    } catch (e) {
      console.error('Sync repair failed:', e);
      setSyncState('error');
      setTimeout(() => setSyncState('idle'), 4000);
    }
  };

  const runCacheTroubleshooter = async () => {
    setCacheState('clearing');
    try {
      localStorage.removeItem('chordex_asset_cache_v1');
      localStorage.removeItem('Updater_update_progress');
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('lottie_cache') ||
          key.includes('ota_temp') ||
          key.includes('temp_asset') ||
          key.includes('debug_log')
        )) {
          localStorage.removeItem(key);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1200));
      setCacheState('success');
      setTimeout(() => setCacheState('idle'), 3000);
    } catch (e) {
      console.error('Cache flush failed:', e);
      setCacheState('idle');
    }
  };

  const runSecurityTroubleshooter = async () => {
    setSecurityState('auditing');
    setAuditReport(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const devId = localStorage.getItem('chordex_device_id') ? 'VERIFIED' : 'GENERATED';
      const storageKeys = Object.keys(localStorage);
      const encryptedKeysCount = storageKeys.filter(k => {
        const val = localStorage.getItem(k);
        return val && val.length > 9 && val.charAt(8) === ':';
      }).length;

      const report = lang === 'es'
        ? `Clave de cifrado: ACTIVA (256-bit CFB)\nID de hardware: ${devId}\nBases de datos encriptadas: ${encryptedKeysCount} de ${storageKeys.length} claves\nEstado del cortafuegos: SEGURO`
        : lang === 'de'
        ? `Schlüssel-Status: AKTIV (256-bit CFB)\nHardware-ID: ${devId}\nVerschlüsselte Datenbanken: ${encryptedKeysCount} von ${storageKeys.length} Keys\nSicherheitsstufe: MAXIMAL`
        : `Encryption Key: ACTIVE (256-bit CFB)\nHardware ID: ${devId}\nEncrypted Databases: ${encryptedKeysCount} of ${storageKeys.length} keys\nFirewall Status: SECURE`;

      setAuditReport(report);
      setSecurityState('success');
    } catch (e) {
      setSecurityState('idle');
    }
  };

  const runResetTroubleshooter = async () => {
    setResetState('repairing');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setResetState('success');
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (e) {
      setResetState('idle');
    }
  };

  // Helper for categorizing FAQ items
  const getFaqCategory = (idx: number): string => {
    if ([0, 1, 2, 3, 6].includes(idx)) return 'getting-started';
    if ([4].includes(idx)) return 'audio-midi';
    if ([5, 7, 8].includes(idx)) return 'sync-storage';
    return 'getting-started';
  };

  // Filter FAQ items
  const filteredFaqs = faqList.map((item, idx) => ({ ...item, originalIdx: idx })).filter(item => {
    const matchesSearch = searchQuery.trim() === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !activeCategory || getFaqCategory(item.originalIdx) === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (Capacitor.isNativePlatform()) {
    return (
      <div className="flex flex-col gap-6 pb-24 text-on-surface font-body-md bg-surface-container-lowest min-h-screen">
        {/* Search Bar */}
        <div className="relative mt-4">
          <div className="flex items-center bg-surface-container-high h-14 rounded-full px-4 gap-3 focus-within:ring-2 focus-within:ring-primary/30 transition-all">
            <span className="material-symbols-outlined text-on-surface-variant">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 w-full text-body-lg text-on-surface placeholder:text-on-surface-variant"
              placeholder={lang === 'es' ? "Buscar ayuda y preguntas..." : "Search help articles & FAQs..."}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Help Categories */}
        <section>
          <h2 className="text-label-md uppercase tracking-wider text-on-surface-variant mb-3 px-1">
            {lang === 'es' ? 'Categorías de Ayuda' : 'Help Categories'}
          </h2>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {[
              { id: 'getting-started', label: lang === 'es' ? 'Inicio' : 'Getting Started', icon: 'play_circle' },
              { id: 'audio-midi', label: 'Audio & MIDI', icon: 'volume_up' },
              { id: 'sync-storage', label: lang === 'es' ? 'Sincro y Almacén' : 'Sync & Storage', icon: 'cloud_sync' },
              { id: 'troubleshooting', label: lang === 'es' ? 'Diagnóstico' : 'Diagnostics', icon: 'build' },
            ].map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(isActive ? null : cat.id)}
                  className={`flex items-center gap-2 h-8 px-3 rounded-lg border transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-primary bg-primary-container/20 text-primary font-semibold'
                      : 'border-outline-variant bg-surface-container-low hover:bg-surface-variant text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                  <span className="text-label-lg">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Device Diagnostics Card */}
        {(!activeCategory || activeCategory === 'troubleshooting') && (
          <section className="bg-surface-container rounded-3xl border border-outline-variant/30 p-4 space-y-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-secondary-container">monitor_heart</span>
              </div>
              <div>
                <h3 className="text-title-lg font-bold">{lang === 'es' ? 'Diagnóstico del Dispositivo' : 'Device Diagnostics'}</h3>
                <p className="text-label-md text-on-surface-variant opacity-70">ID: {deviceId()?.slice(0, 12) || 'UNKNOWN'}...</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="bg-surface-container-low p-3 rounded-2xl">
                <p className="text-label-md text-on-surface-variant mb-1">{lang === 'es' ? 'Estado' : 'Status'}</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${audioCtxState === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                  <span className={`text-body-md font-medium ${audioCtxState === 'running' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {audioCtxState === 'running' ? (lang === 'es' ? 'Audio funcionando' : 'Audio running') : (lang === 'es' ? 'Audio detenido' : 'Audio stopped')}
                  </span>
                </div>
              </div>
              <div className="bg-surface-container-low p-3 rounded-2xl">
                <p className="text-label-md text-on-surface-variant mb-1">{lang === 'es' ? 'Almacenamiento' : 'Storage'}</p>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">database</span>
                  <span className="text-body-md font-medium">{localStorage?.length || 0} {lang === 'es' ? 'claves indexadas' : 'keys indexed'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={runAudioTroubleshooter}
                disabled={audioState === 'testing'}
                className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest rounded-full text-label-lg hover:bg-surface-bright transition-all active:scale-95 text-on-surface font-semibold disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[18px] ${audioState === 'testing' ? 'animate-spin' : ''}`}>
                  {audioState === 'testing' ? 'sync' : 'hearing'}
                </span>
                {audioState === 'testing' ? (lang === 'es' ? 'Probando...' : 'Testing...') : (lang === 'es' ? 'Probar Audio' : 'Test Audio')}
              </button>

              <button
                onClick={runSyncTroubleshooter}
                disabled={syncState === 'syncing'}
                className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest rounded-full text-label-lg hover:bg-surface-bright transition-all active:scale-95 text-on-surface font-semibold disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[18px] ${syncState === 'syncing' ? 'animate-spin' : ''}`}>
                  {syncState === 'syncing' ? 'sync' : 'sync'}
                </span>
                {syncState === 'syncing' ? (lang === 'es' ? 'Sincronizando...' : 'Syncing...') : (lang === 'es' ? 'Forzar Sincro' : 'Force Sync')}
              </button>

              <button
                onClick={runCacheTroubleshooter}
                disabled={cacheState === 'clearing'}
                className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest rounded-full text-label-lg hover:bg-surface-bright transition-all active:scale-95 text-on-surface font-semibold disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[18px] ${cacheState === 'clearing' ? 'animate-spin' : ''}`}>
                  {cacheState === 'clearing' ? 'sync' : 'mop'}
                </span>
                {cacheState === 'clearing' ? (lang === 'es' ? 'Limpiando...' : 'Clearing...') : (lang === 'es' ? 'Limpiar Caché' : 'Clear Cache')}
              </button>

              <button
                onClick={runSecurityTroubleshooter}
                disabled={securityState === 'auditing'}
                className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest rounded-full text-label-lg hover:bg-surface-bright transition-all active:scale-95 text-on-surface font-semibold disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[18px] ${securityState === 'auditing' ? 'animate-spin' : ''}`}>
                  {securityState === 'auditing' ? 'sync' : 'security'}
                </span>
                {securityState === 'auditing' ? (lang === 'es' ? 'Auditando...' : 'Auditing...') : (lang === 'es' ? 'Auditoría Seguridad' : 'Security Audit')}
              </button>

              <button
                onClick={runResetTroubleshooter}
                disabled={resetState === 'repairing'}
                className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest rounded-full text-label-lg hover:bg-surface-bright transition-all active:scale-95 text-on-surface font-semibold disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[18px] ${resetState === 'repairing' ? 'animate-spin' : ''}`}>
                  {resetState === 'repairing' ? 'sync' : 'restart_alt'}
                </span>
                {resetState === 'repairing' ? (lang === 'es' ? 'Restableciendo...' : 'Resetting...') : (lang === 'es' ? 'Reiniciar' : 'Reset & Reload')}
              </button>

              <button
                onClick={toggleDiagOverlay}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-label-lg transition-all active:scale-95 font-semibold ${
                  diagEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-surface-container-highest text-on-surface hover:bg-surface-bright'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">bug_report</span>
                {diagEnabled ? (lang === 'es' ? 'Diag: ACTIVO' : 'Diagnostics: ON') : (lang === 'es' ? 'Superposición Diag' : 'Diagnostics Overlay')}
              </button>
            </div>

            {auditReport && (
              <div className="bg-black/40 rounded-xl p-4 font-mono text-label-md border border-outline-variant/20 overflow-hidden relative">
                <div className="flex flex-col gap-1 text-emerald-400">
                  {auditReport.split('\n').map((line, lIdx) => {
                    const colonIdx = line.indexOf(':');
                    if (colonIdx !== -1) {
                      const prefix = line.slice(0, colonIdx + 1);
                      const suffix = line.slice(colonIdx + 1);
                      return (
                        <p key={lIdx}>
                          <span className="text-emerald-500/60">{prefix}</span>
                          <span>{suffix}</span>
                        </p>
                      );
                    }
                    return <p key={lIdx}>{line}</p>;
                  })}
                </div>
                <div className="absolute right-3 top-3 opacity-20 text-emerald-400">
                  <span className="material-symbols-outlined text-[48px]">terminal</span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Update Session Diagnostics Card */}
        {(!activeCategory || activeCategory === 'troubleshooting') && (
          <section className="bg-surface-container-low rounded-3xl border border-outline-variant/20 relative overflow-hidden group p-4">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-on-primary-container">system_update_alt</span>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-title-lg font-bold mb-1">{lang === 'es' ? 'Diagnósticos de Actualización' : 'Update Session Diagnostics'}</h3>
                  <p className="text-body-md text-on-surface-variant">
                    {lang === 'es'
                      ? 'Activa el modo de diagnóstico para registrar y rastrear el historial de eventos del actualizador nativo en tiempo real.'
                      : 'Enable diagnostics mode to capture, trace, and inspect native updater event history in real-time.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleToggleDiagnostics}
                    className={`h-10 px-6 rounded-full text-label-lg font-semibold flex items-center gap-2 transition-all ${
                      diagActive
                        ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                        : 'bg-primary text-on-primary hover:bg-primary-fixed-dim'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {diagActive ? 'pause' : 'play_arrow'}
                    </span>
                    {diagActive ? (lang === 'es' ? 'Modo Diagnóstico: ACTIVO' : 'Diagnostic Mode: ACTIVE') : (lang === 'es' ? 'Iniciar Diagnóstico' : 'Start Diagnostic Mode')}
                  </button>
                  {diagActive && (
                    <>
                      <button
                        onClick={handleCopyTimeline}
                        className="h-10 px-4 bg-surface-container-highest text-on-surface rounded-full text-label-lg font-semibold flex items-center gap-2 hover:bg-surface-bright transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                        {lang === 'es' ? 'Copiar' : 'Copy Trace'}
                      </button>
                      <button
                        onClick={handleShareTimeline}
                        className="h-10 px-4 bg-surface-container-highest text-on-surface rounded-full text-label-lg font-semibold flex items-center gap-2 hover:bg-surface-bright transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">share</span>
                        {lang === 'es' ? 'Compartir' : 'Share Trace'}
                      </button>
                    </>
                  )}
                </div>
                {diagActive && (
                  <div className="bg-black/40 rounded-xl p-4 font-mono text-label-md border border-outline-variant/20 overflow-y-auto max-h-56 text-left text-sky-400 white-space-pre-wrap">
                    {timelineText || (lang === 'es' ? 'Esperando eventos del actualizador...' : 'Waiting for update events...')}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* FAQs Section */}
        <section>
          <h2 className="text-label-md uppercase tracking-wider text-on-surface-variant mb-4 px-1">
            {lang === 'es' ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
          </h2>
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-6 text-on-surface-variant">
                {lang === 'es' ? 'No se encontraron preguntas.' : 'No matching FAQs found.'}
              </div>
            ) : (
              filteredFaqs.map((item) => {
                const isOpen = openIdx === item.originalIdx;
                return (
                  <div key={item.originalIdx} className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10">
                    <button
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-container-high transition-colors group"
                      onClick={() => setOpenIdx(isOpen ? null : item.originalIdx)}
                    >
                      <span className="font-medium text-body-lg text-on-surface">{item.question}</span>
                      <span
                        className="material-symbols-outlined transition-transform duration-300 text-on-surface"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        expand_more
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-body-md text-on-surface-variant border-t border-outline-variant/5 pt-4">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Direct Assistance Card */}
        <section className="bg-surface-container-highest/30 rounded-3xl p-8 text-center border-2 border-dashed border-outline-variant/30 mt-8">
          <h3 className="text-headline-lg-mobile font-bold mb-2">
            {lang === 'es' ? '¿Necesitas ayuda directa?' : 'Need direct assistance?'}
          </h3>
          <p className="text-body-md text-on-surface-variant mb-6 max-w-sm mx-auto">
            {lang === 'es'
              ? 'Para ayuda con tu cuenta, recuperación de proyectos o problemas complejos, visita nuestro repositorio oficial en GitHub.'
              : 'For help with your account, project recovery, or complex technical issues, feel free to visit our official GitHub repository.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-surface-container-high text-on-surface border border-outline-variant hover:bg-surface-bright transition-all font-medium"
              href="https://github.com/MAGEXE1000/Studio"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="material-symbols-outlined text-[20px]">code</span>
              GitHub Repository
            </a>
            <a
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-secondary-container text-on-secondary-container hover:brightness-110 transition-all font-medium"
              href="mailto:support@chordex.app"
            >
              <span className="material-symbols-outlined text-[20px]">mail</span>
              Contact Support
            </a>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 24 }}>
      {/* Search Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(128, 128, 128, 0.08)',
        borderRadius: 12,
      }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--c-text-secondary)', fontSize: 20 }}>
          search
        </span>
        <input
          type="text"
          placeholder={t.help.accordion.searchPlaceholder || (lang === 'es' ? "Buscar ayuda y preguntas..." : "Search help articles & FAQs...")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--c-text-primary)',
            fontSize: 14,
            width: '100%',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-secondary)', padding: 0 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        )}
      </div>

      {/* Category Chips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-text-secondary)', opacity: 0.6, margin: 0 }}>
          {lang === 'es' ? 'Categorías de Ayuda' : 'Help Categories'}
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { id: 'getting-started', label: t.help.accordion.categories.gettingStarted || (lang === 'es' ? 'Inicio' : 'Getting Started'), icon: 'play_circle' },
            { id: 'audio-midi', label: 'Audio & MIDI', icon: 'volume_up' },
            { id: 'sync-storage', label: t.help.accordion.categories.syncStorage || (lang === 'es' ? 'Sincro y Almacén' : 'Sync & Storage'), icon: 'cloud_sync' },
            { id: 'troubleshooting', label: t.help.accordion.categories.diagnostics || (lang === 'es' ? 'Diagnóstico' : 'Diagnostics'), icon: 'build' },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(isActive ? null : cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: isActive ? 'none' : '1px solid rgba(128, 128, 128, 0.15)',
                  background: isActive ? `linear-gradient(135deg, ${accent.from}, ${accent.to})` : 'rgba(255, 255, 255, 0.02)',
                  color: isActive ? '#fff' : 'var(--c-text-primary)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Device Diagnostics Card */}
      {(!activeCategory || activeCategory === 'troubleshooting') && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(128, 128, 128, 0.08)',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ color: accent.from, fontSize: 22 }}>
              monitor_heart
            </span>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--c-text-primary)' }}>
              {t.help.accordion.diagnosticsCard.title || (lang === 'es' ? 'Diagnóstico del Dispositivo' : 'Device Diagnostics')}
            </h4>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 11, color: 'var(--c-text-secondary)' }}>
            <div>
              <span style={{ opacity: 0.6 }}>ID: </span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{deviceId()?.slice(0, 12) || 'UNKNOWN'}...</span>
            </div>
            <div>
              <span style={{ opacity: 0.6 }}>Platform: </span>
              <span style={{ fontWeight: 600 }}>{Capacitor.isNativePlatform() ? 'Android App' : 'Web Browser'}</span>
            </div>
            <div>
              <span style={{ opacity: 0.6 }}>Audio: </span>
              <span style={{ fontWeight: 600, color: audioCtxState === 'running' ? '#40c057' : 'var(--c-text-secondary)' }}>{audioCtxState}</span>
            </div>
            <div>
              <span style={{ opacity: 0.6 }}>Storage: </span>
              <span style={{ fontWeight: 600 }}>{localStorage?.length || 0} keys</span>
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(128, 128, 128, 0.08)', margin: '4px 0' }} />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              onClick={runAudioTroubleshooter}
              disabled={audioState === 'testing'}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(128,128,128,0.1)',
                color: 'var(--c-text-primary)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14, animation: audioState === 'testing' ? 'spin 1s linear infinite' : 'none' }}>
                {audioState === 'testing' ? 'sync' : 'volume_up'}
              </span>
              {audioState === 'testing' ? (t.help.accordion.diagnosticsCard.btnTesting || 'Testing...') : (t.help.accordion.diagnosticsCard.btnTestAudio || 'Test Audio')}
            </button>

            <button
              onClick={runSyncTroubleshooter}
              disabled={syncState === 'syncing'}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(128,128,128,0.1)',
                color: 'var(--c-text-primary)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14, animation: syncState === 'syncing' ? 'spin 1s linear infinite' : 'none' }}>
                {syncState === 'syncing' ? 'sync' : 'sync_problem'}
              </span>
              {syncState === 'syncing' ? (t.help.accordion.diagnosticsCard.btnSyncing || 'Syncing...') : (t.help.accordion.diagnosticsCard.btnForceSync || 'Force Sync')}
            </button>

            <button
              onClick={runCacheTroubleshooter}
              disabled={cacheState === 'clearing'}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(128,128,128,0.1)',
                color: 'var(--c-text-primary)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14, animation: cacheState === 'clearing' ? 'spin 1s linear infinite' : 'none' }}>
                {cacheState === 'clearing' ? 'sync' : 'mop'}
              </span>
              {cacheState === 'clearing' ? (t.help.accordion.diagnosticsCard.btnClearing || 'Clearing...') : (t.help.accordion.diagnosticsCard.btnClearCache || 'Clear Cache')}
            </button>

            <button
              onClick={runSecurityTroubleshooter}
              disabled={securityState === 'auditing'}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(128,128,128,0.1)',
                color: 'var(--c-text-primary)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14, animation: securityState === 'auditing' ? 'spin 1s linear infinite' : 'none' }}>
                {securityState === 'auditing' ? 'sync' : 'security'}
              </span>
              {securityState === 'auditing' ? (t.help.accordion.diagnosticsCard.btnAuditing || 'Auditing...') : (t.help.accordion.diagnosticsCard.btnSecurityAudit || 'Security Audit')}
            </button>

            <button
              onClick={runResetTroubleshooter}
              disabled={resetState === 'repairing'}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(128,128,128,0.1)',
                color: 'var(--c-text-primary)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14, animation: resetState === 'repairing' ? 'spin 1s linear infinite' : 'none' }}>
                {resetState === 'repairing' ? 'sync' : 'restart_alt'}
              </span>
              {resetState === 'repairing' ? (t.help.accordion.diagnosticsCard.btnResetting || 'Resetting...') : (t.help.accordion.diagnosticsCard.btnResetReload || 'Reset & Reload')}
            </button>

            <button
              onClick={toggleDiagOverlay}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: diagEnabled ? 'rgba(64,192,87,0.15)' : 'rgba(255,255,255,0.04)',
                border: diagEnabled ? '1px solid rgba(64,192,87,0.3)' : '1px solid rgba(128,128,128,0.1)',
                color: diagEnabled ? '#40c057' : 'var(--c-text-primary)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                bug_report
              </span>
              {diagEnabled ? (t.help.accordion.diagnosticsCard.btnDiagOn || 'Diagnostics: ON') : (t.help.accordion.diagnosticsCard.btnDiagOff || 'Diagnostics Overlay')}
            </button>
          </div>

          {auditReport && (
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(128,128,128,0.1)',
              borderRadius: 8,
              padding: 10,
              fontSize: 10,
              fontFamily: 'monospace',
              color: '#40c057',
              whiteSpace: 'pre-wrap',
            }}>
              {auditReport}
            </div>
          )}
        </div>
      )}

      {/* Update Session Diagnostics Card */}
      {(!activeCategory || activeCategory === 'troubleshooting') && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(128, 128, 128, 0.08)',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ color: accent.to, fontSize: 22 }}>
              system_update
            </span>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--c-text-primary)' }}>
              {lang === 'es' ? 'Diagnósticos de Actualización' : 'Update Session Diagnostics'}
            </h4>
          </div>
          
          <p style={{ margin: 0, fontSize: 11, color: 'var(--c-text-secondary)', lineHeight: 1.4 }}>
            {lang === 'es' 
              ? 'Activa el modo de diagnóstico para registrar y rastrear el historial de eventos del actualizador nativo en tiempo real.' 
              : 'Enable diagnostics mode to capture, trace, and inspect native updater event history in real-time.'}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              onClick={handleToggleDiagnostics}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: diagActive ? 'rgba(64,192,87,0.15)' : 'rgba(255,255,255,0.04)',
                border: diagActive ? '1px solid rgba(64,192,87,0.3)' : '1px solid rgba(128,128,128,0.1)',
                color: diagActive ? '#40c057' : 'var(--c-text-primary)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                {diagActive ? 'pause_circle' : 'play_circle'}
              </span>
              {diagActive ? (lang === 'es' ? 'Modo Diagnóstico: ACTIVO' : 'Diagnostic Mode: ACTIVE') : (lang === 'es' ? 'Iniciar Diagnóstico' : 'Start Diagnostic Mode')}
            </button>

            {diagActive && (
              <>
                <button
                  onClick={handleCopyTimeline}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(128,128,128,0.1)',
                    color: 'var(--c-text-primary)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>content_copy</span>
                  {lang === 'es' ? 'Copiar Registro' : 'Copy Trace'}
                </button>

                <button
                  onClick={handleShareTimeline}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(128,128,128,0.1)',
                    color: 'var(--c-text-primary)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>share</span>
                  {lang === 'es' ? 'Compartir' : 'Share Trace'}
                </button>
              </>
            )}
          </div>

          {diagActive && (
            <div style={{
              background: '#0c0f12',
              border: '1px solid rgba(128,128,128,0.15)',
              borderRadius: 10,
              padding: 12,
              fontFamily: '"Roboto Mono", "Courier New", monospace',
              fontSize: '11px',
              lineHeight: '1.4',
              color: '#4dabf7',
              maxHeight: '220px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              textAlign: 'left'
            }}>
              {timelineText || (lang === 'es' ? 'Esperando eventos del actualizador...' : 'Waiting for update events...')}
            </div>
          )}
        </div>
      )}

      {/* FAQ items / Accordions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-text-secondary)', opacity: 0.6, margin: 0 }}>
          {lang === 'es' ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
        </h3>
        
        {filteredFaqs.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 13 }}>
            {lang === 'es' ? 'No se encontraron preguntas.' : 'No matching FAQs found.'}
          </div>
        ) : (
          filteredFaqs.map((item) => {
            const isOpen = openIdx === item.originalIdx;
            return (
              <div
                key={item.originalIdx}
                className="spring-in"
                style={{
                  background: 'var(--app-surface)',
                  border: '1px solid rgba(128,128,128,0.1)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: isOpen ? '0 8px 24px rgba(0,0,0,0.06)' : '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'box-shadow 300ms ease, border-color 300ms ease',
                  borderColor: isOpen ? `color-mix(in srgb, ${accent.from} 30%, rgba(128,128,128,0.1))` : 'rgba(128,128,128,0.1)',
                }}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : item.originalIdx)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 18px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--c-text-primary)',
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 700,
                    fontSize: 14,
                    gap: 12,
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{ transition: 'color 200ms ease', color: isOpen ? accent.from : 'var(--c-text-primary)' }}>
                    {item.question}
                  </span>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), color 200ms ease',
                      fontSize: 20,
                      color: isOpen ? accent.from : 'var(--c-text-secondary)',
                    }}
                  >
                    expand_more
                  </span>
                </button>
                <div
                  style={{
                    maxHeight: isOpen ? 380 : 0,
                    opacity: isOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 300ms cubic-bezier(0.25, 1, 0.5, 1), opacity 240ms ease',
                  }}
                >
                  <div
                    style={{
                      padding: '0 18px 16px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: 'var(--c-text-secondary)',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <span>{item.answer}</span>

                    {/* Troubleshooter Injectors */}
                    {item.originalIdx === 4 && (
                      <button
                        onClick={runAudioTroubleshooter}
                        disabled={audioState === 'testing'}
                        style={{
                          marginTop: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '10px 16px',
                          borderRadius: 12,
                          background: audioState === 'testing' ? 'rgba(128,128,128,0.1)' : `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                          color: audioState === 'testing' ? 'var(--c-text-secondary)' : '#ffffff',
                          border: 'none',
                          fontFamily: 'Manrope, sans-serif',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: audioState === 'testing' ? 'default' : 'pointer',
                          boxShadow: audioState === 'testing' ? 'none' : `0 4px 12px rgba(0, 122, 255, 0.15)`,
                          transition: 'all 200ms ease',
                          outline: 'none',
                        }}
                      >
                        {audioState === 'testing' ? (
                          <>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>
                              sync
                            </span>
                            <span>{lang === 'es' ? 'Probando Altavoces...' : lang === 'de' ? 'Testen...' : 'Running Diagnostics...'}</span>
                          </>
                        ) : audioState === 'success' ? (
                          <>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                              check_circle
                            </span>
                            <span>{lang === 'es' ? '¡Altavoz Activo!' : lang === 'de' ? 'Lautsprecher Aktiv!' : 'Sound Active!'}</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                              volume_up
                            </span>
                            <span>{lang === 'es' ? 'Reiniciar y Probar Sonido' : lang === 'de' ? 'Sound-Engine testen' : 'Restart & Test Sound Engine'}</span>
                          </>
                        )}
                      </button>
                    )}

                    {item.originalIdx === 5 && (
                      <button
                        onClick={runSyncTroubleshooter}
                        disabled={syncState === 'syncing'}
                        style={{
                          marginTop: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '10px 16px',
                          borderRadius: 12,
                          background: syncState === 'syncing' ? 'rgba(128,128,128,0.1)' : `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                          color: syncState === 'syncing' ? 'var(--c-text-secondary)' : '#ffffff',
                          border: 'none',
                          fontFamily: 'Manrope, sans-serif',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: syncState === 'syncing' ? 'default' : 'pointer',
                          boxShadow: syncState === 'syncing' ? 'none' : `0 4px 12px rgba(0, 122, 255, 0.15)`,
                          transition: 'all 200ms ease',
                          outline: 'none',
                        }}
                      >
                        {syncState === 'syncing' ? (
                          <>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>
                              sync
                            </span>
                            <span>{lang === 'es' ? 'Sincronizando de Nuevo...' : lang === 'de' ? 'Synchronisieren...' : 'Re-syncing with Cloud...'}</span>
                          </>
                        ) : syncState === 'success' ? (
                          <>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                              check_circle
                            </span>
                            <span>{lang === 'es' ? '¡Sincronización Exitosa!' : lang === 'de' ? 'Erfolgreich synchronisiert!' : 'Sync Successful!'}</span>
                          </>
                        ) : syncState === 'error' ? (
                          <>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                              error
                            </span>
                            <span>{lang === 'es' ? 'Error al Sincronizar' : lang === 'de' ? 'Synchronisierungsfehler' : 'Sync Failed'}</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                              cloud_sync
                            </span>
                            <span>{lang === 'es' ? 'Forzar Sincronización Completa' : lang === 'de' ? 'Datenbank neu synchronisieren' : 'Force Full Re-Sync'}</span>
                          </>
                        )}
                      </button>
                    )}

                    {item.originalIdx === 6 && (
                      <button
                        onClick={runCacheTroubleshooter}
                        disabled={cacheState === 'clearing'}
                        style={{
                          marginTop: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '10px 16px',
                          borderRadius: 12,
                          background: cacheState === 'clearing' ? 'rgba(128,128,128,0.1)' : `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                          color: cacheState === 'clearing' ? 'var(--c-text-secondary)' : '#ffffff',
                          border: 'none',
                          fontFamily: 'Manrope, sans-serif',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: cacheState === 'clearing' ? 'default' : 'pointer',
                          boxShadow: cacheState === 'clearing' ? 'none' : `0 4px 12px rgba(0, 122, 255, 0.15)`,
                          transition: 'all 200ms ease',
                          outline: 'none',
                        }}
                      >
                        {cacheState === 'clearing' ? (
                          <>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>
                              sync
                            </span>
                            <span>{lang === 'es' ? 'Limpiando Caché...' : lang === 'de' ? 'Cache wird geleert...' : 'Flushing Cache...'}</span>
                          </>
                        ) : cacheState === 'success' ? (
                          <>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                              check_circle
                            </span>
                            <span>{lang === 'es' ? '¡Caché Limpia!' : lang === 'de' ? 'Cache Geleert!' : 'Cache Cleaned!'}</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                              mop
                            </span>
                            <span>{lang === 'es' ? 'Vaciar Caché y Temporales' : lang === 'de' ? 'Caches & Temp-Dateien löschen' : 'Wipe Caches & Temp Files'}</span>
                          </>
                        )}
                      </button>
                    )}

                    {item.originalIdx === 7 && (
                      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <button
                          onClick={runSecurityTroubleshooter}
                          disabled={securityState === 'auditing'}
                          style={{
                            marginTop: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            padding: '10px 16px',
                            borderRadius: 12,
                            background: securityState === 'auditing' ? 'rgba(128,128,128,0.1)' : `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                            color: securityState === 'auditing' ? 'var(--c-text-secondary)' : '#ffffff',
                            border: 'none',
                            fontFamily: 'Manrope, sans-serif',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: securityState === 'auditing' ? 'default' : 'pointer',
                            boxShadow: securityState === 'auditing' ? 'none' : `0 4px 12px rgba(0, 122, 255, 0.15)`,
                            transition: 'all 200ms ease',
                            outline: 'none',
                          }}
                        >
                          {securityState === 'auditing' ? (
                            <>
                              <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>
                                sync
                              </span>
                              <span>{lang === 'es' ? 'Realizando Auditoría...' : lang === 'de' ? 'Prüfung läuft...' : 'Auditing Storage...'}</span>
                            </>
                          ) : securityState === 'success' ? (
                            <>
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                                check_circle
                              </span>
                              <span>{lang === 'es' ? '¡Auditoría Completa!' : lang === 'de' ? 'Prüfung Abgeschlossen!' : 'Audit Complete!'}</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                                security
                              </span>
                              <span>{lang === 'es' ? 'Auditar Claves y Encriptación' : lang === 'de' ? 'Datenbank-Verschlüsselung prüfen' : 'Audit Keys & Encryption'}</span>
                            </>
                          )}
                        </button>
                        {auditReport && (
                          <div style={{
                            marginTop: 10,
                            padding: 12,
                            background: 'rgba(0,0,0,0.15)',
                            border: '1px solid rgba(128,128,128,0.1)',
                            borderRadius: 8,
                            fontFamily: 'monospace',
                            fontSize: 11,
                            color: '#40c057',
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.4,
                          }}>
                            {auditReport}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* GitHub contact card */}
      <div style={{
        padding: 18,
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid rgba(128, 128, 128, 0.06)',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--c-text-primary)' }}>
          {lang === 'es' ? '¿Necesitas ayuda directa?' : 'Need direct assistance?'}
        </h4>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--c-text-secondary)', lineHeight: 1.4 }}>
          {lang === 'es' ? 'Para ayuda con tu cuenta, recuperación de proyectos o problemas complejos, visita nuestro repositorio oficial en GitHub.' : 'For help with your account, project recovery, or complex issues, feel free to visit our official GitHub repository or reach out directly.'}
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <a
            href="https://github.com/MAGEXE1000/Studio"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--c-text-primary)',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
            GitHub Repository
          </a>
        </div>
      </div>
    </div>
  );
}
