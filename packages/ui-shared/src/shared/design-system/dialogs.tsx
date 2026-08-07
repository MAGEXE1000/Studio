export const activeOverlaysRegistry = {
  modals: new Set<string>(),
  sheets: new Set<string>(),
  listeners: new Set<() => void>(),
  
  register(type: 'modal' | 'sheet', id: string) {
    if (type === 'modal') this.modals.add(id);
    else this.sheets.add(id);
    this.notify();
  },
  unregister(type: 'modal' | 'sheet', id: string) {
    if (type === 'modal') this.modals.delete(id);
    else this.sheets.delete(id);
    this.notify();
  },
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  },
  notify() {
    this.listeners.forEach((l) => l());
  }
};
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { NavigationDispatcher, useSettingsStore, ACCENT_COLORS, AppKey, SpringPresets, useIsWebDesktop } from '@workspace/studio-core';
import { ProgressiveBlur } from './ProgressiveBlur';
// ── 4. Dialog ──────────────────────────────────────────────────────────────
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Dialog({ open, onClose, title, children, footer }: DialogProps) {
  const [mounted, setMounted] = useState(false);
  const isLargeScreen = useIsWebDesktop();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      const id = Math.random().toString();
      activeOverlaysRegistry.register('modal', id);
      return () => {
        activeOverlaysRegistry.unregister('modal', id);
      };
    }
    return undefined;
  }, [open]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: isLargeScreen ? 'center' : 'flex-end',
            justifyContent: 'center',
            padding: isLargeScreen ? '16px' : 0,
          }}
          className="studio-dialog-scaffold-root"
        >
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.50)',
              overflow: 'hidden',
            }}
          >
            <ProgressiveBlur
              direction="bottom"
              blurLayers={5}
              maxBlur={12}
              className="absolute inset-0"
            />
          </motion.div>

          {/* Dialog Body */}
          <motion.div
            initial={isLargeScreen ? { scale: 0.95, opacity: 0 } : { y: '100%' }}
            animate={isLargeScreen ? { scale: 1, opacity: 1 } : { y: 0 }}
            exit={isLargeScreen ? { scale: 0.95, opacity: 0 } : { y: '100%' }}
            transition={isLargeScreen ? SpringPresets.expressive : SpringPresets.medium}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--c-surface-highest)',
              borderRadius: isLargeScreen
                ? 'var(--radius-2xl)'
                : 'var(--radius-3xl) var(--radius-3xl) 0 0',
              border: `1px solid var(--c-border)`,
              boxShadow: 'var(--elevation-high)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: isLargeScreen
                ? 'min(640px, 85vh)'
                : 'calc(100vh - env(safe-area-inset-top, 0px) - 24px)',
              paddingBottom: isLargeScreen ? 0 : 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
              transition: 'background-color 200ms ease, border-color 200ms ease',
            }}
          >
            {/* Top Indicator handle for bottom sheet */}
            {!isLargeScreen && (
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '12px 0 8px',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '4px',
                    borderRadius: '2px',
                    backgroundColor: 'var(--c-border)',
                  }}
                />
              </div>
            )}

            {title && (
              <div
                style={{
                  padding: isLargeScreen ? '16px 20px' : '8px 20px 16px',
                  borderBottom: `1px solid var(--c-border)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-headline)',
                    color: 'var(--c-text-primary)',
                  }}
                >
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    color: 'var(--c-text-secondary)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    close
                  </span>
                </button>
              </div>
            )}

            <div
              className="no-scrollbar"
              style={{
                padding: '20px',
                overflowY: 'auto',
                flex: 1,
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'var(--c-text-secondary)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {children}
            </div>

            {footer && (
              <div
                style={{
                  padding: '12px 20px',
                  borderTop: `1px solid var(--c-border)`,
                  backgroundColor: 'var(--c-surface-lowest)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  flexShrink: 0,
                }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── 7. Sheet ───────────────────────────────────────────────────────────────
export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      const id = Math.random().toString();
      activeOverlaysRegistry.register('sheet', id);
      return () => {
        activeOverlaysRegistry.unregister('sheet', id);
      };
    }
    return undefined;
  }, [open]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          className="studio-modal"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={SpringPresets.medium}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--c-surface-highest)',
              borderTopLeftRadius: 'var(--radius-3xl)',
              borderTopRightRadius: 'var(--radius-3xl)',
              border: `1px solid var(--c-border)`,
              borderBottom: 'none',
              boxShadow: 'var(--elevation-high)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '85vh',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)',
              transition: 'background-color 200ms ease, border-color 200ms ease',
            }}
          >
            <div
              style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '8px 0' }}
            >
              <div
                style={{
                  width: '40px',
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: 'var(--c-border)',
                }}
              />
            </div>

            {title && (
              <div
                style={{
                  padding: '8px 20px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-headline)',
                  }}
                >
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    color: 'var(--c-text-secondary)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    close
                  </span>
                </button>
              </div>
            )}

            <div style={{ padding: '0 20px 20px', overflowY: 'auto', flex: 1 }}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

