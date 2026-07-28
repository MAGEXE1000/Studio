import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  SAX_FINGERINGS,
  SAX_VARIANTS,
  getConcertNote,
  playSaxophoneNote,
  type SaxophoneVariant,
  type SaxKeyId,
} from '@workspace/studio-core';
import { SaxophoneView } from '../components/SaxophoneView';

export const SaxophonePracticePanel: React.FC = () => {
  const [variant, setVariant] = useState<SaxophoneVariant>('alto');
  const [selectedNoteIdx, setSelectedNoteIdx] = useState<number>(6); // Default F4 (index 6)
  const [activeKeysOverride, setActiveKeysOverride] = useState<SaxKeyId[] | null>(null);

  const currentFingering = SAX_FINGERINGS[selectedNoteIdx] || SAX_FINGERINGS[0];
  const concertNote = getConcertNote(currentFingering.writtenNote, variant);

  const handlePlaySound = useCallback(() => {
    playSaxophoneNote({
      writtenNote: currentFingering.writtenNote,
      variant,
      duration: 2.0,
    });
  }, [currentFingering.writtenNote, variant]);

  const handleKeyToggle = (keyId: SaxKeyId) => {
    setActiveKeysOverride((prev) => {
      const current = prev || [...currentFingering.keys];
      if (current.includes(keyId)) {
        return current.filter((k) => k !== keyId);
      }
      return [...current, keyId];
    });
    handlePlaySound();
  };

  const handleNoteChange = (newIdx: number) => {
    const nextIdx = Math.max(0, Math.min(SAX_FINGERINGS.length - 1, newIdx));
    setSelectedNoteIdx(nextIdx);
    setActiveKeysOverride(null);
    playSaxophoneNote({
      writtenNote: SAX_FINGERINGS[nextIdx].writtenNote,
      variant,
      duration: 1.5,
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: '#09090b',
        color: '#f4f4f5',
        fontFamily: 'Manrope, sans-serif',
        overflowY: 'auto',
        padding: '16px 20px 100px 20px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header & Variant Selector */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.02em' }}>
          Saxophone Practice
        </div>

        {/* Variant Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: 4,
            borderRadius: 12,
            gap: 4,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {(Object.keys(SAX_VARIANTS) as SaxophoneVariant[]).map((v) => {
            const isActive = variant === v;
            return (
              <button
                key={v}
                onClick={() => {
                  setVariant(v);
                  setActiveKeysOverride(null);
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: isActive ? '#f59e0b' : 'transparent',
                  color: isActive ? '#000' : '#a1a1aa',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {SAX_VARIANTS[v].name.split(' ')[0]} ({SAX_VARIANTS[v].key})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Pitch & Fingering Card */}
      <div
        style={{
          background: 'rgba(24, 24, 27, 0.8)',
          borderRadius: 20,
          padding: 20,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
          marginBottom: 20,
        }}
      >
        {/* Note Display & Playback Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: 360,
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase' }}>
              Written Pitch
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>
              {currentFingering.displayNote}
            </div>
            <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
              Concert Pitch: {concertNote}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handlePlaySound}
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
              volume_up
            </span>
          </motion.button>
        </div>

        {/* Note Stepper Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            maxWidth: 360,
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => handleNoteChange(selectedNoteIdx - 1)}
            disabled={selectedNoteIdx === 0}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              opacity: selectedNoteIdx === 0 ? 0.4 : 1,
            }}
          >
            ◄ Prev Note
          </button>

          <span style={{ fontSize: 13, opacity: 0.7 }}>
            {selectedNoteIdx + 1} / {SAX_FINGERINGS.length}
          </span>

          <button
            onClick={() => handleNoteChange(selectedNoteIdx + 1)}
            disabled={selectedNoteIdx === SAX_FINGERINGS.length - 1}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              opacity: selectedNoteIdx === SAX_FINGERINGS.length - 1 ? 0.4 : 1,
            }}
          >
            Next Note ►
          </button>
        </div>

        {/* Interactive Vector Saxophone Chart */}
        <SaxophoneView
          fingering={currentFingering}
          activeKeys={activeKeysOverride || undefined}
          onKeyToggle={handleKeyToggle}
          variantName={SAX_VARIANTS[variant].name}
          accentColor="#f59e0b"
        />
      </div>
    </div>
  );
};
