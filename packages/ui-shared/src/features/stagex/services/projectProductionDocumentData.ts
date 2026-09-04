import {
  useStagexStore,
  type GearItem,
  type SetlistSong,
  type BandMember,
} from '../state/useStagexStore';
import { StageBridge } from './StageBridgeService';

export interface ProductionDocumentChannel {
  ch: string;
  source: string;
  performer: string;
  mic: string;
  phantom: boolean;
  notes: string;
}

export interface ProductionDocumentMember extends BandMember {
  assignedElements: string[];
}

export interface ProductionDocumentSectionsConfig {
  stagePlot: boolean;
  inputPatch: boolean;
  technicalRequirements: boolean;
  technicalNotes: boolean;
  setlist: boolean;
  gear: boolean;
  bandCrew: boolean;
}

export const DEFAULT_PRODUCTION_DOCUMENT_SECTIONS: ProductionDocumentSectionsConfig = {
  stagePlot: true,
  inputPatch: true,
  technicalRequirements: true,
  technicalNotes: true,
  setlist: true,
  gear: true,
  bandCrew: true,
};

export interface ProductionDocumentData {
  // Document Identity
  projectName: string;
  sceneName: string;
  sceneIdx: number;
  totalScenes: number;
  date: string;
  time: string;
  documentId: string;
  isSquare: boolean;
  stageDimensions: string;

  // Logistics / Venue / Contacts
  venue?: string;
  contactName?: string;
  contactPhone?: string;
  notes: string;

  // Technical Requirements (Rider)
  requirements: {
    foh: string[];
    monitor: string[];
    power: string[];
    hospitality: string[];
    custom: string[];
  };
  totalRequirementsCount: number;

  // Stage Plot Elements & Connections
  elements: any[];
  connections: any[];
  refW: number;
  refH: number;

  // Input Channels & Patch
  channels: ProductionDocumentChannel[];

  // Setlist
  setlist: SetlistSong[];
  totalSetlistMinutes: number;
  totalSetlistDurationFormatted: string;

  // Gear Inventory
  gear: GearItem[];
  totalGearItems: number;
  totalGearUnits: number;
  packedGearUnits: number;
  remainingGearUnits: number;

  // Band & Crew
  members: ProductionDocumentMember[];
  totalMembers: number;
  assignedMembersCount: number;
  unassignedMembersCount: number;
}

/**
 * Pure projection function extracting all relevant Setup & Stage state
 * into a single unified Production Document contract.
 */
