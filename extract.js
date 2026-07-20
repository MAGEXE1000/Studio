const fs = require('fs');

const tpContent = fs.readFileSync(
  'packages/ui-shared/src/features/vocalex/components/TakesPanel.tsx',
  'utf-8'
);

const recordingStart = tpContent.indexOf('function RecordingView');
const detailStart = tpContent.indexOf('function TakeDetailView');
const listStart = tpContent.indexOf('function TakeListItem');

const recordingCode = tpContent.substring(recordingStart, detailStart);
const detailCode = tpContent.substring(detailStart, listStart);
const listCode = tpContent.substring(listStart);

const imports = `import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useT, createAudioContext, NavigationDispatcher } from '@workspace/studio-core';
import {
  blobToAudioBuffer,
  extractWaveformPeaks,
  saveTake,
  type TakeRecord,
} from '@workspace/studio-core';
import { setVocalexBack } from '../utilities/headerBack';
`;

const recFile =
  imports +
  `
const SMOOTHING_FACTOR = 0.8;
const VIZ_BARS = 64;

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return \`\${m}:\${String(s).padStart(2, '0')}\`;
}

export ` +
  recordingCode.replace(/^function RecordingView/m, 'default function RecordingView');

const detailImports =
  imports +
  `import { analyzeAudio, type VocalAnalysis, type AnalysisLabels } from '../services/vocalAnalysis';
import HarmonizerSheet from './HarmonizerSheet';
import { Button } from '../../../components/design-system/StudioDesignSystem';
import { DialogScaffold } from '../../../components/layout/StudioLayoutSystem';

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return \`\${m}:\${String(s).padStart(2, '0')}\`;
}

function formatDateI18n(ts: number, t: { today: string; yesterday: string; daysAgo: (n: number) => string }): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;
  if (diff < 86400000) {
    return \`\${t.today}, \${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}\`;
  }
  if (diff < 172800000) {
    return \`\${t.yesterday}, \${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}\`;
  }
  if (diff < 604800000) {
    return t.daysAgo(Math.floor(diff / 86400000));
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

`;

const detFile =
  detailImports +
  'export ' +
  detailCode.replace(/^function TakeDetailView/m, 'default function TakeDetailView');

fs.writeFileSync('packages/ui-shared/src/features/vocalex/components/RecordingView.tsx', recFile);
fs.writeFileSync('packages/ui-shared/src/features/vocalex/components/TakeDetailView.tsx', detFile);

const mainImports = tpContent.substring(0, tpContent.indexOf('function formatDuration'));
const mainTail = tpContent.substring(tpContent.indexOf('export default function TakesPanel'));

const newMain =
  mainImports +
  `
import RecordingView from './RecordingView';
import TakeDetailView from './TakeDetailView';

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return \`\${m}:\${String(s).padStart(2, '0')}\`;
}

function formatDateI18n(ts: number, t: { today: string; yesterday: string; daysAgo: (n: number) => string }): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;
  if (diff < 86400000) {
    return \`\${t.today}, \${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}\`;
  }
  if (diff < 172800000) {
    return \`\${t.yesterday}, \${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}\`;
  }
  if (diff < 604800000) {
    return t.daysAgo(Math.floor(diff / 86400000));
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

` +
  mainTail.substring(0, mainTail.indexOf('function TakeListItem')) +
  listCode;

fs.writeFileSync('packages/ui-shared/src/features/vocalex/components/TakesPanel.tsx', newMain);
