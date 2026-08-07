import React, { useState, useMemo, useCallback } from 'react';
import { generateCrashReport, CrashReport, StackFrame } from '@workspace/studio-core';
import CopyButton from '../../features/devtools/components/CopyButton';

export interface RootAppCrashReportUIProps {
  error: Error | null;
  errorInfo?: React.ErrorInfo | null;
  moduleName?: string;
  onRetry?: () => void;
  onReturnToHub?: () => void;
  rawSymbolicatedReport?: string;
  rawErrorLog?: string;
}

export function RootAppCrashReportUI({
  error,
  errorInfo,
  moduleName = 'RootApp',
  onRetry,
  onReturnToHub,
  rawSymbolicatedReport,
  rawErrorLog,
}: RootAppCrashReportUIProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Expand/collapse states for detail sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    evidence: true,
    causes: true,
    timeline: true,
    componentStack: true,
    stackTrace: true,
    diagnostics: false,
    environment: false,
    rawReport: false,
  });

  // Toggle helper
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Stack categories toggles
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Application: true,
    React: false,
    Motion: false,
    Vendor: false,
    Browser: false,
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Single-pass memoized report parser
  const crashReport: CrashReport = useMemo(() => {
    const message = error?.message || 'Uncaught RootApp Exception';
    const stack = error?.stack || errorInfo?.componentStack || '';
    
    let activeSubApp = 'unknown';
    let appMode = 'unknown';
    let currentUpdaterState = 'unknown';

    if (typeof window !== 'undefined') {
      activeSubApp = (window as any).__lastActiveSubApp || moduleName;
      appMode = (window as any).__lastAppMode || 'android';
      currentUpdaterState = (window as any).__lastCheckpointStage || 'production';
    }

    return generateCrashReport(message, stack, {
      module: moduleName,
      source: `RootAppBoundary:${moduleName}`,
      componentStack: errorInfo?.componentStack || undefined,
      symbolicatedStack: rawSymbolicatedReport || rawErrorLog || undefined,
      activeSubApp,
      appMode,
      currentUpdaterState,
    });
  }, [error, errorInfo, moduleName, rawSymbolicatedReport, rawErrorLog]);

  // Filtering helper
  const query = searchQuery.toLowerCase().trim();
  const matchesSearch = useCallback(
    (text: string) => {
      if (!query) return true;
      return text.toLowerCase().includes(query);
    },
    [query]
  );

  // Filtered timeline
  const filteredTimeline = useMemo(() => {
    return crashReport.timeline.filter((e) => matchesSearch(e.event) || matchesSearch(e.timestamp));
  }, [crashReport.timeline, matchesSearch]);

  // Filtered stack frames grouped by category
  const groupedFrames = useMemo(() => {
    const groups: Record<string, StackFrame[]> = {
      Application: [],
      React: [],
      Motion: [],
      Vendor: [],
      Browser: [],
    };
    crashReport.stackTrace.categorizedFrames.forEach((frame) => {
      if (matchesSearch(frame.line)) {
        groups[frame.category].push(frame);
      }
    });
    return groups;
  }, [crashReport.stackTrace.categorizedFrames, matchesSearch]);

  // Filtered diagnostic variables
  const filteredDiagnostics = useMemo(() => {
    return crashReport.diagnostics.filter(
      (d) => matchesSearch(d.variable) || matchesSearch(d.value) || matchesSearch(d.description)
    );
  }, [crashReport.diagnostics, matchesSearch]);

  // Copy helpers
  const handleCopySection = (sectionText: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(sectionText);
    }
  };

  const entireReportText = useMemo(() => {
    return `[CRASH REPORT]
Summary:
- Module: ${crashReport.summary.module}
- Exception: ${crashReport.summary.exception}
- Message: ${crashReport.summary.message}
- Impact: ${crashReport.summary.impact}

Evidence:
- Facts: ${crashReport.evidence.facts.join(', ')}
- Unknown: ${crashReport.evidence.unknown.join(', ')}
- Unable to determine: ${crashReport.evidence.unableToDetermine.join(', ')}

Potential Causes:
${crashReport.potentialCauses.map((pc) => `- ${pc.title}: ${pc.evidence} (Status: ${pc.status})`).join('\n')}

Environment:
- Studio Version: ${crashReport.environment.studioVersion}
- VersionCode: ${crashReport.environment.versionCode}
- Platform: ${crashReport.environment.platform}
- Commit: ${crashReport.environment.commit}
- Memory: ${crashReport.environment.memoryUsage || 'N/A'}`;
  }, [crashReport]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: '#0a0a0c',
        color: '#e2e8f0',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
        overflowY: 'auto',
        padding: '24px 20px',
      }}
    >
      {/* ── 1. HEADER & RECOVERY BAR ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          background: '#111115',
          border: '1px solid #ef4444',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#ef4444',
                boxShadow: '0 0 16px #ef4444',
              }}
            />
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: '#f87171' }}>
              RootApp Exception Analyzer
            </h2>
          </div>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              background: 'rgba(239, 68, 68, 0.18)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#f87171',
              fontSize: 12,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            CRITICAL FAULT
          </span>
        </div>

        {/* User Recovery Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => onRetry?.()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
            }}
          >
            Restart RootApp
          </button>
          <button
            onClick={() => onReturnToHub?.()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: '#1e1e24',
              color: '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Return to Studio Hub
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: '#1e1e24',
              color: '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Restart Studio
          </button>
        </div>

        {/* Global Action Toolbar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <CopyButton
            getTextToCopy={() => entireReportText}
            label="Copy Entire Report"
            copiedLabel="Copied Entire Report!"
            size="sm"
          />
          <CopyButton
            getTextToCopy={() => crashReport.stackTrace.rawStack}
            label="Copy Stack Trace"
            copiedLabel="Copied Stack!"
            size="sm"
          />
          <CopyButton
            getTextToCopy={() => JSON.stringify(crashReport.diagnostics, null, 2)}
            label="Copy Diagnostics"
            copiedLabel="Copied Diagnostics!"
            size="sm"
          />
          <CopyButton
            getTextToCopy={() => crashReport.rawReport}
            label="Copy Raw Report"
            copiedLabel="Copied Raw Report!"
            size="sm"
          />
        </div>
      </div>

      {/* ── 2. INSTANT SEARCH FILTER ── */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="🔍 Filter report sections, stack traces, component names, variables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 10,
            background: '#121216',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#f8fafc',
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ── 3. CRASH SUMMARY CARD ── */}
      {matchesSearch('summary status module exception message occurrences state') && (
        <div className="crash-card" style={cardStyle}>
          <div style={cardHeaderContainerStyle}>
            <div style={cardHeaderLeftStyle} onClick={() => toggleSection('summary')}>
              <span style={{ fontSize: 13 }}>{expandedSections.summary ? '▼' : '▶'}</span>
              <h3 style={cardHeaderTitleStyle}>Crash Summary</h3>
            </div>
            <CopyButton
              getTextToCopy={() => JSON.stringify(crashReport.summary, null, 2)}
              label="Copy"
              copiedLabel="Copied!"
              size="sm"
            />
          </div>
          {expandedSections.summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 12 }}>
              <div>
                <span style={labelStyle}>Status</span>
                <span style={criticalBadgeStyle}>{crashReport.summary.status}</span>
              </div>
              <div>
                <span style={labelStyle}>Source Module</span>
                <div style={valueStyle}>{crashReport.summary.module}</div>
              </div>
              <div>
                <span style={labelStyle}>Exception Class</span>
                <div style={valueStyle}><code style={codeBlockInlineStyle}>{crashReport.summary.exception}</code></div>
              </div>
              <div>
                <span style={labelStyle}>Occurrences</span>
                <div style={valueStyle}>{crashReport.summary.occurrences} captured</div>
              </div>
              <div>
                <span style={labelStyle}>Severity</span>
                <span style={criticalBadgeStyle}>{crashReport.summary.severity}</span>
              </div>
              <div>
                <span style={labelStyle}>Impact</span>
                <div style={{ ...valueStyle, color: '#f87171' }}>{crashReport.summary.impact}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={labelStyle}>Exception Message</span>
                <div style={{ ...valueStyle, fontFamily: 'monospace', fontSize: 13, color: '#f1f5f9', background: '#0a0a0c', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                  {crashReport.summary.message}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 4. EVIDENCE & UNKNOWNS CARD ── */}
      {matchesSearch('evidence facts unknown determine verified') && (
        <div className="crash-card" style={cardStyle}>
          <div style={cardHeaderContainerStyle}>
            <div style={cardHeaderLeftStyle} onClick={() => toggleSection('evidence')}>
              <span style={{ fontSize: 13 }}>{expandedSections.evidence ? '▼' : '▶'}</span>
              <h3 style={cardHeaderTitleStyle}>Evidence & Diagnostics Credibility</h3>
            </div>
            <CopyButton
              getTextToCopy={() => JSON.stringify(crashReport.evidence, null, 2)}
              label="Copy"
              copiedLabel="Copied!"
              size="sm"
            />
          </div>
          {expandedSections.evidence && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginTop: 16 }}>
              {/* Verified Facts */}
              <div style={evidenceBoxStyle}>
                <h4 style={evidenceTitleStyle}>Verified Facts & Evidence</h4>
                {crashReport.evidence.facts.map((fact, idx) => (
                  <div key={idx} style={evidenceItemStyle}>
                    <span style={{ color: '#4ade80', marginRight: 8 }}>✔</span>
                    <span>{fact}</span>
                  </div>
                ))}
              </div>

              {/* Unknowns */}
              <div style={evidenceBoxStyle}>
                <h4 style={evidenceTitleStyle}>Unknown Information</h4>
                {crashReport.evidence.unknown.map((item, idx) => (
                  <div key={idx} style={evidenceItemStyle}>
                    <span style={{ color: '#fbbf24', marginRight: 8 }}>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Unable to Determine */}
              <div style={evidenceBoxStyle}>
                <h4 style={evidenceTitleStyle}>Unable to Determine</h4>
                {crashReport.evidence.unableToDetermine.map((item, idx) => (
                  <div key={idx} style={evidenceItemStyle}>
                    <span style={{ color: '#94a3b8', marginRight: 8 }}>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 5. POTENTIAL CAUSES CARD ── */}
      {matchesSearch('potential causes status confirmed possible unknown evidence') && (
        <div className="crash-card" style={cardStyle}>
          <div style={cardHeaderContainerStyle}>
            <div style={cardHeaderLeftStyle} onClick={() => toggleSection('causes')}>
              <span style={{ fontSize: 13 }}>{expandedSections.causes ? '▼' : '▶'}</span>
              <h3 style={cardHeaderTitleStyle}>Potential Causes</h3>
            </div>
            <CopyButton
              getTextToCopy={() => JSON.stringify(crashReport.potentialCauses, null, 2)}
              label="Copy"
              copiedLabel="Copied!"
              size="sm"
            />
          </div>
          {expandedSections.causes && (
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                    <th style={{ padding: '8px 12px' }}>Possible Cause</th>
                    <th style={{ padding: '8px 12px' }}>Evidence</th>
                    <th style={{ padding: '8px 12px' }}>Confidence Source</th>
                    <th style={{ padding: '8px 12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {crashReport.potentialCauses.map((cause, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: '#f1f5f9' }}>{cause.title}</td>
                      <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>{cause.evidence}</td>
                      <td style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 12 }}>{cause.confidenceSource}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            background:
                              cause.status === 'Confirmed'
                                ? 'rgba(74, 222, 128, 0.15)'
                                : cause.status === 'Possible'
                                ? 'rgba(56, 189, 248, 0.15)'
                                : 'rgba(148, 163, 184, 0.15)',
                            color:
                              cause.status === 'Confirmed'
                                ? '#4ade80'
                                : cause.status === 'Possible'
                                ? '#38bdf8'
                                : '#94a3b8',
                          }}
                        >
                          {cause.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 6. TIMELINE CARD ── */}
      {matchesSearch('timeline event chronologically sequence steps') && (
        <div className="crash-card" style={cardStyle}>
          <div style={cardHeaderContainerStyle}>
            <div style={cardHeaderLeftStyle} onClick={() => toggleSection('timeline')}>
              <span style={{ fontSize: 13 }}>{expandedSections.timeline ? '▼' : '▶'}</span>
              <h3 style={cardHeaderTitleStyle}>Chronological Timeline</h3>
            </div>
            <CopyButton
              getTextToCopy={() => JSON.stringify(crashReport.timeline, null, 2)}
              label="Copy"
              copiedLabel="Copied!"
              size="sm"
            />
          </div>
          {expandedSections.timeline && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 12 }}>
              {filteredTimeline.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 16, position: 'relative', paddingBottom: idx === filteredTimeline.length - 1 ? 0 : 20 }}>
                  {idx !== filteredTimeline.length - 1 && (
                    <div style={{ position: 'absolute', left: 5, top: 12, bottom: -12, width: 2, background: 'rgba(255,255,255,0.1)' }} />
                  )}
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background:
                        item.type === 'error'
                          ? '#ef4444'
                          : item.type === 'warning'
                          ? '#fbbf24'
                          : item.type === 'success'
                          ? '#4ade80'
                          : '#38bdf8',
                      marginTop: 4,
                      zIndex: 2,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{item.timestamp}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0', marginTop: 2 }}>{item.event}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 7. REACT COMPONENT STACK HIERARCHY TREE ── */}
      {matchesSearch('react component stack hierarchy tree') && (
        <div className="crash-card" style={cardStyle}>
          <div style={cardHeaderContainerStyle}>
            <div style={cardHeaderLeftStyle} onClick={() => toggleSection('componentStack')}>
              <span style={{ fontSize: 13 }}>{expandedSections.componentStack ? '▼' : '▶'}</span>
              <h3 style={cardHeaderTitleStyle}>React Component Stack (Hierarchy Tree)</h3>
            </div>
            <CopyButton
              getTextToCopy={() => crashReport.componentStack.rawComponentStack}
              label="Copy"
              copiedLabel="Copied!"
              size="sm"
            />
          </div>
          {expandedSections.componentStack && (
            <div
              style={{
                background: '#0a0a0c',
                padding: 14,
                borderRadius: 8,
                fontFamily: 'JetBrains Mono, Menlo, monospace',
                fontSize: 12,
                maxHeight: 240,
                overflowY: 'auto',
                border: '1px solid rgba(255,255,255,0.06)',
                marginTop: 12,
              }}
            >
              {crashReport.componentStack.tree.map((node, idx) => (
                <div key={idx} style={{ paddingLeft: node.depth * 16, paddingTop: 4, paddingBottom: 4, color: idx === 0 ? '#f87171' : '#cbd5e1' }}>
                  <span style={{ color: '#64748b' }}>└─ </span>
                  <span style={{ fontWeight: 600 }}>{node.name}</span>
                  {node.file && <span style={{ color: '#64748b', marginLeft: 8 }}>({node.file})</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 8. JAVASCRIPT STACK TRACE CARD ── */}
      {matchesSearch('javascript stack trace categorized frames vendor react motion application browser') && (
        <div className="crash-card" style={cardStyle}>
          <div style={cardHeaderContainerStyle}>
            <div style={cardHeaderLeftStyle} onClick={() => toggleSection('stackTrace')}>
              <span style={{ fontSize: 13 }}>{expandedSections.stackTrace ? '▼' : '▶'}</span>
              <h3 style={cardHeaderTitleStyle}>JavaScript Stack Trace</h3>
            </div>
            <CopyButton
              getTextToCopy={() => crashReport.stackTrace.rawStack}
              label="Copy"
              copiedLabel="Copied!"
              size="sm"
            />
          </div>
          {expandedSections.stackTrace && (
            <div style={{ marginTop: 12 }}>
              {/* Stack Category Accordions */}
              {Object.entries(groupedFrames).map(([category, frames]) => {
                if (frames.length === 0) return null;
                const isExpanded = expandedCategories[category];
                return (
                  <div key={category} style={{ marginBottom: 8, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden' }}>
                    <div
                      onClick={() => toggleCategory(category)}
                      style={{
                        background: '#111114',
                        padding: '8px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11 }}>{isExpanded ? '▼' : '▶'}</span>
                        <span style={{ fontWeight: 700, fontSize: 12, color: category === 'Application' ? '#38bdf8' : '#94a3b8' }}>
                          {category} Stack Frame ({frames.length})
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{category === 'Application' ? 'Project Files' : 'Framework / Vendor'}</span>
                    </div>

                    {isExpanded && (
                      <div
                        style={{
                          background: '#08080a',
                          padding: 12,
                          fontFamily: 'JetBrains Mono, Menlo, monospace',
                          fontSize: 11,
                          overflowY: 'auto',
                          maxHeight: 200,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {frames.map((frame, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '4px 0',
                              color: frame.isProjectFile ? '#38bdf8' : '#64748b',
                              fontWeight: frame.isProjectFile ? 600 : 400,
                            }}
                          >
                            {frame.line}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 9. DIAGNOSTICS & ENVIRONMENT CARD ── */}
      {matchesSearch('environment diagnostics metrics version commit theme platform device') && (
        <div className="crash-card" style={cardStyle}>
          <div style={cardHeaderContainerStyle}>
            <div style={cardHeaderLeftStyle} onClick={() => toggleSection('diagnostics')}>
              <span style={{ fontSize: 13 }}>{expandedSections.diagnostics ? '▼' : '▶'}</span>
              <h3 style={cardHeaderTitleStyle}>Diagnostics & Environment</h3>
            </div>
            <CopyButton
              getTextToCopy={() => JSON.stringify(crashReport.environment, null, 2)}
              label="Copy"
              copiedLabel="Copied!"
              size="sm"
            />
          </div>
          {expandedSections.diagnostics && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 14 }}>
              <div>
                <span style={labelStyle}>Studio Version</span>
                <div style={valueStyle}>{crashReport.environment.studioVersion}</div>
              </div>
              <div>
                <span style={labelStyle}>Version Code</span>
                <div style={valueStyle}>{crashReport.environment.versionCode}</div>
              </div>
              <div>
                <span style={labelStyle}>Commit Hash</span>
                <div style={valueStyle}>{crashReport.environment.commit}</div>
              </div>
              <div>
                <span style={labelStyle}>Platform</span>
                <div style={valueStyle}>{crashReport.environment.platform}</div>
              </div>
              <div>
                <span style={labelStyle}>Device</span>
                <div style={valueStyle}>{crashReport.environment.device}</div>
              </div>
              <div>
                <span style={labelStyle}>Android API</span>
                <div style={valueStyle}>{crashReport.environment.androidVersion}</div>
              </div>
              <div>
                <span style={labelStyle}>Runtime Engine</span>
                <div style={valueStyle}>{crashReport.environment.runtimeEngine}</div>
              </div>
              <div>
                <span style={labelStyle}>Build Type</span>
                <div style={valueStyle}>{crashReport.environment.buildType}</div>
              </div>

              {/* Extra diagnostics variables */}
              <div style={{ gridColumn: 'span 2', marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 13, color: '#f87171' }}>Telemetry variables</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filteredDiagnostics.map((d, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{d.variable}</span>
                      <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 10. RAW REPORT CARD (COLLAPSIBLE) ── */}
      <div className="crash-card" style={cardStyle}>
        <div style={cardHeaderContainerStyle}>
          <div style={cardHeaderLeftStyle} onClick={() => toggleSection('rawReport')}>
            <span style={{ fontSize: 13 }}>{expandedSections.rawReport ? '▼' : '▶'}</span>
            <h3 style={cardHeaderTitleStyle}>Raw Crash Report</h3>
          </div>
          <CopyButton
            getTextToCopy={() => crashReport.rawReport}
            label="Copy"
            copiedLabel="Copied!"
            size="sm"
          />
        </div>
        {expandedSections.rawReport && (
          <div style={{ marginTop: 12 }}>
            <pre
              style={{
                background: '#050506',
                padding: 14,
                borderRadius: 8,
                fontFamily: 'JetBrains Mono, Menlo, monospace',
                fontSize: 11,
                color: '#cbd5e1',
                maxHeight: 350,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                margin: 0,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {crashReport.rawReport}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline CSS Styles
const cardStyle: React.CSSProperties = {
  background: '#121215',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 10,
  padding: 18,
  marginBottom: 16,
  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
};

const cardHeaderContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const cardHeaderLeftStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
  userSelect: 'none',
};

const cardHeaderTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 750,
  color: '#f87171',
  letterSpacing: '-0.01em',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#64748b',
  textTransform: 'uppercase',
  fontWeight: 600,
  display: 'block',
  marginBottom: 4,
};

const valueStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#f1f5f9',
};

const criticalBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '3px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 800,
  background: 'rgba(239, 68, 68, 0.15)',
  color: '#f87171',
};

const codeBlockInlineStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  color: '#38bdf8',
  background: '#1a1a22',
  padding: '2px 6px',
  borderRadius: 4,
};

const evidenceBoxStyle: React.CSSProperties = {
  background: '#161619',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 8,
  padding: 14,
};

const evidenceTitleStyle: React.CSSProperties = {
  margin: '0 0 10px 0',
  fontSize: 13,
  fontWeight: 700,
  color: '#f87171',
};

const evidenceItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  fontSize: 12,
  lineHeight: 1.5,
  color: '#cbd5e1',
  marginBottom: 6,
};

export default RootAppCrashReportUI;
