import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  useIsWebDesktop,
  useT,
  authRepository,
  CollaborationService,
  registerStageIframe,
  getFirebaseConfigDetails,
  getFirestoreDiagnostics,
  APP_VERSION,
} from '@workspace/studio-core';
import { StageToolbar } from './StageToolbar';
import { StageLibraryPanel } from './StageLibraryPanel';
import { ExportPdfDialog } from './dialogs/ExportPdfDialog';
import { StageCollabDialog } from './dialogs/StageCollabDialog';
import { StageBridge } from '../services/StageBridgeService';
import { useStagexStore } from '../state/useStagexStore';
import SmartLoading from '../../../shared/loading/SmartLoading';
import { StudioHeader } from '../../../shared/layout/StudioHeader';
import { resolveAccent } from '@workspace/studio-core';

export interface StageCanvasViewProps {
  isLight: boolean;
  isAmoled: boolean;
  accentColor: string;
  stageBg: string;
  liveMode: boolean;
  setLiveMode: (val: boolean) => void;
  onNavigateView?: (view: string) => void;
}

export const StageCanvasView: React.FC<StageCanvasViewProps> = ({
  isLight,
  isAmoled,
  accentColor,
  stageBg,
  liveMode,
  setLiveMode,
  onNavigateView,
}) => {
  const isWebDesktop = useIsWebDesktop();
  const t = useT();
  const tr = t as any;
  const accent = resolveAccent(accentColor);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeLoading, setIframeLoading] = useState(true);

  // Desktop side panel & search state
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customElements, setCustomElements] = useState<any[]>([]);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    presets: true,
    custom: true,
    mics: true,
  });

  // Floating controls (Mobile)
  const [fabOpen, setFabOpen] = useState(false);
  const [isStageExpanded, setIsStageExpanded] = useState(false);

  // Export PDF Dialog state
  const [pdfSheetOpen, setPdfSheetOpen] = useState(false);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [pdfSceneInfo, setPdfSceneInfo] = useState<{
    count: number;
    currentIdx: number;
    names: string[];
  }>({
    count: 1,
    currentIdx: 0,
    names: ['Default'],
  });
  const [pdfSceneChoice, setPdfSceneChoice] = useState<'current' | 'all' | number>('current');

  // Collaboration state
  const [collabModalOpen, setCollabModalOpen] = useState(false);
  const [shortCodeInput, setShortCodeInput] = useState('');
  const [collabRoom, setCollabRoom] = useState<any>(null);
  const [collabParticipants, setCollabParticipants] = useState<any[]>([]);
  const [collabState, setCollabState] = useState<any>('disconnected');
  const [collabError, setCollabError] = useState<string | null>(null);
  const [collabErrorTimestamp, setCollabErrorTimestamp] = useState<string | null>(null);
  const [collabLoading, setCollabLoading] = useState(false);
  const [collabDiagExpanded, setCollabDiagExpanded] = useState(false);
  const [pendingOpsCount, setPendingOpsCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const callIframe = useCallback((fn: string, arg?: any) => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const win = iframe.contentWindow as any;
      if (!win) return;
      if (typeof win[fn] === 'function') {
        win[fn](arg);
      } else {
        iframe.contentWindow?.postMessage({ type: 'sc-call', fn, arg }, '*');
      }
    } catch {
      iframe.contentWindow?.postMessage({ type: 'sc-call', fn, arg }, '*');
    }
  }, []);

  const handleAddElement = useCallback((item: any) => {
    StageBridge.addItemToStage(iframeRef.current, item);
  }, []);

  // Update canvas background on theme changes
  useEffect(() => {
    StageBridge.updateCanvasBg(iframeRef.current, stageBg);
  }, [stageBg]);

  // Load custom elements
  const loadCustomElements = useCallback(() => {
    try {
      const raw = localStorage.getItem('stagex_custom_elements');
      if (raw) setCustomElements(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    loadCustomElements();
    if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function') {
      try {
        const dummyFile = new File([''], 'test.pdf', { type: 'application/pdf' });
        setCanShareFiles(navigator.canShare({ files: [dummyFile] }));
      } catch {
        setCanShareFiles(false);
      }
    }
  }, [loadCustomElements]);

  // Register stage iframe with core service
  useEffect(() => {
    registerStageIframe(iframeRef.current);
    return () => registerStageIframe(null);
  }, []);

  // Collaboration subscriptions
  useEffect(() => {
    const unsubAuth = authRepository.subscribeAuth(setCurrentUser);
    const service = CollaborationService.getInstance();

    setCollabState(service.getConnectionState());
    setCollabRoom(service.getActiveRoom());
    setCollabParticipants(service.getParticipants());

    const unsubState = service.subscribeConnectionState(setCollabState);
    const unsubRoom = service.subscribeRoom(setCollabRoom);
    const unsubPresence = service.subscribePresence(setCollabParticipants);

    return () => {
      unsubAuth();
      unsubState();
      unsubRoom();
      unsubPresence();
    };
  }, []);

  const openPdfSheet = useCallback(() => {
    const defaultName = `StagePlot-${new Date().toISOString().slice(0, 10)}`;
    setPdfFileName(defaultName);
    const info = StageBridge.getSceneInfo(iframeRef.current);
    if (info) setPdfSceneInfo(info);
    setPdfSceneChoice('current');
    setPdfSheetOpen(true);
  }, []);

  const executePdfExport = useCallback(
    async (share: boolean) => {
      setPdfBusy(true);
      try {
        await StageBridge.exportPdf(iframeRef.current, {
          name: (pdfFileName.trim() || 'StagePlot') + '.pdf',
          includeBackdrop: true,
        });
        setPdfSheetOpen(false);
      } catch (err) {
        console.error('PDF export failed', err);
      } finally {
        setPdfBusy(false);
      }
    },
    [pdfFileName]
  );

  const stageShape = useStagexStore((s) => s.preferences.stageShape || 'rectangular');

  // Handle iframe load
  const handleIframeLoad = () => {
    setIframeLoading(false);
    registerStageIframe(iframeRef.current);
    StageBridge.updateCanvasBg(iframeRef.current, stageBg);
    StageBridge.setStageShape(iframeRef.current, stageShape);
  };

  useEffect(() => {
    if (!iframeLoading && iframeRef.current) {
      StageBridge.setStageShape(iframeRef.current, stageShape);
    }
  }, [stageShape, iframeLoading]);

  return (
    <div
      className="w-full h-full flex flex-col relative overflow-hidden"
      style={{ background: stageBg }}
    >
      {/* Desktop Top Toolbar */}
      {isWebDesktop && (
        <StageToolbar
          curView="Editor"
          isLight={isLight}
          tr={tr}
          callIframe={callIframe}
          transitionToView={(v) => onNavigateView?.(v)}
          openPdfSheet={openPdfSheet}
          collabState={collabState}
          onOpenCollab={() => setCollabModalOpen(true)}
        />
      )}

      {/* Mobile Seamless Header & Floating Actions */}
      {!isWebDesktop && !liveMode && (
        <div className="w-full flex-shrink-0 z-20 pointer-events-none">
          <div className="w-full pointer-events-auto">
            <StudioHeader
              title="Stagex"
              subtitle="Stage Plot Editor"
              actions={
                <div
                  className="stagex-floating-actions-pill flex items-center gap-1 p-1 rounded-full"
                  style={{
                    background: isAmoled
                      ? 'rgba(10, 10, 12, 0.88)'
                      : isLight
                        ? 'rgba(255, 255, 255, 0.85)'
                        : 'rgba(20, 20, 26, 0.80)',
                    border: isAmoled
                      ? '1px solid rgba(255, 255, 255, 0.12)'
                      : isLight
                        ? '1px solid rgba(0, 0, 0, 0.08)'
                        : '1px solid rgba(255, 255, 255, 0.10)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => callIframe('scActivateMeasure')}
                    title={tr.stagex?.toolMeasure || 'Measure'}
                    aria-label={tr.stagex?.toolMeasure || 'Measure'}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[17px]">straighten</span>
                  </button>
                  <button
                    type="button"
                    onClick={openPdfSheet}
                    title={tr.stagex?.toolExport || 'Export PDF'}
                    aria-label={tr.stagex?.toolExport || 'Export PDF'}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[17px]">picture_as_pdf</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => callIframe('openPresetsPanel')}
                    title="Presets"
                    aria-label="Presets"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[17px]">bookmark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => callIframe('openTimelinePanel')}
                    title={tr.stagex?.toolHistory || 'History'}
                    aria-label={tr.stagex?.toolHistory || 'History'}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[17px]">history</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollabModalOpen(true)}
                    title="Collaboration"
                    aria-label="Collaboration"
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
                    style={{
                      color:
                        collabState === 'connected'
                          ? '#10b981'
                          : isLight
                            ? 'rgba(0,0,0,0.70)'
                            : 'rgba(255,255,255,0.85)',
                      background: collabState === 'connected' ? 'rgba(16,185,129,0.15)' : undefined,
                    }}
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      {collabState === 'connected' ? 'cloud' : 'cloud_queue'}
                    </span>
                  </button>
                </div>
              }
              containerStyle={{
                paddingTop:
                  'calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 12px)',
                paddingBottom: '2px',
                paddingLeft: '16px',
                paddingRight: '16px',
                background: 'transparent',
                alignItems: 'flex-start',
              }}
              titleStyle={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '28px',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                color: isLight ? 'var(--c-text-primary, #09090b)' : '#ffffff',
                margin: 0,
              }}
              subtitleStyle={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: isLight ? 'var(--c-text-secondary, #71717a)' : '#a1a1aa',
                margin: '2px 0 0 0',
              }}
            />
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden relative w-full h-full">
        {/* Canvas Host Container */}
        <div
          className={`flex-1 relative overflow-hidden ${
            isWebDesktop ? 'm-3 rounded-xl border' : ''
          }`}
          style={{
            borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)',
            background: 'transparent',
          }}
        >
          <iframe
            ref={iframeRef}
            src="/stage-core/index.html"
            title="Stagex Canvas Engine"
            onLoad={handleIframeLoad}
            className="w-full h-full border-none block relative z-0"
            style={{ width: '100%', height: '100%', background: 'transparent' }}
          />

          {iframeLoading && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center"
              style={{ background: stageBg }}
            >
              <SmartLoading app="stagex" />
            </div>
          )}
        </div>

        {/* Desktop Collapsible Elements Library Drawer */}
        {isWebDesktop && (
          <motion.div
            initial={false}
            animate={{ width: isRightPanelCollapsed ? 0 : 280 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="flex flex-col h-full flex-shrink-0 box-border overflow-hidden border-l"
            style={{
              borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)',
              background: isLight ? 'var(--app-surface-low)' : 'var(--app-bg)',
            }}
          >
            <div className="flex-1 overflow-y-auto">
              <StageLibraryPanel
                isLight={isLight}
                accent={accent}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                customElements={customElements}
                expandedCats={expandedCats}
                setExpandedCats={setExpandedCats}
                callIframe={callIframe}
                iframeRef={iframeRef}
                handleAddElement={handleAddElement}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Mobile Floating Action Controls */}
      {!isWebDesktop && (
        <>
          {/* Rotation Toggle */}
          <button
            onClick={() => {
              setIsStageExpanded(!isStageExpanded);
              callIframe('rotateSelectedElement');
            }}
            className="absolute rounded-full z-20 flex items-center justify-center p-0 cursor-pointer"
            style={{
              bottom: 'calc(max(14px, env(safe-area-inset-bottom, 0px)) + 196px)',
              right: 'calc(max(16px, env(safe-area-inset-right, 0px)))',
              width: 44,
              height: 44,
              background: isStageExpanded
                ? 'linear-gradient(135deg, var(--studio-accent-from), var(--studio-accent-to))'
                : 'var(--surface-topbar-bg)',
              border: isStageExpanded
                ? '1px solid var(--studio-accent-border)'
                : '1px solid var(--c-border)',
              boxShadow: 'var(--elevation-high)',
            }}
            aria-label="Toggle Expand"
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ color: isStageExpanded ? '#fff' : 'var(--c-text-primary)' }}
            >
              sync
            </span>
          </button>

          {/* Live Mode Toggle (Eye) */}
          <button
            onClick={() => {
              setLiveMode(!liveMode);
              callIframe('toggleGigMode');
            }}
            className="absolute rounded-full z-20 flex items-center justify-center p-0 cursor-pointer"
            style={{
              bottom: 'calc(max(14px, env(safe-area-inset-bottom, 0px)) + 140px)',
              right: 'calc(max(16px, env(safe-area-inset-right, 0px)))',
              width: 44,
              height: 44,
              background: liveMode
                ? 'linear-gradient(135deg, var(--studio-accent-from), var(--studio-accent-to))'
                : 'var(--surface-topbar-bg)',
              border: liveMode
                ? '1px solid var(--studio-accent-border)'
                : '1px solid var(--c-border)',
              boxShadow: 'var(--elevation-high)',
            }}
            aria-label={liveMode ? 'Exit Live Mode' : 'Enter Live Mode'}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ color: liveMode ? '#ffffff' : 'var(--c-text-primary)' }}
            >
              {liveMode ? 'visibility' : 'visibility_off'}
            </span>
          </button>

          {/* Add Instrument FAB */}
          <button
            onClick={() => {
              setFabOpen(!fabOpen);
              callIframe('toggleSCDial');
            }}
            className="absolute rounded-full z-20 flex items-center justify-center p-0 cursor-pointer"
            style={{
              bottom: 'calc(max(14px, env(safe-area-inset-bottom, 0px)) + 84px)',
              right: 'calc(max(16px, env(safe-area-inset-right, 0px)))',
              width: 44,
              height: 44,
              background: '#ec4899',
              border: 'none',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(236, 72, 153, 0.45)',
              transform: fabOpen ? 'rotate(45deg) scale(1.08)' : 'rotate(0deg) scale(1)',
              transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            aria-label="Add Element"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>
        </>
      )}

      {/* Export PDF Dialog */}
      <ExportPdfDialog
        open={pdfSheetOpen}
        onClose={() => !pdfBusy && setPdfSheetOpen(false)}
        title={tr.stagex?.pdfSheetTitle || 'Export Technical Rider & Plot'}
        nameLabel={tr.stagex?.pdfSheetNameLabel || 'Document Name'}
        fileName={pdfFileName}
        setFileName={setPdfFileName}
        busy={pdfBusy}
        sceneInfo={pdfSceneInfo}
        sceneChoice={pdfSceneChoice}
        setSceneChoice={setPdfSceneChoice}
        sceneCurrentLabel={tr.stagex?.pdfSheetSceneCurrent || 'Current Scene'}
        sceneAllLabel={tr.stagex?.pdfSheetSceneAll || 'All Scenes'}
        canShare={canShareFiles}
        onSave={() => executePdfExport(false)}
        onShare={() => executePdfExport(true)}
        saveLabel={tr.stagex?.pdfSheetSave || 'Save PDF'}
        shareLabel={tr.stagex?.pdfSheetShare || 'Share PDF'}
        cancelLabel={tr.stagex?.pdfSheetCancel || 'Cancel'}
      />

      {/* Collaboration Dialog */}
      <StageCollabDialog
        open={collabModalOpen}
        onClose={() => !collabLoading && setCollabModalOpen(false)}
        currentUser={currentUser}
        collabState={collabState}
        collabRoom={collabRoom}
        collabParticipants={collabParticipants}
        collabLoading={collabLoading}
        collabError={collabError}
        collabErrorTimestamp={collabErrorTimestamp}
        collabDiagExpanded={collabDiagExpanded}
        setCollabDiagExpanded={setCollabDiagExpanded}
        pendingOpsCount={pendingOpsCount}
        shortCodeInput={shortCodeInput}
        setShortCodeInput={setShortCodeInput}
        onHostSession={async () => {
          if (!currentUser?.uid) return;
          setCollabLoading(true);
          setCollabError(null);
          try {
            await CollaborationService.getInstance().createRoom(
              currentUser.uid,
              {
                displayName: currentUser.displayName || 'Stage Host',
                avatar: currentUser.photoURL || '',
              },
              accent.from
            );
          } catch (err: any) {
            setCollabError(err.message || 'Failed to create room');
            setCollabErrorTimestamp(new Date().toISOString());
          } finally {
            setCollabLoading(false);
          }
        }}
        onJoinSession={async () => {
          if (!currentUser?.uid || !shortCodeInput || shortCodeInput.length !== 6) return;
          setCollabLoading(true);
          setCollabError(null);
          try {
            await CollaborationService.getInstance().joinRoom(
              shortCodeInput,
              currentUser.uid,
              {
                displayName: currentUser.displayName || 'Stage Guest',
                avatar: currentUser.photoURL || '',
              },
              accent.from
            );
          } catch (err: any) {
            setCollabError(err.message || 'Failed to join room');
            setCollabErrorTimestamp(new Date().toISOString());
          } finally {
            setCollabLoading(false);
          }
        }}
        onLeaveSession={async () => {
          setCollabLoading(true);
          try {
            await CollaborationService.getInstance().leaveRoom();
          } finally {
            setCollabLoading(false);
          }
        }}
        generateDiagnosticsReport={() => {
          const fbConfig = getFirebaseConfigDetails();
          const fsDiag = getFirestoreDiagnostics();
          return [
            `=== STAGEX COLLABORATION DIAGNOSTICS ===`,
            `Generated: ${new Date().toISOString()}`,
            `App Version: ${APP_VERSION}`,
            `Firebase Project: ${fbConfig.projectId}`,
            `Connection: ${collabState}`,
            `Active Room: ${collabRoom?.shortCode || 'None'}`,
            `Participants: ${collabParticipants.length}`,
            `Pending Ops: ${pendingOpsCount}`,
            `Cache State: ${fsDiag.firestoreRuntimeActive ? 'Active' : 'Offline'}`,
            `=========================================`,
          ].join('\n');
        }}
      />
    </div>
  );
};
