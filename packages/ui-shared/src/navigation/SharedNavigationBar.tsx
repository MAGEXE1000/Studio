import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  useNavScrollOffset,
  useChordStore,
  useNavigationStore,
  NavigationDispatcher
} from '@workspace/studio-core';
import { 
  StudioLogo, 
  ChordexLogo, 
  DrumexLogo, 
  StagexLogoIcon, 
  GroovexLogo, 
  VocalexLogo 
} from '../components/icons/ChordexLogo';

function useStartupComplete() {
  const [complete, setComplete] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !!(window as any).__studioStartupComplete;
  });

  useEffect(() => {
    if (complete) return;
    
    const check = () => {
      if ((window as any).__studioStartupComplete) {
        setComplete(true);
        clearInterval(interval);
      }
    };

    const interval = setInterval(check, 100);
    window.addEventListener('studio-launch-complete', check);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('studio-launch-complete', check);
    };
  }, [complete]);

  return complete;
}

export interface SharedNavigationItem {
  key: string;
  icon: string | React.ReactNode; // Material Icon name or React component/SVG
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export interface SharedNavigationBarProps {
  items: SharedNavigationItem[];
  isLight?: boolean;
}

export function SharedNavigationBar({ items, isLight = false }: SharedNavigationBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollOffset = useNavScrollOffset();
  const startupComplete = useStartupComplete();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  // Slide down out of view progressively up to 100px (beyond viewport edge)
  const translateY = scrollOffset * 100;

  const currentRoute = useNavigationStore(s => s.history[s.history.length - 1]);
  const currentApp = currentRoute?.app ?? 'hub';

  const handleAppSwitch = (appKey: string) => {
    NavigationDispatcher.push({ app: appKey as any });
    useChordStore.getState().updateSettings({ appMode: appKey as any });
    setIsSwitcherOpen(false);
  };

  const switcherApps = [
    { key: 'hub', label: 'Hub', icon: <StudioLogo size={18} />, onClick: () => handleAppSwitch('hub') },
    { key: 'chords', label: 'Chordex', icon: <ChordexLogo size={18} />, onClick: () => handleAppSwitch('chords') },
    { key: 'drums', label: 'Drumex', icon: <DrumexLogo size={18} />, onClick: () => handleAppSwitch('drums') },
    { key: 'stage', label: 'Stagex', icon: <StagexLogoIcon size={18} />, onClick: () => handleAppSwitch('stage') },
    { key: 'groovex', label: 'Groovex', icon: <GroovexLogo size={18} />, onClick: () => handleAppSwitch('groovex') },
    { key: 'vocalex', label: 'Vocalex', icon: <VocalexLogo size={18} />, onClick: () => handleAppSwitch('vocalex') },
  ];

  const currentItems = isSwitcherOpen ? switcherApps : items;

  return (
    <motion.div
      ref={containerRef}
      className="shared-bottom-nav-container"
      animate={{
        y: translateY,
        x: '-50%'
      }}
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 22,
        mass: 0.35
      }}
      style={{
        position: 'fixed',
        bottom: 'max(14px, env(safe-area-inset-bottom))',
        left: '50%',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      <div
        className="shared-bottom-nav"
        style={{
          pointerEvents: 'auto',
          width: '330px',
          height: '46px',
          borderRadius: '9999px',
          border: '1.5px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.60)',
          boxShadow: '0 8px 20px 8px rgba(0, 0, 0, 0.40)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '2px 4px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', position: 'relative' }}>
          {currentItems.map((item) => {
            const isActive = isSwitcherOpen 
              ? (item.key === currentApp)
              : item.isActive;

            const isIconString = typeof item.icon === 'string';

            return (
              <motion.button
                layout
                key={item.key}
                onClick={item.onClick}
                aria-label={item.label}
                title={item.label}
                whileTap={{ scale: 0.86, y: 1.2 }}
                transition={{
                  type: 'spring',
                  stiffness: 550,
                  damping: 18,
                  mass: 0.4
                }}
                style={{
                  flex: 1,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 1,
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.50)',
                  padding: '0 8px',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'color 200ms ease',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="shared-nav-pill"
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 22,
                      mass: 0.6
                    }}
                    style={{
                      position: 'absolute',
                      inset: '4px 6px',
                      borderRadius: '9999px',
                      background: 'rgba(255, 255, 255, 0.16)',
                      zIndex: -1,
                    }}
                  />
                )}

                {isIconString ? (
                  <motion.span
                    className="material-symbols-outlined text-[20px]"
                    animate={{
                      scale: isActive ? 1.12 : 1.0,
                    }}
                    style={{
                      fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0"
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 550,
                      damping: 18
                    }}
                  >
                    {item.icon}
                  </motion.span>
                ) : (
                  <motion.div
                    animate={{
                      scale: isActive ? 1.12 : 1.0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 550,
                      damping: 18
                    }}
                  >
                    {item.icon}
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {currentApp !== 'hub' && (
        <motion.button
          onClick={() => setIsSwitcherOpen(prev => !prev)}
          whileTap={{ scale: 0.9 }}
          style={{
            pointerEvents: 'auto',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.60)',
            border: '1.5px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 8px 20px 8px rgba(0, 0, 0, 0.40)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isSwitcherOpen ? '#ffffff' : 'rgba(255, 255, 255, 0.60)',
            cursor: 'pointer',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isSwitcherOpen ? 'close' : 'apps'}
          </span>
        </motion.button>
      )}
    </motion.div>
  );
}
