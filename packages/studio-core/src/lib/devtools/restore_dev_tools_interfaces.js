import fs from 'fs';

const filePath = 'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\studio-core\\src\\lib\\diagnostics\\devTools.ts';
let content = fs.readFileSync(filePath, 'utf8');

const interfacesHeader = `import { NavigationDispatcher } from '../navigation/NavigationDispatcher';
import { useChordStore } from '../../store/useChordStore';
import { useSettingsStore } from '../../store/useSettingsStore';;

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  module: string;
  source: string;
}

export interface NavigationEntry {
  id: string;
  timestamp: number;
  fromApp: string;
  toApp: string;
  transitionStart?: number;
  transitionComplete?: number;
  hubMounted?: boolean;
  subappUnmounted?: boolean;
  activeAppAfterTransition: string;
  transitionLockState: boolean;
  fallbackRendered: boolean;
}

export interface ErrorEntry {
  id?: string;
  fingerprint?: string;
  count?: number;
  firstSeen?: number;
  lastSeen?: number;
  timestamp: number;
  message: string;
  stack: string;
  source: string;
  module: string;
}

export interface EventEntry {
  timestamp: number;
  type: string;
  target: string;
  module: string;
}

export interface NetworkEntry {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  headers: Record<string, string>;
  status?: number;
  statusText?: string;
  error?: string;
}
`;

const stagexIdx = content.indexOf('export interface StagexDiagnosticsState');
if (stagexIdx !== -1) {
  content = interfacesHeader + '\n' + content.substring(stagexIdx);
  console.log('✓ Restored all devTools.ts interfaces cleanly including ErrorEntry with count, firstSeen, lastSeen');
  fs.writeFileSync(filePath, content, 'utf8');
} else {
  console.log('❌ Could not locate StagexDiagnosticsState');
}
