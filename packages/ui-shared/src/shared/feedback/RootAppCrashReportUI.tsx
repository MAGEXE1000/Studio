import React, { useState, useMemo, useCallback } from 'react';
import { NATIVE_VERSION, NATIVE_VERSION_CODE, APP_COMMIT_SHA, processDiagnosticReport } from '@workspace/studio-core';
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

interface ParsedDiagnosticTableItem {
  variable: string;
  value: string;
  description: string;
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
  const [isRawExpanded, setIsRawExpanded] = useState(false);

  // Single-pass memoized diagnostic parser
  const parsedData = useMemo(() => {
    const message = error?.message || 'Uncaught RootApp Exception';
    const stack = error?.stack || errorInfo?.componentStack || '';
    const compStackStr = errorInfo?.componentStack || '';

    // Process using Diagnostic Intelligence Engine
    const diagReport = processDiagnosticReport(message, stack, {
      module: moduleName,
      source: `RootAppBoundary:${moduleName}`,
      componentStack: compStackStr,
      symbolicatedStack: rawSymbolicatedReport,
    });

    const result = diagReport.result;

    // Parse Component Stack into an indented tree hierarchy
    const componentTree: Array<{ name: string; file?: string; depth: number }> = [];
    if (compStackStr) {
      const lines = compStackStr.split('\n');
      let depth = 0;
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const match = /in\s+([^\s(]+)(?:\s+\(at\s+([^)]+)\))?/.exec(trimmed);
        if (match) {
          componentTree.push({
            name: match[1],
            file: match[2],
            depth,
          });
          depth++;
        } else if (trimmed.startsWith('in ')) {
          componentTree.push({
            name: trimmed.slice(3).trim(),
            depth,
          });
          depth++;
        }
      }
    }

    if (componentTree.length === 0) {
      componentTree.push({ name: 'RootApp', depth: 0 });
      componentTree.push({ name: moduleName, depth: 1 });
    }

    // Parse Stack Trace lines & highlight project files
    const cleanedStackFrames: Array<{ line: string; isProjectFile: boolean; isFramework: boolean }> = [];
    if (stack) {
      const lines = stack.split('\n');
      for (const line of lines) {
        const isFramework =
          line.includes('node_modules') ||
          line.includes('react-dom') ||
          line.includes('scheduler') ||
          line.includes('vite/dist');
        const isProjectFile =
          (line.includes('.tsx') || line.includes('.ts')) && !isFramework;

        cleanedStackFrames.push({
          line: line.trim(),
          isProjectFile,
          isFramework,
        });
      }
    }

    // Convert raw diagnostics into structured table items
    const diagnosticsTable: ParsedDiagnosticTableItem[] = [
      { variable: 'Current Module', value: result.componentOrModule, description: 'Failing application section' },
      { variable: 'Operation', value: result.operationOrAction, description: 'Action being executed when crash occurred' },
      { variable: 'Primary Cause', value: result.primaryRootCause, description: 'Inferred root failure hypothesis' },
      { variable: 'Confidence Score', value: `${result.confidenceScore}%`, description: 'Diagnostic engine confidence metric' },
      { variable: 'Affected Files', value: result.affectedFiles.join(', ') || 'N/A', description: 'Primary source files to inspect' },
      { variable: 'Unaffected Systems', value: result.unaffectedFiles.join(', ') || 'N/A', description: 'Modules verified operational' },
    ];

    // Read stored telemetry or fallback to window state
    let activeSubApp = 'unknown';
    let appMode = 'unknown';
    let lastNavAction = 'none';

    if (typeof window !== 'undefined') {
      activeSubApp = (window as any).__lastActiveSubApp || moduleName;
      appMode = (window as any).__lastAppMode || 'android';
      try {
        const hist = localStorage.getItem('studio_navigation_history');
        if (hist) {
          const parsed = JSON.parse(hist);
          if (parsed.length > 0) lastNavAction = JSON.stringify(parsed[parsed.length - 1]);
        }
      } catch (_) {}
    }

    const fullRawReport =
      rawSymbolicatedReport ||
      rawErrorLog ||
      localStorage.getItem('studio_rootapp_last_symbolicated_report') ||
      localStorage.getItem('studio_rootapp_error_boundary_log') ||
      `${message}\n${stack}\n${compStackStr}`;

    return {
      message,
      stack,
      diagReport,
      result,
      componentTree,
      cleanedStackFrames,
      diagnosticsTable,
      activeSubApp,
      appMode,
      lastNavAction,
      fullRawReport,
      timestamp: new Date().toISOString(),
    };
  }, [error, errorInfo, moduleName, rawSymbolicatedReport, rawErrorLog]);

  // Filter content by search query
  const query = searchQuery.toLowerCase().trim();
  const matchesSearch = useCallback(
    (text: string) => {
      if (!query) return true;
      return text.toLowerCase().includes(query);
    },
    [query]
  );

  const filteredTree = useMemo(() => {
    return parsedData.componentTree.filter(
      (node) => matchesSearch(node.name) || (node.file && matchesSearch(node.file))
    );
  }, [parsedData.componentTree, matchesSearch]);

  const filteredStack = useMemo(() => {
    return parsedData.cleanedStackFrames.filter((frame) => matchesSearch(frame.line));
  }, [parsedData.cleanedStackFrames, matchesSearch]);

  const filteredDiagnostics = useMemo(() => {
    return parsedData.diagnosticsTable.filter(
      (item) => matchesSearch(item.variable) || matchesSearch(item.value) || matchesSearch(item.description)
    );
  }, [parsedData.diagnosticsTable, matchesSearch]);

  const stackToCopy = useMemo(() => {
    return parsedData.cleanedStackFrames.map((f) => f.line).join('\n');
  }, [parsedData.cleanedStackFrames]);

  const diagnosticsToCopy = useMemo(() => {
    return parsedData.diagnosticsTable
      .map((d) => `${d.variable}: ${d.value} (${d.description})`)
      .join('\n');
  }, [parsedData.diagnosticsTable]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: '#0d0d0e',
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
          background: '#161619',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#ef4444',
                boxShadow: '0 0 12px #ef4444',
              }}
            />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: '#f87171' }}>
              Application Crash Report — {parsedData.result.componentOrModule}
            </h2>
          </div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ef4444',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            STATUS: FAILED
          </span>
        </div>

        {/* Quick Recovery Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => onRetry?.()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'background 150ms ease',
            }}
          >
            Restart RootApp
          </button>
          <button
            onClick={() => onReturnToHub?.()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Return to Hub
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Reload Studio
          </button>
        </div>

        {/* Copy Buttons Toolbar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <CopyButton
            getTextToCopy={() => parsedData.diagReport.formattedSummary}
            label="Copy Entire Report"
            copiedLabel="Copied Report!"
            size="sm"
          />
          <CopyButton
            getTextToCopy={() => stackToCopy}
            label="Copy Stack Trace"
            copiedLabel="Copied Stack!"
            size="sm"
          />
          <CopyButton
            getTextToCopy={() => diagnosticsToCopy}
            label="Copy Diagnostics"
            copiedLabel="Copied Diagnostics!"
            size="sm"
          />
          <CopyButton
            getTextToCopy={() => parsedData.fullRawReport}
            label="Copy Raw Log"
            copiedLabel="Copied Raw!"
            size="sm"
          />
        </div>
      </div>

      {/* ── 2. INSTANT SEARCH FILTER ── */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="🔍 Search report, stack traces, component names, variables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 8,
            background: '#161619',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#f1f5f9',
            fontSize: 13,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ── 3. SUMMARY CARD ── */}
      {matchesSearch('summary error title timestamp version') && (
        <div className="crash-card" style={cardStyle}>
          <h3 style={cardHeaderStyle}>Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div>
              <span style={labelStyle}>Error Title</span>
              <div style={valueStyle}>{parsedData.message.substring(0, 80)}</div>
            </div>
            <div>
              <span style={labelStyle}>Timestamp</span>
              <div style={valueStyle}>{parsedData.timestamp}</div>
            </div>
            <div>
              <span style={labelStyle}>App Version</span>
              <div style={valueStyle}>{NATIVE_VERSION} ({NATIVE_VERSION_CODE})</div>
            </div>
            <div>
              <span style={labelStyle}>Commit SHA</span>
              <div style={valueStyle}>{APP_COMMIT_SHA || '64abaaa0'}</div>
            </div>
            <div>
              <span style={labelStyle}>Active Sub-App</span>
              <div style={valueStyle}>{parsedData.activeSubApp}</div>
            </div>
            <div>
              <span style={labelStyle}>Platform / Mode</span>
              <div style={valueStyle}>{parsedData.appMode}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. CRASH OVERVIEW CARD ── */}
      {matchesSearch('crash overview failure explanation') && (
        <div className="crash-card" style={cardStyle}>
          <h3 style={cardHeaderStyle}>Crash Overview</h3>
          <div style={{ background: '#0a0a0c', padding: 14, borderRadius: 8, borderLeft: '4px solid #ef4444', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: '#f1f5f9' }}>
              {parsedData.result.whyItFailed}
            </p>
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            <strong>Operation:</strong> {parsedData.result.operationOrAction}
          </div>
        </div>
      )}

      {/* ── 5. DETECTED EXCEPTION & LIKELY CAUSE ── */}
      {matchesSearch('detected exception likely cause hypotheses confidence') && (
        <div className="crash-card" style={cardStyle}>
          <h3 style={cardHeaderStyle}>Likely Root Causes & Hypotheses</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {parsedData.result.hypotheses.map((h, idx) => (
              <div key={idx} style={{ background: '#121215', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#f87171' }}>{h.title}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>Confidence: {h.confidence}%</span>
                </div>
                {h.description && <div style={{ fontSize: 12, color: '#94a3b8' }}>{h.description}</div>}
                {/* Confidence Bar */}
                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${h.confidence}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #818cf8)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. RECOMMENDED ACTIONS CARD ── */}
      {matchesSearch('recommended actions fixes') && (
        <div className="crash-card" style={cardStyle}>
          <h3 style={cardHeaderStyle}>Recommended Debug Fixes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {parsedData.result.possibleFixes.map((fix, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#cbd5e1' }}>
                <span style={{ color: '#4ade80', fontWeight: 700 }}>✓</span>
                <span>{fix}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. REACT COMPONENT STACK HIERARCHY TREE ── */}
      {matchesSearch('react component stack hierarchy tree') && (
        <div className="crash-card" style={cardStyle}>
          <h3 style={cardHeaderStyle}>React Component Stack (Hierarchy Tree)</h3>
          <div
            style={{
              background: '#0a0a0c',
              padding: 14,
              borderRadius: 8,
              fontFamily: 'JetBrains Mono, Menlo, monospace',
              fontSize: 12,
              maxHeight: 240,
              overflowY: 'auto',
            }}
          >
            {filteredTree.map((node, idx) => (
              <div key={idx} style={{ paddingLeft: node.depth * 16, paddingTop: 4, paddingBottom: 4, color: idx === 0 ? '#f87171' : '#cbd5e1' }}>
                <span style={{ color: '#64748b' }}>└─ </span>
                <span style={{ fontWeight: 600 }}>{node.name}</span>
                {node.file && <span style={{ color: '#64748b', marginLeft: 8 }}>({node.file})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 8. JAVASCRIPT STACK TRACE CARD ── */}
      {matchesSearch('javascript stack trace frames') && (
        <div className="crash-card" style={cardStyle}>
          <h3 style={cardHeaderStyle}>JavaScript Stack Trace</h3>
          <div
            style={{
              background: '#0a0a0c',
              padding: 14,
              borderRadius: 8,
              fontFamily: 'JetBrains Mono, Menlo, monospace',
              fontSize: 11,
              maxHeight: 280,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {filteredStack.map((frame, idx) => (
              <div
                key={idx}
                style={{
                  padding: '3px 0',
                  color: frame.isProjectFile ? '#38bdf8' : frame.isFramework ? '#475569' : '#94a3b8',
                  fontWeight: frame.isProjectFile ? 600 : 400,
                }}
              >
                {frame.line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 9. DIAGNOSTICS & ENVIRONMENT TABLE CARD ── */}
      {matchesSearch('diagnostics environment variables') && (
        <div className="crash-card" style={cardStyle}>
          <h3 style={cardHeaderStyle}>Diagnostics & Environment Metrics</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                  <th style={{ padding: '8px 12px' }}>Variable</th>
                  <th style={{ padding: '8px 12px' }}>Current Value</th>
                  <th style={{ padding: '8px 12px' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredDiagnostics.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#f1f5f9' }}>{item.variable}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#38bdf8' }}>{item.value}</td>
                    <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 10. RAW TECHNICAL DETAILS (COLLAPSIBLE) ── */}
      <div className="crash-card" style={cardStyle}>
        <div
          onClick={() => setIsRawExpanded(!isRawExpanded)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <h3 style={{ ...cardHeaderStyle, margin: 0 }}>
            {isRawExpanded ? '▼ Raw Technical Details' : '▶ Raw Technical Details (Expandable)'}
          </h3>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{isRawExpanded ? 'Collapse' : 'Expand Full Log'}</span>
        </div>

        {isRawExpanded && (
          <div style={{ marginTop: 14 }}>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'flex-end' }}>
              <CopyButton
                getTextToCopy={() => parsedData.fullRawReport}
                label="Copy Full Raw Log"
                copiedLabel="Copied!"
                size="sm"
              />
            </div>
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
              {parsedData.fullRawReport}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#141417',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 10,
  padding: 18,
  marginBottom: 16,
  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
};

const cardHeaderStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: 14,
  fontWeight: 700,
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

export default RootAppCrashReportUI;
