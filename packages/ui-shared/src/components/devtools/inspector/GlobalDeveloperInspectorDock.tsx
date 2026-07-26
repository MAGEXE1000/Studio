import React from 'react';
import { useDeveloperInspectorStore, useIsWebDesktop } from '@workspace/studio-core';
import DeveloperInspectorPanel from './DeveloperInspectorPanel';

/**
 * GlobalDeveloperInspectorDock
 * Premium Samsung Edge Panel style right-side drawer for Studio Developer Inspector.
 * Collapsed by default into a translucent right-edge pull tab.
 * Expandable into a 380px (88vw mobile) side drawer with blurred background & 60 FPS spring transition.
 */
export const GlobalDeveloperInspectorDock: React.FC = () => {
  const isEnabled = useDeveloperInspectorStore((s) => s.isEnabled);
  const isDockOpen = useDeveloperInspectorStore((s) => s.isDockOpen);
  const isLiveSelecting = useDeveloperInspectorStore((s) => s.isLiveSelecting);
  const isFrozen = useDeveloperInspectorStore((s) => s.isFrozen);
  const selectedFiberInfo = useDeveloperInspectorStore((s) => s.selectedFiberInfo);

  const setIsDockOpen = useDeveloperInspectorStore((s) => s.setIsDockOpen);
  const setIsLiveSelecting = useDeveloperInspectorStore((s) => s.setIsLiveSelecting);
  const toggleFreezeUI = useDeveloperInspectorStore((s) => s.toggleFreezeUI);

  const isWebDesktop = useIsWebDesktop();

  if (!isEnabled) return null;

  return (
    <div
      data-inspector-dock="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 999999,
      }}
    >
      {/* 1. Samsung Edge Panel Handle / Edge Pull Tab (Right-Edge Anchored) */}
      {!isDockOpen && (
        <button
          type="button"
          onClick={() => setIsDockOpen(true)}
          title="Open Developer Edge Panel"
          style={{
            position: 'fixed',
            right: 0,
            top: '42%',
            transform: 'translateY(-50%)',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(18, 18, 24, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRight: 'none',
            borderRadius: '16px 0 0 16px',
            padding: '10px 12px 10px 10px',
            boxShadow: '-6px 8px 24px rgba(0, 0, 0, 0.5)',
            cursor: 'pointer',
            transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
            zIndex: 999999,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: isFrozen ? '#f59e0b' : '#10b981' }}
          >
            bug_report
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#ffffff',
              fontFamily: 'Manrope, sans-serif',
              letterSpacing: '0.02em',
            }}
          >
            Inspect
          </span>
        </button>
      )}

      {/* 2. Samsung Edge Panel Right Floating Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 12,
          right: 12,
          bottom: 12,
          width: isWebDesktop ? '330px' : 'min(340px, 85vw)',
          pointerEvents: isDockOpen ? 'auto' : 'none',
          background: 'rgba(14, 14, 18, 0.92)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 20,
          boxShadow: '-8px 16px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transform: isDockOpen ? 'translateX(0)' : 'translateX(calc(100% + 24px))',
          transition: 'transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)',
          zIndex: 999999,
        }}
      >
        {/* Edge Panel Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: 20 }}>
              bug_report
            </span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', fontFamily: 'Manrope' }}>
                Developer Inspector
              </div>
              {selectedFiberInfo && (
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#10b981' }}>
                  &lt;{selectedFiberInfo.displayName}&gt;
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Live Select Button */}
            <button
              type="button"
              onClick={() => setIsLiveSelecting(!isLiveSelecting)}
              title="Toggle Live Element Selector"
              style={{
                background: isLiveSelecting ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '999px',
                padding: '5px 10px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                {isLiveSelecting ? 'adjust' : 'touch_app'}
              </span>
              <span>{isLiveSelecting ? 'Selecting' : 'Select'}</span>
            </button>

            {/* Freeze UI Button */}
            <button
              type="button"
              onClick={toggleFreezeUI}
              title="Freeze Entire Application"
              style={{
                background: isFrozen ? '#f59e0b' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '999px',
                padding: '5px 10px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                {isFrozen ? 'ac_unit' : 'pause_circle'}
              </span>
              <span>{isFrozen ? 'Frozen' : 'Freeze'}</span>
            </button>

            {/* Close Panel Button */}
            <button
              type="button"
              onClick={() => setIsDockOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                chevron_right
              </span>
            </button>
          </div>
        </div>

        {/* Panel Main Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <DeveloperInspectorPanel />
        </div>
      </div>
    </div>
  );
};

export default GlobalDeveloperInspectorDock;
