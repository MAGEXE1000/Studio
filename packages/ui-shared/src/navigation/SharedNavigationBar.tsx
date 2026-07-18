import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ProgressiveBlur } from '../components/design-system/ProgressiveBlur';

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

  return (
    <div
      ref={containerRef}
      className="shared-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 'max(14px, env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'max-content',
        minWidth: '280px',
        maxWidth: '90%',
        height: '46px',
        borderRadius: '9999px',
        border: `1.5px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.18)'}`,
        background: isLight ? 'rgba(255, 255, 255, 0.65)' : 'rgba(10, 10, 12, 0.45)',
        boxShadow: isLight
          ? '0 10px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)'
          : '0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '2px 4px',
        pointerEvents: 'auto',
      }}
    >
      <ProgressiveBlur
        direction="top"
        blurLayers={5}
        maxBlur={8}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          borderRadius: 'inherit',
          overflow: 'hidden',
        }}
      />

      <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', position: 'relative' }}>
        {items.map((item) => {
          const isIconString = typeof item.icon === 'string';

          return (
            <motion.button
              key={item.key}
              onClick={item.onClick}
              aria-label={item.label}
              title={item.label}
              whileTap={{ scale: 0.88, y: 1 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 25,
                mass: 0.5
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
                color: item.isActive
                  ? (isLight ? '#000000' : '#ffffff')
                  : (isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)'),
                padding: '0 16px',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
                transition: 'color 200ms ease',
              }}
            >
              {item.isActive && (
                <motion.div
                  layoutId="shared-nav-pill"
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 30,
                    mass: 0.8
                  }}
                  style={{
                    position: 'absolute',
                    inset: '4px 6px',
                    borderRadius: '9999px',
                    background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
                    border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.22)',
                    boxShadow: isLight
                      ? 'inset 0 1px 0 rgba(255,255,255,0.90), 0 2px 4px rgba(0,0,0,0.04)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.20), 0 4px 10px rgba(0,0,0,0.15)',
                    zIndex: -1,
                  }}
                />
              )}

              {isIconString ? (
                <motion.span
                  className="material-symbols-outlined text-[20px]"
                  animate={{
                    scale: item.isActive ? 1.15 : 1.0,
                  }}
                  style={{
                    fontVariationSettings: item.isActive ? "'FILL' 1" : "'FILL' 0"
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 22
                  }}
                >
                  {item.icon}
                </motion.span>
              ) : (
                <motion.div
                  animate={{
                    scale: item.isActive ? 1.15 : 1.0,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 22
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
  );
}
