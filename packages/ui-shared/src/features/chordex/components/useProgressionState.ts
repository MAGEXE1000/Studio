import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  useChordStore,
  romanToChordId,
  generateProgression,
  diatonicChordIds,
  setNavLocked,
  setNavHidden,
  type Key,
  type ScaleType,
  type Style,
  type GeneratedProgression,
  type SongPreset
} from '@workspace/studio-core';

export const EXIT_MS = 240;

export interface ProgressionState {
  key: Key;
  setKey: (k: Key) => void;
  scale: ScaleType;
  setScale: (s: ScaleType) => void;
  style: Style;
  setStyle: (s: Style) => void;
  result: GeneratedProgression | null;
  editedChordIds: string[] | null;
  swapOpenIdx: number | null;
  setSwapOpenIdx: (i: number | null) => void;
  savePromptOpen: boolean;
  setSavePromptOpen: (v: boolean) => void;
  progName: string;
  setProgName: (v: string) => void;
  presetPickerOpen: boolean;
  setPresetPickerOpen: (v: boolean) => void;
  presetPickerClosing: boolean;
  loadedToName: string | null;
  closing: boolean;
  activeChordIds: string[];
  diatonic: ReturnType<typeof diatonicChordIds>;
  handleGenerate: () => void;
  handleRegenerate: () => void;
  handleSwap: (idx: number, newChordId: string) => void;
  handleRemove: (idx: number) => void;
  handleAppendDiatonic: () => void;
  handleUse: () => void;
  handleSaveConfirm: () => void;
  handleLoadToPreset: (preset: SongPreset) => void;
  requestClose: () => void;
  requestClosePicker: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function useProgressionState(
  onClose: () => void,
  defaultKey: Key = 'C',
  defaultScale: ScaleType = 'major',
  defaultStyle: Style = 'pop',
  scrollRef: React.RefObject<HTMLDivElement | null>
): ProgressionState {
  const setProgression = useChordStore((s) => s.clearProgression);
  const addToProgression = useChordStore((s) => s.addToProgression);
  const saveProgression = useChordStore((s) => s.saveProgression);
  const addChordToPreset = useChordStore((s) => s.addChordToPreset);
  const addChordToSection = useChordStore((s) => s.addChordToSection);

  const [key, setKey] = useState<Key>(defaultKey);
  const [scale, setScale] = useState<ScaleType>(defaultScale);
  const [style, setStyle] = useState<Style>(defaultStyle);

  const [result, setResult] = useState<GeneratedProgression | null>(null);
  const [editedChordIds, setEditedChordIds] = useState<string[] | null>(null);

  const [swapOpenIdx, setSwapOpenIdx] = useState<number | null>(null);
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [progName, setProgName] = useState('');

  const [presetPickerOpen, setPresetPickerOpen] = useState(false);
  const [presetPickerClosing, setPresetPickerClosing] = useState(false);
  const presetPickerCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loadedToName, setLoadedToName] = useState<string | null>(null);

  const requestClosePicker = useCallback(() => {
    if (presetPickerClosing || !presetPickerOpen) return;
    setPresetPickerClosing(true);
    if (presetPickerCloseTimer.current) clearTimeout(presetPickerCloseTimer.current);
    presetPickerCloseTimer.current = setTimeout(() => {
      setPresetPickerOpen(false);
      setPresetPickerClosing(false);
    }, EXIT_MS);
  }, [presetPickerClosing, presetPickerOpen]);

  useEffect(
    () => () => {
      if (presetPickerCloseTimer.current) clearTimeout(presetPickerCloseTimer.current);
    },
    []
  );

  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNavLocked(true);
    setNavHidden(true);
    return () => {
      setNavLocked(false);
      setNavHidden(false);
    };
  }, []);

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, EXIT_MS);
  }, [closing, onClose]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    []
  );

  const activeChordIds = editedChordIds ?? result?.chordIds ?? [];

  const handleGenerate = useCallback(() => {
    const next = generateProgression(key, scale, style);
    setResult(next);
    setEditedChordIds(null);
    setSwapOpenIdx(null);
  }, [key, scale, style]);

  const handleRegenerate = useCallback(() => {
    const next = generateProgression(key, scale, style, result?.templateIdx);
    setResult(next);
    setEditedChordIds(null);
    setSwapOpenIdx(null);
  }, [key, scale, style, result?.templateIdx]);

  const handleSwap = useCallback(
    (idx: number, newChordId: string) => {
      const next = [...activeChordIds];
      next[idx] = newChordId;
      setEditedChordIds(next);
      setSwapOpenIdx(null);
    },
    [activeChordIds]
  );

  const handleRemove = useCallback(
    (idx: number) => {
      const next = activeChordIds.filter((_, i) => i !== idx);
      setEditedChordIds(next);
      setSwapOpenIdx(null);
    },
    [activeChordIds]
  );

  const handleAppendDiatonic = useCallback(() => {
    if (!result) return;
    const tonic = romanToChordId(scale === 'major' ? 'I' : 'i', key);
    if (!tonic) return;
    setEditedChordIds([...activeChordIds, tonic]);
  }, [activeChordIds, key, scale, result]);

  const handleUse = useCallback(() => {
    if (!activeChordIds.length) return;
    setProgression();
    activeChordIds.forEach((id) => addToProgression(id));
    requestClose();
  }, [activeChordIds, setProgression, addToProgression, requestClose]);

  const handleSaveConfirm = useCallback(() => {
    const trimmed = progName.trim();
    if (!trimmed || !activeChordIds.length) return;
    setProgression();
    activeChordIds.forEach((id) => addToProgression(id));
    saveProgression(trimmed);
    setSavePromptOpen(false);
    setProgName('');
    requestClose();
  }, [progName, activeChordIds, setProgression, addToProgression, saveProgression, requestClose]);

  const handleLoadToPreset = useCallback(
    (preset: SongPreset) => {
      if (!activeChordIds.length) return;
      if (preset.sections && preset.sections.length > 0) {
        const last = preset.sections[preset.sections.length - 1];
        activeChordIds.forEach((id) => addChordToSection(preset.id, last.id, id));
      } else {
        activeChordIds.forEach((id) => addChordToPreset(preset.id, id));
      }
      requestClosePicker();
      setLoadedToName(preset.name);
      setTimeout(() => requestClose(), 900);
    },
    [activeChordIds, addChordToPreset, addChordToSection, requestClose, requestClosePicker]
  );

  const diatonic = useMemo(() => diatonicChordIds(key, scale), [key, scale]);

  return {
    key, setKey, scale, setScale, style, setStyle, result, editedChordIds,
    swapOpenIdx, setSwapOpenIdx, savePromptOpen, setSavePromptOpen, progName, setProgName,
    presetPickerOpen, setPresetPickerOpen, presetPickerClosing, loadedToName, closing,
    activeChordIds, diatonic, handleGenerate, handleRegenerate, handleSwap, handleRemove,
    handleAppendDiatonic, handleUse, handleSaveConfirm, handleLoadToPreset, requestClose, requestClosePicker, scrollRef
  };
}
