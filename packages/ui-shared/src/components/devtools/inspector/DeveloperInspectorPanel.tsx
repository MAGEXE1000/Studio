import React, { useState, useMemo } from 'react';
import {
  useDeveloperInspectorStore,
  InspectorTab,
  GridOverlayMode,
  useNavigationStore,
} from '@workspace/studio-core';
import { Toggle } from '../../design-system/StudioToggle';
import {
  getFiberInfoFromDOMNode,
  getParentElement,
  getFirstChildElement,
  getPreviousSiblingElement,
  getNextSiblingElement,
} from './InspectorEngine';

export const DeveloperInspectorPanel: React.FC = () => {
  const isEnabled = useDeveloperInspectorStore((s) => s.isEnabled);
  const isLiveSelecting = useDeveloperInspectorStore((s) => s.isLiveSelecting);
  const isFrozen = useDeveloperInspectorStore((s) => s.isFrozen);
  const selectedElement = useDeveloperInspectorStore((s) => s.selectedElement);
  const selectedFiberInfo = useDeveloperInspectorStore((s) => s.selectedFiberInfo);
  const activeTab = useDeveloperInspectorStore((s) => s.activeTab);
  const searchQuery = useDeveloperInspectorStore((s) => s.searchQuery);
  const gridOverlay = useDeveloperInspectorStore((s) => s.gridOverlay);
  const showBoxModel = useDeveloperInspectorStore((s) => s.showBoxModel);
  const showParentOutline = useDeveloperInspectorStore((s) => s.showParentOutline);
  const showChildrenOutline = useDeveloperInspectorStore((s) => s.showChildrenOutline);

  const setIsEnabled = useDeveloperInspectorStore((s) => s.setIsEnabled);
  const setIsLiveSelecting = useDeveloperInspectorStore((s) => s.setIsLiveSelecting);
  const setIsFrozen = useDeveloperInspectorStore((s) => s.setIsFrozen);
  const setSelectedElement = useDeveloperInspectorStore((s) => s.setSelectedElement);
  const setActiveTab = useDeveloperInspectorStore((s) => s.setActiveTab);
  const setSearchQuery = useDeveloperInspectorStore((s) => s.setSearchQuery);
  const setGridOverlay = useDeveloperInspectorStore((s) => s.setGridOverlay);
  const setShowBoxModel = useDeveloperInspectorStore((s) => s.setShowBoxModel);
  const setShowParentOutline = useDeveloperInspectorStore((s) => s.setShowParentOutline);
  const setShowChildrenOutline = useDeveloperInspectorStore((s) => s.setShowChildrenOutline);
  const resetInspector = useDeveloperInspectorStore((s) => s.resetInspector);

  const history = useNavigationStore((s) => s.history);
  const currentRoute = history.length > 0 ? `${history[history.length - 1].app}/${history[history.length - 1].tab || ''}` : 'hub';

  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const computedStyles = useMemo(() => {
    if (!selectedElement) return null;
    const style = window.getComputedStyle(selectedElement);
    return {
      display: style.display,
      position: style.position,
      width: style.width,
      height: style.height,
      zIndex: style.zIndex,
      opacity: style.opacity,
      color: style.color,
      backgroundColor: style.backgroundColor,
      borderRadius: style.borderRadius,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      backdropFilter: style.backdropFilter || (style as any).webkitBackdropFilter || 'none',
      pointerEvents: style.pointerEvents,
      transform: style.transform,
      overflow: style.overflow,
    };
  }, [selectedElement]);

  const handleCopy = (data: any, label: string) => {
    try {
      const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      navigator.clipboard.writeText(text);
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleExportDiagnostics = () => {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      currentRoute,
      selectedElement: selectedElement
        ? {
            tagName: selectedElement.tagName.toLowerCase(),
            id: selectedElement.id,
            className: selectedElement.className,
            rect: selectedElement.getBoundingClientRect(),
          }
        : null,
      fiberInfo: selectedFiberInfo,
      computedStyles,
      userAgent: navigator.userAgent,
    };
    const blob = new Blob([JSON.stringify(diagnostics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `livex-inspector-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const traverse = (direction: 'parent' | 'child' | 'prev' | 'next') => {
    if (!selectedElement) return;
    let next: HTMLElement | null = null;
    if (direction === 'parent') next = getParentElement(selectedElement);
    if (direction === 'child') next = getFirstChildElement(selectedElement);
    if (direction === 'prev') next = getPreviousSiblingElement(selectedElement);
    if (direction === 'next') next = getNextSiblingElement(selectedElement);

    if (next) {
      setSelectedElement(next, getFiberInfoFromDOMNode(next));
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        backgroundColor: 'var(--c-surface-base, #111318)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid var(--c-border, rgba(255, 255, 255, 0.12))',
        color: '#ffffff',
        fontFamily: 'var(--font-body, Inter, sans-serif)',
      }}
    >
      {/* 1. Header & Master Switch */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#3b82f6' }}>
            Developer Inspector
          </h2>
          <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', margin: '4px 0 0 0' }}>
            Real-time Native Android Layout & React Component Inspector
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Toggle checked={isEnabled} onChange={setIsEnabled} label="Enable Inspector" />
        </div>
      </div>

      {isEnabled && (
        <>
          {/* 2. Control Toolbar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              padding: '12px',
              borderRadius: '12px',
            }}
          >
            <button
              onClick={() => setIsLiveSelecting(!isLiveSelecting)}
              style={{
                backgroundColor: isLiveSelecting ? '#ec4899' : 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {isLiveSelecting ? '⏸ Stop Selection' : '🔍 Start Live Selection'}
            </button>

            <button
              onClick={() => setIsFrozen(!isFrozen)}
              style={{
                backgroundColor: isFrozen ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {isFrozen ? '❄️ Unfreeze UI' : '🧊 Freeze UI'}
            </button>

            <button
              onClick={handleExportDiagnostics}
              style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              📥 Export Diagnostics
            </button>

            <button
              onClick={resetInspector}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reset Selection
            </button>
          </div>

          {/* 3. Traversal Toolbar */}
          {selectedElement && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              <span style={{ fontWeight: 700 }}>Traverse:</span>
              <button
                onClick={() => traverse('parent')}
                style={btnStyle}
                disabled={!selectedElement.parentElement}
              >
                ⬆️ Parent
              </button>
              <button
                onClick={() => traverse('child')}
                style={btnStyle}
                disabled={selectedElement.children.length === 0}
              >
                ⬇️ Child
              </button>
              <button
                onClick={() => traverse('prev')}
                style={btnStyle}
                disabled={!selectedElement.previousElementSibling}
              >
                ⬅️ Prev Sibling
              </button>
              <button
                onClick={() => traverse('next')}
                style={btnStyle}
                disabled={!selectedElement.nextElementSibling}
              >
                ➡️ Next Sibling
              </button>
            </div>
          )}

          {/* 4. Tab Navigation */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '8px',
            }}
          >
            {(
              [
                ['info', 'Component Info'],
                ['props', 'Props & State'],
                ['styles', 'Computed Styles'],
                ['animation', 'Animation'],
                ['render', 'Render & Perf'],
                ['tree', 'Component Tree'],
                ['measure', 'Grid & Tools'],
                ['export', 'Copy & Export'],
              ] as [InspectorTab, string][]
            ).map(([tabKey, label]) => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: activeTab === tabKey ? 700 : 500,
                  backgroundColor: activeTab === tabKey ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 5. Tab Content Views */}
          <div style={{ minHeight: '220px' }}>
            {activeTab === 'info' && (
              <InfoTab selectedElement={selectedElement} fiberInfo={selectedFiberInfo} currentRoute={currentRoute} />
            )}
            {activeTab === 'props' && <PropsTab fiberInfo={selectedFiberInfo} />}
            {activeTab === 'styles' && <StylesTab styles={computedStyles} />}
            {activeTab === 'animation' && <AnimationTab selectedElement={selectedElement} />}
            {activeTab === 'render' && <RenderTab fiberInfo={selectedFiberInfo} />}
            {activeTab === 'tree' && (
              <TreeTab
                selectedElement={selectedElement}
                onSelect={(el) => setSelectedElement(el, getFiberInfoFromDOMNode(el))}
              />
            )}
            {activeTab === 'measure' && (
              <MeasureTab
                gridOverlay={gridOverlay}
                setGridOverlay={setGridOverlay}
                showBoxModel={showBoxModel}
                setShowBoxModel={setShowBoxModel}
                showParentOutline={showParentOutline}
                setShowParentOutline={setShowParentOutline}
                showChildrenOutline={showChildrenOutline}
                setShowChildrenOutline={setShowChildrenOutline}
              />
            )}
            {activeTab === 'export' && (
              <ExportTab
                selectedElement={selectedElement}
                fiberInfo={selectedFiberInfo}
                computedStyles={computedStyles}
                copySuccess={copySuccess}
                handleCopy={handleCopy}
                handleExportDiagnostics={handleExportDiagnostics}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: '#ffffff',
  border: 'none',
  padding: '4px 10px',
  borderRadius: '6px',
  fontSize: '11px',
  cursor: 'pointer',
};

// ── Tab Views ──────────────────────────────────────────────────────────────────

const InfoTab: React.FC<{ selectedElement: HTMLElement | null; fiberInfo: any; currentRoute: string }> = ({
  selectedElement,
  fiberInfo,
  currentRoute,
}) => {
  if (!selectedElement) {
    return (
      <div style={{ padding: '20px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
        No component selected. Long press any element on screen or use Live Selector.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
      <Row label="React Display Name" value={fiberInfo?.displayName || 'Unknown Component'} highlight />
      <Row label="HTML Tag" value={`<${selectedElement.tagName.toLowerCase()}>`} />
      <Row label="Element ID" value={selectedElement.id || '(none)'} />
      <Row label="CSS Classes" value={selectedElement.className || '(none)'} />
      <Row label="Current Navigation Route" value={currentRoute} />
      {fiberInfo?.sourceFile && (
        <Row
          label="Source Location"
          value={`${fiberInfo.sourceFile}:${fiberInfo.lineNumber || 1}`}
          highlight
        />
      )}
      <Row label="Render Depth" value={`${fiberInfo?.renderDepth || 1}`} />
      <Row label="Children Count" value={`${selectedElement.children.length}`} />
    </div>
  );
};

const PropsTab: React.FC<{ fiberInfo: any }> = ({ fiberInfo }) => {
  if (!fiberInfo) {
    return (
      <div style={{ padding: '20px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
        No component props found.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <h4 style={{ fontSize: '12px', color: '#10b981', margin: '0 0 6px 0' }}>Props</h4>
        <pre style={codeBlockStyle}>{JSON.stringify(fiberInfo.props, null, 2)}</pre>
      </div>
      <div>
        <h4 style={{ fontSize: '12px', color: '#3b82f6', margin: '0 0 6px 0' }}>State</h4>
        <pre style={codeBlockStyle}>{JSON.stringify(fiberInfo.state, null, 2)}</pre>
      </div>
    </div>
  );
};

const StylesTab: React.FC<{ styles: any }> = ({ styles }) => {
  if (!styles) {
    return (
      <div style={{ padding: '20px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
        No computed styles available.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
      {Object.entries(styles).map(([key, val]) => (
        <div key={key} style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '6px 10px', borderRadius: '6px' }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px' }}>{key}</div>
          <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#ffffff', wordBreak: 'break-all' }}>
            {String(val)}
          </div>
        </div>
      ))}
    </div>
  );
};

const AnimationTab: React.FC<{ selectedElement: HTMLElement | null }> = ({ selectedElement }) => {
  if (!selectedElement) return null;
  const style = window.getComputedStyle(selectedElement);
  const transform = style.transform || 'none';
  const transition = style.transition || 'none';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
      <Row label="Transform" value={transform} highlight />
      <Row label="Transition Spec" value={transition} />
      <Row label="Will-Change" value={style.willChange || 'auto'} />
      <Row label="Opacity" value={style.opacity} />
    </div>
  );
};

const RenderTab: React.FC<{ fiberInfo: any }> = ({ fiberInfo }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
    <Row label="Memoized Status" value={fiberInfo?.memoized ? '✓ React.memo / PureComponent' : 'Standard Component'} />
    <Row label="Render Depth" value={`${fiberInfo?.renderDepth || 1}`} />
    <Row label="Children Count" value={`${fiberInfo?.childrenCount || 0}`} />
    <Row label="Sibling Count" value={`${fiberInfo?.siblingCount || 0}`} />
  </div>
);

const TreeTab: React.FC<{ selectedElement: HTMLElement | null; onSelect: (el: HTMLElement) => void }> = ({
  selectedElement,
  onSelect,
}) => {
  const treeNodes = useMemo(() => {
    const nodes: { element: HTMLElement; depth: number; label: string }[] = [];
    const root = document.querySelector('#root') || document.body;

    const traverseDOM = (el: Element, depth = 0) => {
      if (depth > 6 || nodes.length > 50) return;
      if (el instanceof HTMLElement && !el.closest('[data-inspector-overlay="true"]')) {
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const cls = el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : '';
        nodes.push({ element: el, depth, label: `${tag}${id}${cls}` });

        for (let i = 0; i < el.children.length; i++) {
          traverseDOM(el.children[i], depth + 1);
        }
      }
    };

    traverseDOM(root);
    return nodes;
  }, []);

  return (
    <div style={{ maxHeight: '250px', overflowY: 'auto', fontSize: '12px', fontFamily: 'monospace' }}>
      {treeNodes.map((node, idx) => (
        <div
          key={idx}
          onClick={() => onSelect(node.element)}
          style={{
            paddingLeft: `${node.depth * 14 + 8}px`,
            paddingTop: '4px',
            paddingBottom: '4px',
            cursor: 'pointer',
            backgroundColor: selectedElement === node.element ? '#3b82f6' : 'transparent',
            color: selectedElement === node.element ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
            borderRadius: '4px',
          }}
        >
          {node.label}
        </div>
      ))}
    </div>
  );
};

const MeasureTab: React.FC<{
  gridOverlay: GridOverlayMode;
  setGridOverlay: (g: GridOverlayMode) => void;
  showBoxModel: boolean;
  setShowBoxModel: (b: boolean) => void;
  showParentOutline: boolean;
  setShowParentOutline: (b: boolean) => void;
  showChildrenOutline: boolean;
  setShowChildrenOutline: (b: boolean) => void;
}> = ({
  gridOverlay,
  setGridOverlay,
  showBoxModel,
  setShowBoxModel,
  showParentOutline,
  setShowParentOutline,
  showChildrenOutline,
  setShowChildrenOutline,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {(['none', '4dp', '8dp', 'safeArea', 'touchTargets'] as GridOverlayMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => setGridOverlay(mode)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '12px',
            fontWeight: gridOverlay === mode ? 700 : 500,
            backgroundColor: gridOverlay === mode ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            cursor: 'pointer',
          }}
        >
          Grid: {mode}
        </button>
      ))}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Toggle checked={showBoxModel} onChange={setShowBoxModel} label="Show Box Model (Margin/Padding/Content)" />
      <Toggle checked={showParentOutline} onChange={setShowParentOutline} label="Show Parent Outline" />
      <Toggle checked={showChildrenOutline} onChange={setShowChildrenOutline} label="Show Children Outlines" />
    </div>
  </div>
);

const ExportTab: React.FC<{
  selectedElement: HTMLElement | null;
  fiberInfo: any;
  computedStyles: any;
  copySuccess: string | null;
  handleCopy: (data: any, label: string) => void;
  handleExportDiagnostics: () => void;
}> = ({ selectedElement, fiberInfo, computedStyles, copySuccess, handleCopy, handleExportDiagnostics }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {copySuccess && (
      <div style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '8px', borderRadius: '6px', fontSize: '12px', textAlign: 'center' }}>
        ✓ Copied {copySuccess} to clipboard!
      </div>
    )}
    <button onClick={() => handleCopy(fiberInfo?.props, 'Props')} style={actionBtnStyle}>
      📋 Copy React Props
    </button>
    <button onClick={() => handleCopy(computedStyles, 'Styles')} style={actionBtnStyle}>
      📋 Copy Computed Styles
    </button>
    <button onClick={() => handleCopy(fiberInfo, 'Component Info')} style={actionBtnStyle}>
      📋 Copy Component Info
    </button>
    <button onClick={handleExportDiagnostics} style={{ ...actionBtnStyle, backgroundColor: '#10b981' }}>
      📥 Download Complete Diagnostics Package (JSON)
    </button>
  </div>
);

const actionBtnStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: '#ffffff',
  border: 'none',
  padding: '10px 16px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'left',
};

const codeBlockStyle: React.CSSProperties = {
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  padding: '10px',
  borderRadius: '6px',
  fontSize: '11px',
  fontFamily: 'monospace',
  color: 'rgba(255, 255, 255, 0.9)',
  maxHeight: '140px',
  overflowY: 'auto',
  margin: 0,
};

const Row: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
    <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>{label}</span>
    <span style={{ fontWeight: highlight ? 700 : 500, color: highlight ? '#3b82f6' : '#ffffff', fontSize: '12px', fontFamily: 'monospace' }}>
      {value}
    </span>
  </div>
);
