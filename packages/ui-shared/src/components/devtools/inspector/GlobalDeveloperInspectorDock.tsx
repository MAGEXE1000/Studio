import React, { useState } from 'react';
import { useDeveloperInspectorStore, useIsWebDesktop } from '@workspace/studio-core';
import DeveloperInspectorPanel from './DeveloperInspectorPanel';

/**
 * GlobalDeveloperInspectorDock
 * Persistent, dockable, full-featured developer inspection panel for Studio.
 * Renders everywhere in Studio (Hub, Settings, Chordex, Groovex, Stagex, Vocalex, sheets, overlays).
 */
export const GlobalDeveloperInspectorDock: React.FC = () => {
  const isEnabled = useDeveloperInspectorStore((s) => s.isEnabled);
  const isDockOpen = useDeveloperInspectorStore((s) => s.isDockOpen);
  const dockPosition = useDeveloperInspectorStore((s) => s.dockPosition);
  const isLiveSelecting = useDeveloperInspectorStore((s) => s.isLiveSelecting);
  const isFrozen = useDeveloperInspectorStore((s) => s.isFrozen);
  const selectedFiberInfo = useDeveloperInspectorStore((s) => s.selectedFiberInfo);

  const setIsDockOpen = useDeveloperInspectorStore((s) => s.setIsDockOpen);
  const setIsLiveSelecting = useDeveloperInspectorStore((s) => s.setIsLiveSelecting);
  const toggleFreezeUI = useDeveloperInspectorStore((s) => s.toggleFreezeUI);
  const setDockPosition = useDeveloperInspectorStore((s) => s.setDockPosition);

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
      {/* 1. Floating Action Pill (FAB) - Always visible when enabled */}
      <div
        style={{
          position: 'fixed',
          bottom: isDockOpen ? (dockPosition === 'bottom' ? 'calc(55vh + 12px)' : '20px') : '20px',
          right: '20px',
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(18, 18, 22, 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '999px',
          padding: '6px 12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Live Selector Button */}
        <button
          type="button"
          onClick={() => setIsLiveSelecting(!isLiveSelecting)}
          title="Toggle Drag Live Selector"
          style={{
            background: isLiveSelecting ? '#3b82f6' : 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: '999px',
            padding: '6px 12px',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {isLiveSelecting ? 'adjust' : 'touch_app'}
          </span>
          <span>{isLiveSelecting ? 'Selecting' : 'Select'}</span>
        </button>

        {/* Freeze UI Button */}
        <button
          type="button"
          onClick={toggleFreezeUI}
          title="Freeze Entire Interface"
          style={{
            background: isFrozen ? '#f59e0b' : 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: '999px',
            padding: '6px 12px',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {isFrozen ? 'ac_unit' : 'pause_circle'}
          </span>
          <span>{isFrozen ? 'Frozen' : 'Freeze'}</span>
        </button>

        {/* Selection Badge Info */}
        {selectedFiberInfo && (
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#10b981',
              maxWidth: 120,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: '0 4px',
            }}
          >
            &lt;{selectedFiberInfo.displayName}&gt;
          </div>
        )}

        {/* Toggle Dock Open/Close */}
        <button
          type="button"
          onClick={() => setIsDockOpen(!isDockOpen)}
          title={isDockOpen ? 'Minimize Panel' : 'Open Developer Panel'}
          style={{
            background: 'var(--c-accent-from, #10b981)',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            transform: isDockOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            keyboard_arrow_up
          </span>
        </button>
      </div>

      {/* 2. Docked Developer Panel Container */}
      {isDockOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: dockPosition === 'side' && isWebDesktop ? 'auto' : 0,
            right: 0,
            top: dockPosition === 'side' && isWebDesktop ? 0 : '45vh',
            width: dockPosition === 'side' && isWebDesktop ? '420px' : '100%',
            height: dockPosition === 'side' && isWebDesktop ? '100vh' : '55vh',
            pointerEvents: 'auto',
            background: 'rgba(12, 12, 16, 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: dockPosition !== 'side' ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
            borderLeft: dockPosition === 'side' ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
            borderTopLeftRadius: dockPosition !== 'side' ? '20px' : '0px',
            borderTopRightRadius: dockPosition !== 'side' ? '20px' : '0px',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Dock Header Bar with Position Switcher */}
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: 18 }}>
                bug_report
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', fontFamily: 'Manrope' }}>
                Developer Inspector
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isWebDesktop && (
                <button
                  type="button"
                  onClick={() => setDockPosition(dockPosition === 'bottom' ? 'side' : 'bottom')}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {dockPosition === 'bottom' ? 'Side Dock' : 'Bottom Dock'}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsDockOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  close
                </span>
              </button>
            </div>
          </div>

          {/* Panel Main Content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <DeveloperInspectorPanel />
          </div>
        </div>
      )}
    </div>
  );
};
