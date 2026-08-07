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
    return () => {
      this.listeners.delete(listener);
    };
  },
  notify() {
    this.listeners.forEach((l) => l());
  },
};

import React, { useEffect } from 'react';
import { MorphingModal } from '../../components/motion/morphing-modal';

// ── 4. Dialog ──────────────────────────────────────────────────────────────
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, children, footer, className }: DialogProps) {
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

  return (
    <MorphingModal
      viewId={open ? title || 'dialog' : null}
      onClose={onClose}
      placement="center"
      className={className}
    >
      {title && (
        <div
          style={{
            paddingBottom: '12px',
            marginBottom: '12px',
            borderBottom: '1px solid var(--c-border, rgba(128,128,128,0.15))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
            type="button"
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
          overflowY: 'auto',
          maxHeight: '65vh',
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
            paddingTop: '12px',
            marginTop: '12px',
            borderTop: '1px solid var(--c-border, rgba(128,128,128,0.15))',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          {footer}
        </div>
      )}
    </MorphingModal>
  );
}

// ── 7. Sheet ───────────────────────────────────────────────────────────────
export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
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

  return (
    <MorphingModal
      viewId={open ? title || 'sheet' : null}
      onClose={onClose}
      placement="bottom"
      className={className}
    >
      <div
        style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingBottom: '8px' }}
      >
        <div
          style={{
            width: '40px',
            height: '4px',
            borderRadius: '2px',
            backgroundColor: 'var(--c-border, rgba(128,128,128,0.2))',
          }}
        />
      </div>
      {title && (
        <div
          style={{
            paddingBottom: '12px',
            marginBottom: '12px',
            borderBottom: '1px solid var(--c-border, rgba(128,128,128,0.15))',
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
              color: 'var(--c-text-primary)',
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            type="button"
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
          overflowY: 'auto',
          maxHeight: '65vh',
          fontSize: '13px',
          lineHeight: 1.5,
          color: 'var(--c-text-secondary)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {children}
      </div>
    </MorphingModal>
  );
}