export function projectProductionDocumentData(
  state?: ReturnType<typeof useStagexStore.getState>,
  targetSceneIdx?: 'current' | 'all' | number
): ProductionDocumentData {
  const store = state || useStagexStore.getState();

  // Check live iframe state if available for real-time canvas accuracy
  const liveWin = StageBridge.getWin();
  const liveState = liveWin?.state;

  const activeScenes =
    liveState?.scenes && liveState.scenes.length > 0
      ? liveState.scenes
      : store.scenes && store.scenes.length > 0
        ? store.scenes
        : [{ name: 'Main Stage', elements: store.elements || [] }];

  let selectedIdx = 0;
  if (
    typeof targetSceneIdx === 'number' &&
    targetSceneIdx >= 0 &&
    targetSceneIdx < activeScenes.length
  ) {
    selectedIdx = targetSceneIdx;
  } else if (typeof liveState?.currentSceneIdx === 'number') {
    selectedIdx = liveState.currentSceneIdx;
  } else if (typeof store.currentSceneIdx === 'number') {
    selectedIdx = store.currentSceneIdx;
  }

  const currentScene = activeScenes[selectedIdx] || activeScenes[0] || { name: 'Main Stage' };
  const sceneName = currentScene.name || `Scene ${selectedIdx + 1}`;

  // Stage Elements for this scene
  let currentElements: any[] = [];
  if (liveState?.elements && liveState.currentSceneIdx === selectedIdx) {
    currentElements = liveState.elements;
  } else if (currentScene && Array.isArray(currentScene.elements)) {
    currentElements = currentScene.elements;
  } else {
    currentElements = store.elements || [];
  }

  // Connections
  let currentConnections: any[] = [];
  if (liveState?.connections && liveState.currentSceneIdx === selectedIdx) {
    currentConnections = liveState.connections;
  } else if (currentScene && Array.isArray(currentScene.connections)) {
    currentConnections = currentScene.connections;
  }

  // Canvas Dimensions
  const isSquare = store.preferences?.stageShape === 'square';
  const stageDimensions = isSquare ? "28' × 28'" : "32' × 24'";
  const refW =
    liveState?.canvasW && liveState.canvasW > 0 ? liveState.canvasW : isSquare ? 500 : 650;
  const refH =
    liveState?.canvasH && liveState.canvasH > 0 ? liveState.canvasH : isSquare ? 500 : 420;

  // Formatted Timestamps
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Technical Requirements (Rider)
  const reqs = {
    foh: [] as string[],
    monitor: [] as string[],
    power: [] as string[],
    hospitality: [] as string[],
    custom: [] as string[],
  };

  const needs = store.riderNeeds || [];
  needs.forEach((n) => {
    const t = n.type || 'custom';
    if (reqs[t]) {
      reqs[t].push(n.value);
    } else {
      reqs.custom.push(n.value);
    }
  });

  // If no requirements configured, provide standard defaults
  if (reqs.foh.length === 0) reqs.foh.push('Dante Primary/Secondary @ 96kHz, 32-channel minimum');
  if (reqs.monitor.length === 0) reqs.monitor.push('Minimum 4 discrete stereo wireless IEM mixes');
  if (reqs.power.length === 0) reqs.power.push('2× 20A dedicated circuits, distro Stage Left');

  const totalRequirementsCount =
    reqs.foh.length +
    reqs.monitor.length +
    reqs.power.length +
    reqs.hospitality.length +
    reqs.custom.length;

  // Production Logistics
  const riderConfig = store.riderConfig || {};
  const notes =
    riderConfig.notes ||
    'Artist provides all instruments, IEM transmitters, and playback rack. Venue must provide all microphones, stands, and XLR cabling as per the input list. PA system must be capable of 105dB continuous at FOH without distortion. Front-fills are mandatory for the first 3 rows. All wireless systems must be frequency-coordinated prior to load-in.';

  // Band & Crew with assigned elements
  const members: ProductionDocumentMember[] = (store.members || []).map((m) => {
    const assigned = currentElements
      .filter((el) => el.memberId === m.id)
      .map((el) => el.label || el.name || el.type || 'Stage Element');
    return {
      ...m,
      assignedElements: assigned,
    };
  });

  const assignedMembersCount = members.filter((m) => m.assignedElements.length > 0).length;
  const unassignedMembersCount = Math.max(0, members.length - assignedMembersCount);

  // Channels / Patch List
  let channels: ProductionDocumentChannel[] = [];
  if (store.riderChannels && store.riderChannels.length > 0) {
    channels = store.riderChannels.map((c, idx) => ({
      ch: String(c.ch || idx + 1).padStart(2, '0'),
      source: (c.source || `Channel ${idx + 1}`).toUpperCase(),
      performer: members[idx % (members.length || 1)]?.name || 'Band',
      mic: c.mic || 'Direct / Mic',
      phantom: Boolean(c.phantom),
      notes: c.notes || c.stand || 'FOH Mix',
    }));
  } else if (currentElements.length > 0) {
    channels = currentElements.map((el, idx) => {
      const typeStr = (el.type || '').toLowerCase();
      const labelStr = (el.label || el.name || '').toLowerCase();
      const isMic = typeStr.includes('mic') || labelStr.includes('vocal');
      const isAmp =
        typeStr.includes('amp') || labelStr.includes('guitar') || labelStr.includes('bass');
      const isKey =
        typeStr.includes('key') || labelStr.includes('synth') || labelStr.includes('piano');
      const isDrum = typeStr.includes('drum');

      let mic = 'Direct Line / DI';
      if (isMic) mic = labelStr.includes('lead') ? 'Axient KSM9 (Wireless)' : 'Shure Beta 58A';
      else if (isDrum) mic = labelStr.includes('kick') ? 'Shure Beta 91A' : 'Audix DP7 Pack';
      else if (isAmp) mic = labelStr.includes('bass') ? 'Radial J48 Active DI' : 'Sennheiser e609';
      else if (isKey) mic = 'Radial ProD2 Stereo';

      const assignedMember = members.find((m) => m.id === el.memberId);
      const performerName =
        assignedMember?.name ||
        el.performer ||
        (isMic ? 'Lead Vocalist' : isDrum ? 'Drummer' : isAmp ? 'Guitar/Bass' : 'Keys / Synth');

      const isPhantom = Boolean(el.phantom || isKey || mic.includes('91A') || mic.includes('J48'));

      return {
        ch: String(idx + 1).padStart(2, '0'),
        source: (el.label || el.name || `Input ${idx + 1}`).toUpperCase(),
        performer: performerName,
        mic: el.transducer || mic,
        phantom: isPhantom,
        notes:
          el.mix ||
          (isMic ? 'Wireless RF' : isDrum ? 'Gate/Comp' : isAmp ? 'Pre-EQ drop' : 'Stereo Pair'),
      };
    });
  }

  // Setlist calculations
  const setlist = store.setlist || [];
  let totalSeconds = 0;
  setlist.forEach((song) => {
    const parts = (song.duration || '04:00').split(':').map((p) => parseInt(p, 10) || 0);
    if (parts.length === 2) {
      totalSeconds += parts[0] * 60 + parts[1];
    } else {
      totalSeconds += 240;
    }
  });
  const totalSetlistMinutes = Math.round(totalSeconds / 60);
  const durMins = Math.floor(totalSeconds / 60);
  const durSecs = totalSeconds % 60;
  const totalSetlistDurationFormatted = `${durMins}:${String(durSecs).padStart(2, '0')}`;

  // Gear Inventory calculations
  const gear = store.gear || [];
  let totalGearUnits = 0;
  let packedGearUnits = 0;
  gear.forEach((item) => {
    const q = item.qty || 1;
    totalGearUnits += q;
    if (item.packed) {
      packedGearUnits += q;
    }
  });
  const remainingGearUnits = Math.max(0, totalGearUnits - packedGearUnits);

  return {
    projectName: store.projectName || 'Main Stage',
    sceneName,
    sceneIdx: selectedIdx,
    totalScenes: activeScenes.length,
    date: dateFormatted,
    time: timeFormatted,
    documentId: `STAGE-PROD-${now.getFullYear()}`,
    isSquare,
    stageDimensions,

    venue: riderConfig.venue?.trim() || undefined,
    contactName: riderConfig.contactName?.trim() || undefined,
    contactPhone: riderConfig.contactPhone?.trim() || undefined,
    notes,

    requirements: reqs,
    totalRequirementsCount,

    elements: currentElements,
    connections: currentConnections,
    refW,
    refH,

    channels,

    setlist,
    totalSetlistMinutes,
    totalSetlistDurationFormatted,

    gear,
    totalGearItems: gear.length,
    totalGearUnits,
    packedGearUnits,
    remainingGearUnits,

    members,
    totalMembers: members.length,
    assignedMembersCount,
    unassignedMembersCount,
  };
}
