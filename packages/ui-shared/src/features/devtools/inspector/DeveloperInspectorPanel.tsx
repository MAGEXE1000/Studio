import CopyButton from '../components/CopyButton';
import { Capacitor } from '@capacitor/core';
import React, { useState, useMemo } from 'react';
import {
  useDeveloperInspectorStore,
  InspectorTab,
  GridOverlayMode,
  useNavigationStore,
  FilterCategory,
} from '@workspace/studio-core';
import { Toggle } from '../../../shared/design-system/StudioToggle';
import {
  getFiberInfoFromDOMNode,
  getParentElement,
  getFirstChildElement,
  getPreviousSiblingElement,
  getNextSiblingElement,
  getNearestInteractiveElement,
  getNearestLayoutContainer,
  getBreadcrumbsForElement,
} from './InspectorEngine';

export const DeveloperInspectorPanel: React.FC = () => {
  const isEnabled = useDeveloperInspectorStore((s) => s.isEnabled);
  const isLiveSelecting = useDeveloperInspectorStore((s) => s.isLiveSelecting);
  const isFrozen = useDeveloperInspectorStore((s) => s.isFrozen);
  const selectedElement = useDeveloperInspectorStore((s) => s.selectedElement);
  const selectedFiberInfo = useDeveloperInspectorStore((s) => s.selectedFiberInfo);
  const activeTab = useDeveloperInspectorStore((s) => s.activeTab);
  const searchQuery = useDeveloperInspectorStore((s) => s.searchQuery);
  const activeFilter = useDeveloperInspectorStore((s) => s.activeFilter);
  const gridOverlay = useDeveloperInspectorStore((s) => s.gridOverlay);
  const showBoxModel = useDeveloperInspectorStore((s) => s.showBoxModel);
  const showParentOutline = useDeveloperInspectorStore((s) => s.showParentOutline);
  const showChildrenOutline = useDeveloperInspectorStore((s) => s.showChildrenOutline);
  const breadcrumbs = useDeveloperInspectorStore((s) => s.breadcrumbs);

  const setIsEnabled = useDeveloperInspectorStore((s) => s.setIsEnabled);
  const setIsLiveSelecting = useDeveloperInspectorStore((s) => s.setIsLiveSelecting);
  const setIsFrozen = useDeveloperInspectorStore((s) => s.setIsFrozen);
  const toggleFreezeUI = useDeveloperInspectorStore((s) => s.toggleFreezeUI);
  const setSelectedElement = useDeveloperInspectorStore((s) => s.setSelectedElement);
  const setActiveTab = useDeveloperInspectorStore((s) => s.setActiveTab);
  const setSearchQuery = useDeveloperInspectorStore((s) => s.setSearchQuery);
  const setActiveFilter = useDeveloperInspectorStore((s) => s.setActiveFilter);
  const setGridOverlay = useDeveloperInspectorStore((s) => s.setGridOverlay);
  const setShowBoxModel = useDeveloperInspectorStore((s) => s.setShowBoxModel);
  const setShowParentOutline = useDeveloperInspectorStore((s) => s.setShowParentOutline);
  const setShowChildrenOutline = useDeveloperInspectorStore((s) => s.setShowChildrenOutline);
  const showRouteTracer = useDeveloperInspectorStore((s) => s.showRouteTracer);
  const setShowRouteTracer = useDeveloperInspectorStore((s) => s.setShowRouteTracer);
  const resetInspector = useDeveloperInspectorStore((s) => s.resetInspector);

  const history = useNavigationStore((s) => s.history);
  const currentRoute =
    history.length > 0
      ? `${history[history.length - 1].app}/${history[history.length - 1].tab || ''}`
      : 'hub';

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
      flexDirection: style.flexDirection,
      justifyContent: style.justifyContent,
      alignItems: style.alignItems,
      gridTemplateColumns: style.gridTemplateColumns,
      gap: style.gap,
    };
  }, [selectedElement]);

  const selectNode = (target: HTMLElement | null) => {
    if (!target) return;
    const fiberInfo = getFiberInfoFromDOMNode(target);
    const crumbs = getBreadcrumbsForElement(target);
    setSelectedElement(target, fiberInfo, crumbs);
  };

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
      studioVersion: '4.2.85',
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
      device: {
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
      currentRoute,
      navigationHistory: history,
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
    a.download = `studio_inspector_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { id: InspectorTab; label: string; icon: string }[] = [
    { id: 'info', label: 'Info', icon: 'info' },
    { id: 'props', label: 'Props/State', icon: 'data_object' },
    { id: 'styles', label: 'Styles', icon: 'palette' },
    { id: 'tree', label: 'Tree', icon: 'account_tree' },
    { id: 'measure', label: 'Measure', icon: 'straighten' },
    { id: 'export', label: 'Export', icon: 'download' },
  ];

  const filterPills: { id: FilterCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'interactive', label: 'Interactive' },
    { id: 'animated', label: 'Animated' },
    { id: 'react', label: 'React' },
    { id: 'dom', label: 'DOM' },
    { id: 'scrollable', label: 'Scrollable' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'rgba(14, 14, 18, 0.98)',
        color: '#e2e8f0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '12px',
      }}
    >
      {/* 1. Header Toolbar */}
      <div
        style={{
          padding: '8px 12px',
          background: 'var(--app-surface)',
          borderBottom: '1px solid var(--c-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Enable Inspector Toggle */}
          <Toggle value={isEnabled} onChange={setIsEnabled} size="sm" />
          <span style={{ fontWeight: 700, fontSize: '11px', color: 'var(--c-text-primary)' }}>
            Inspector
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Live Select Action Button */}
          <button
            type="button"
            onClick={() => setIsLiveSelecting(!isLiveSelecting)}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              border: isLiveSelecting ? 'none' : '1px solid var(--c-border)',
              background: isLiveSelecting
                ? 'var(--studio-accent-from, #3b82f6)'
                : 'var(--app-surface-high, var(--app-surface))',
              color: isLiveSelecting ? '#ffffff' : 'var(--c-text-primary)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              touch_app
            </span>
            {isLiveSelecting ? 'Selecting...' : 'Select'}
          </button>

          {/* Freeze UI Toggle Button */}
          <button
            type="button"
            onClick={toggleFreezeUI}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              border: isFrozen ? 'none' : '1px solid var(--c-border)',
              background: isFrozen ? '#f59e0b' : 'var(--app-surface-high, var(--app-surface))',
              color: isFrozen ? '#ffffff' : 'var(--c-text-primary)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              ac_unit
            </span>
            {isFrozen ? 'Frozen' : 'Freeze UI'}
          </button>

          <button
            type="button"
            onClick={resetInspector}
            title="Reset Inspector"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--c-text-secondary)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* 2. Traversal Toolbar */}
      {selectedElement && (
        <div
          style={{
            padding: '6px 12px',
            background: 'var(--app-surface-low, var(--app-surface))',
            borderBottom: '1px solid var(--c-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--c-text-secondary)',
              marginRight: 4,
            }}
          >
            TRAVERSE:
          </span>
          <button
            type="button"
            onClick={() => selectNode(getParentElement(selectedElement))}
            style={navBtnStyle}
          >
            Parent
          </button>
          <button
            type="button"
            onClick={() => selectNode(getFirstChildElement(selectedElement))}
            style={navBtnStyle}
          >
            Child
          </button>
          <button
            type="button"
            onClick={() => selectNode(getPreviousSiblingElement(selectedElement))}
            style={navBtnStyle}
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => selectNode(getNextSiblingElement(selectedElement))}
            style={navBtnStyle}
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => selectNode(getNearestInteractiveElement(selectedElement))}
            style={navBtnStyle}
          >
            Interactive
          </button>
          <button
            type="button"
            onClick={() => selectNode(getNearestLayoutContainer(selectedElement))}
            style={navBtnStyle}
          >
            Layout Container
          </button>
        </div>
      )}

      {/* 3. Breadcrumbs Trail */}
      {breadcrumbs.length > 0 && (
        <div
          style={{
            padding: '4px 12px',
            background: 'var(--app-surface)',
            borderBottom: '1px solid var(--c-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            fontSize: '11px',
            flexShrink: 0,
          }}
        >
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span style={{ color: 'var(--c-text-secondary)' }}>&gt;</span>}
              <span
                onClick={() => selectNode(crumb.element)}
                style={{
                  color: crumb.isReact ? '#10b981' : 'var(--c-text-secondary)',
                  fontWeight: crumb.element === selectedElement ? 800 : 500,
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  background:
                    crumb.element === selectedElement ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                }}
              >
                {crumb.isReact ? `<${crumb.name}>` : crumb.name}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* 4. Tab Selector */}
      <div
        style={{
          display: 'flex',
          background: 'var(--app-surface-low, var(--app-surface))',
          borderBottom: '1px solid var(--c-border)',
          overflowX: 'auto',
          flexShrink: 0,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              background: activeTab === t.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color:
                activeTab === t.id
                  ? 'var(--studio-accent-from, #3b82f6)'
                  : 'var(--c-text-secondary)',
              fontWeight: activeTab === t.id ? 700 : 500,
              fontSize: '11px',
              borderBottom:
                activeTab === t.id
                  ? '2px solid var(--studio-accent-from, #3b82f6)'
                  : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {t.icon}
            </span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* 5. Tab Content Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {copySuccess && (
          <div
            style={{
              padding: '6px 12px',
              background: '#10b981',
              color: '#ffffff',
              borderRadius: '6px',
              marginBottom: 12,
              fontWeight: 700,
              fontSize: '11px',
            }}
          >
            ✓ Copied {copySuccess} to clipboard!
          </div>
        )}

        {/* Tab 1: INFO */}
        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!selectedElement ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 36, marginBottom: 8 }}
                >
                  touch_app
                </span>
                <div>Tap &quot;Select&quot; or long-press any element to inspect</div>
              </div>
            ) : (
              <>
                <div style={cardStyle}>
                  <div style={cardTitleStyle}>Component Overview</div>
                  <div style={rowStyle}>
                    <span style={labelStyle}>Display Name:</span>
                    <span style={valHighlightStyle}>
                      &lt;{selectedFiberInfo?.displayName || selectedElement.tagName.toLowerCase()}
                      &gt;
                    </span>
                  </div>
                  <div style={rowStyle}>
                    <span style={labelStyle}>Tag Name:</span>
                    <span style={valStyle}>{selectedElement.tagName.toLowerCase()}</span>
                  </div>
                  {selectedFiberInfo?.ownerName && (
                    <div style={rowStyle}>
                      <span style={labelStyle}>Owner Component:</span>
                      <span style={valStyle}>&lt;{selectedFiberInfo.ownerName}&gt;</span>
                    </div>
                  )}
                  {selectedFiberInfo?.sourceFile && (
                    <div style={rowStyle}>
                      <span style={labelStyle}>Source:</span>
                      <span style={{ ...valStyle, fontFamily: 'monospace', fontSize: '10px' }}>
                        {selectedFiberInfo.sourceFile}:{selectedFiberInfo.lineNumber}
                      </span>
                    </div>
                  )}
                  <div style={rowStyle}>
                    <span style={labelStyle}>Children Count:</span>
                    <span style={valStyle}>
                      {selectedFiberInfo?.childrenCount ?? selectedElement.children.length}
                    </span>
                  </div>
                  <div style={rowStyle}>
                    <span style={labelStyle}>Render Depth:</span>
                    <span style={valStyle}>{selectedFiberInfo?.renderDepth ?? 0}</span>
                  </div>
                </div>

                <div style={cardStyle}>
                  <div style={cardTitleStyle}>DOM Details</div>
                  <div style={rowStyle}>
                    <span style={labelStyle}>ID:</span>
                    <span style={valStyle}>{selectedElement.id || '(none)'}</span>
                  </div>
                  <div style={rowStyle}>
                    <span style={labelStyle}>Classes:</span>
                    <span style={valStyle}>{selectedElement.className || '(none)'}</span>
                  </div>
                  <div style={rowStyle}>
                    <span style={labelStyle}>Bounding Rect:</span>
                    <span style={{ ...valStyle, fontFamily: 'monospace' }}>
                      {Math.round(selectedElement.getBoundingClientRect().width)} ×{' '}
                      {Math.round(selectedElement.getBoundingClientRect().height)} px
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: PROPS & STATE */}
        {activeTab === 'props' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={cardStyle}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={cardTitleStyle}>React Props</div>
                <CopyButton
                  getTextToCopy={() => JSON.stringify(selectedFiberInfo?.props || {}, null, 2)}
                  label="Copy Props"
                  size="sm"
                />
              </div>
              <pre style={codeBlockStyle}>
                {JSON.stringify(selectedFiberInfo?.props || {}, null, 2)}
              </pre>
            </div>

            <div style={cardStyle}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={cardTitleStyle}>React State</div>
                <CopyButton
                  getTextToCopy={() => JSON.stringify(selectedFiberInfo?.state || {}, null, 2)}
                  label="Copy State"
                  size="sm"
                />
              </div>
              <pre style={codeBlockStyle}>
                {JSON.stringify(selectedFiberInfo?.state || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: STYLES */}
        {activeTab === 'styles' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={cardStyle}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={cardTitleStyle}>Computed Layout & Styles</div>
                <CopyButton
                  getTextToCopy={() => JSON.stringify(computedStyles || {}, null, 2)}
                  label="Copy Styles"
                  size="sm"
                />
              </div>
              <pre style={codeBlockStyle}>{JSON.stringify(computedStyles || {}, null, 2)}</pre>
            </div>
          </div>
        )}

        {/* Tab 4: TREE */}
        {activeTab === 'tree' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text"
              placeholder="Search component tree..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {filterPills.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveFilter(p.id)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '999px',
                    border: activeFilter === p.id ? 'none' : '1px solid var(--c-border)',
                    background:
                      activeFilter === p.id
                        ? 'var(--studio-accent-from, #3b82f6)'
                        : 'var(--app-surface-high, var(--app-surface))',
                    color: activeFilter === p.id ? '#ffffff' : 'var(--c-text-secondary)',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div style={cardStyle}>
              <div style={cardTitleStyle}>Breadcrumb Hierarchy</div>
              {breadcrumbs.map((crumb, idx) => (
                <div
                  key={idx}
                  onClick={() => selectNode(crumb.element)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background:
                      crumb.element === selectedElement ? 'rgba(59,130,246,0.2)' : 'transparent',
                    color: crumb.isReact ? '#10b981' : 'var(--c-text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: crumb.element === selectedElement ? 700 : 400,
                  }}
                >
                  <span>{crumb.isReact ? `<${crumb.name}>` : crumb.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--c-text-secondary)' }}>
                    {crumb.element.tagName.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: MEASURE & OVERLAYS */}
        {activeTab === 'measure' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={cardStyle}>
              <div style={cardTitleStyle}>Overlays & Outlines</div>
              <div style={rowStyle}>
                <span style={labelStyle}>Show Box Model Shading:</span>
                <Toggle value={showBoxModel} onChange={setShowBoxModel} size="sm" />
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Show Parent Outline:</span>
                <Toggle value={showParentOutline} onChange={setShowParentOutline} size="sm" />
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Show Children Outlines:</span>
                <Toggle value={showChildrenOutline} onChange={setShowChildrenOutline} size="sm" />
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Route Tracer:</span>
                <Toggle value={showRouteTracer} onChange={setShowRouteTracer} size="sm" />
              </div>
            </div>

            <div style={cardStyle}>
              <div style={cardTitleStyle}>Grid Overlay Mode</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {(['none', '4dp', '8dp', 'safeArea', 'touchTargets'] as GridOverlayMode[]).map(
                  (mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setGridOverlay(mode)}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: gridOverlay === mode ? 'none' : '1px solid var(--c-border)',
                        background:
                          gridOverlay === mode
                            ? 'var(--studio-accent-from, #3b82f6)'
                            : 'var(--app-surface-high, var(--app-surface))',
                        color: gridOverlay === mode ? '#ffffff' : 'var(--c-text-secondary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '11px',
                      }}
                    >
                      {mode}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: EXPORT */}
        {activeTab === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={cardStyle}>
              <div style={cardTitleStyle}>Engineering Diagnostics Export</div>
              <p
                style={{
                  color: 'var(--c-text-secondary)',
                  fontSize: '11px',
                  lineHeight: 1.4,
                  margin: '0 0 12px',
                }}
              >
                Download structured JSON report including React Fiber info, computed styles, device
                dimensions, navigation history, and app versions.
              </p>
              <button
                type="button"
                onClick={handleExportDiagnostics}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#10b981',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  download
                </span>
                Download JSON Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperInspectorPanel;

const cardStyle: React.CSSProperties = {
  background: 'var(--app-surface-high, var(--app-surface))',
  border: '1px solid var(--c-border)',
  borderRadius: '12px',
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--c-text-secondary)',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 0',
  borderBottom: '1px dashed var(--c-border)',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--c-text-secondary)',
  fontSize: '11px',
};

const valStyle: React.CSSProperties = {
  color: 'var(--c-text-primary)',
  fontSize: '11px',
  fontWeight: 600,
};

const valHighlightStyle: React.CSSProperties = {
  color: '#10b981',
  fontSize: '11px',
  fontWeight: 800,
};

const navBtnStyle: React.CSSProperties = {
  padding: '3px 8px',
  borderRadius: '6px',
  border: '1px solid var(--c-border)',
  background: 'var(--app-surface-high, var(--app-surface))',
  color: 'var(--c-text-primary)',
  fontSize: '10px',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const smallBtnStyle: React.CSSProperties = {
  padding: '2px 6px',
  borderRadius: '4px',
  border: 'none',
  background: 'rgba(59, 130, 246, 0.2)',
  color: '#3b82f6',
  fontSize: '10px',
  fontWeight: 700,
  cursor: 'pointer',
};

const codeBlockStyle: React.CSSProperties = {
  background: 'var(--app-surface-bright, var(--app-surface))',
  border: '1px solid var(--c-border)',
  borderRadius: '8px',
  padding: '8px',
  color: 'var(--studio-accent-from, #38bdf8)',
  fontSize: '10px',
  fontFamily: 'monospace',
  overflowX: 'auto',
  maxHeight: '180px',
  margin: 0,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid var(--c-border)',
  background: 'var(--app-surface)',
  color: 'var(--c-text-primary)',
  fontSize: '11px',
  outline: 'none',
  boxSizing: 'border-box',
};
