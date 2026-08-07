import { Dialog } from '../../../../shared/design-system/dialogs';
import React from 'react';
import { Button, Input } from '../../../../shared/design-system/StudioDesignSystem';
;
// Note: You will need to fix imports if they are missing.

interface ExportPdfDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  nameLabel: string;
  fileName: string;
  setFileName: (val: string) => void;
  busy: boolean;
  sceneInfo: { count: number; currentIdx: number; names: string[] };
  sceneChoice: 'current' | 'all' | number;
  setSceneChoice: (val: 'current' | 'all' | number) => void;
  sceneCurrentLabel: string;
  sceneAllLabel: string;
  canShare: boolean;
  onSave: () => void;
  onShare: () => void;
  saveLabel: string;
  shareLabel: string;
  cancelLabel: string;
}

export const ExportPdfDialog: React.FC<ExportPdfDialogProps> = ({
  open,
  onClose,
  title,
  nameLabel,
  fileName,
  setFileName,
  busy,
  sceneInfo,
  sceneChoice,
  setSceneChoice,
  sceneCurrentLabel,
  sceneAllLabel,
  canShare,
  onSave,
  onShare,
  saveLabel,
  shareLabel,
  cancelLabel,
}) => {
  return (
          <Dialog
            open={open}
            onClose={() => onClose()}
            title={title}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-headline)',
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--c-text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  {nameLabel}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Input
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    disabled={busy}
                    maxLength={64}
                    style={{ flex: 1 }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--c-text-secondary)',
                      paddingRight: 4,
                    }}
                  >
                    .pdf
                  </span>
                </div>
              </div>

              {sceneInfo.count > 1 && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-headline)',
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--c-text-secondary)',
                      marginBottom: 6,
                    }}
                  >
                    {nameLabel}
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    {[
                      { key: 'current' as const, label: sceneCurrentLabel },
                      ...sceneInfo.names
                        .slice(0, sceneInfo.count)
                        .map((n, i) => ({ key: i, label: n })),
                      { key: 'all' as const, label: sceneAllLabel },
                    ].map(({ key, label }) => {
                      const active = sceneChoice === key;
                      return (
                        <button
                          key={String(key)}
                          onClick={() => setSceneChoice(key)}
                          disabled={busy}
                          className="btn-smooth"
                          style={{
                            padding: '7px 12px',
                            background: active ? 'var(--c-accent-from)' : 'var(--c-surface-high)',
                            color: active ? '#fff' : 'var(--c-text-primary)',
                            border: `1px solid ${active ? 'transparent' : 'var(--c-border)'}`,
                            borderRadius: 8,
                            fontFamily: 'var(--font-headline)',
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            cursor: busy ? 'wait' : 'pointer',
                            transition: 'background 150ms, color 150ms, border-color 150ms',
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <Button
                  variant="primary"
                  onClick={() => onSave()}
                  disabled={busy || !fileName.trim()}
                  style={{ width: '100%' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    download
                  </span>
                  {saveLabel}
                </Button>

                {canShare && (
                  <Button
                    onClick={() => onShare()}
                    disabled={busy || !fileName.trim()}
                    style={{ width: '100%' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      share
                    </span>
                    {shareLabel}
                  </Button>
                )}

                <Button
                  onClick={() => onClose()}
                  disabled={busy}
                  style={{ width: '100%' }}
                >
                  {cancelLabel}
                </Button>
              </div>
            </div>
          </Dialog>
  );
};
