import React from 'react';
import type { SaxKeyId, SaxFingering } from '@workspace/studio-core';

interface SaxophoneViewProps {
  fingering?: SaxFingering | null;
  activeKeys?: SaxKeyId[];
  onKeyToggle?: (keyId: SaxKeyId) => void;
  interactive?: boolean;
  size?: number | string;
  accentColor?: string;
  variantName?: string;
}

export const SaxophoneView: React.FC<SaxophoneViewProps> = ({
  fingering,
  activeKeys: forcedActiveKeys,
  onKeyToggle,
  interactive = true,
  size = '100%',
  accentColor = '#3b82f6',
  variantName = 'Alto Saxophone',
}) => {
  const activeKeysSet = new Set<SaxKeyId>(
    forcedActiveKeys || fingering?.keys || []
  );

  const isKeyActive = (keyId: SaxKeyId) => activeKeysSet.has(keyId);

  const handleKeyClick = (keyId: SaxKeyId) => {
    if (!interactive) return;
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch (_) {}
    }
    if (onKeyToggle) {
      onKeyToggle(keyId);
    }
  };

  const keyColor = (keyId: SaxKeyId) => {
    return isKeyActive(keyId) ? accentColor : '#27272a';
  };

  const keyBorder = (keyId: SaxKeyId) => {
    return isKeyActive(keyId) ? '#60a5fa' : '#52525b';
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        maxWidth: 420,
        margin: '0 auto',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      <svg
        viewBox="0 0 300 720"
        style={{
          width: '100%',
          height: 'auto',
          maxHeight: 650,
          filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.6))',
        }}
      >
        <defs>
          <linearGradient id="saxBrass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="40%" stopColor="#d97706" />
            <stop offset="70%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          <linearGradient id="saxSilver" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e4e4e7" />
            <stop offset="50%" stopColor="#a1a1aa" />
            <stop offset="100%" stopColor="#52525b" />
          </linearGradient>

          <filter id="keyGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Saxophone Body (Neck + Upper Tube + Lower Body + Bell) */}
        {/* Neck Curve */}
        <path
          d="M 120 40 Q 90 20 80 50 L 95 110 Q 115 110 135 110"
          fill="none"
          stroke="url(#saxBrass)"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Mouthpiece */}
        <path d="M 115 35 L 130 30 L 125 45 Z" fill="#18181b" />

        {/* Main Body Tube */}
        <rect x="125" y="100" width="30" height="420" rx="8" fill="url(#saxBrass)" />

        {/* Bell Curve */}
        <path
          d="M 155 490 Q 230 520 240 400 Q 250 320 190 310 Q 155 310 155 490"
          fill="url(#saxBrass)"
          stroke="#78350f"
          strokeWidth="3"
        />
        {/* Bell Opening Lip */}
        <ellipse cx="210" cy="360" rx="42" ry="70" fill="none" stroke="#fef08a" strokeWidth="5" />

        {/* Rod Mechanism Backbone Lines */}
        <line x1="120" y1="110" x2="120" y2="510" stroke="url(#saxSilver)" strokeWidth="3" />
        <line x1="160" y1="110" x2="160" y2="510" stroke="url(#saxSilver)" strokeWidth="3" />

        {/* 2. KEYS & PAD MECHANISMS */}

        {/* OCTAVE KEY (Top Back Thumb) */}
        <g
          onClick={() => handleKeyClick('octave')}
          style={{ cursor: interactive ? 'pointer' : 'default' }}
        >
          <rect
            x="95"
            y="115"
            width="22"
            height="14"
            rx="5"
            fill={keyColor('octave')}
            stroke={keyBorder('octave')}
            strokeWidth="2"
            filter={isKeyActive('octave') ? 'url(#keyGlow)' : undefined}
          />
          <text x="106" y="125" fill="#fff" fontSize="9" fontWeight="800" textAnchor="middle">
            OCT
          </text>
        </g>

        {/* LEFT HAND PALM KEYS (D, Eb, F) */}
        <g onClick={() => handleKeyClick('lh_d')} style={{ cursor: 'pointer' }}>
          <path
            d="M 100 145 C 80 140, 80 160, 100 160 Z"
            fill={keyColor('lh_d')}
            stroke={keyBorder('lh_d')}
            strokeWidth="2"
          />
          <text x="88" y="154" fill="#fff" fontSize="8" fontWeight="bold">
            D
          </text>
        </g>
        <g onClick={() => handleKeyClick('lh_eb')} style={{ cursor: 'pointer' }}>
          <path
            d="M 100 165 C 75 160, 75 180, 100 180 Z"
            fill={keyColor('lh_eb')}
            stroke={keyBorder('lh_eb')}
            strokeWidth="2"
          />
          <text x="84" y="174" fill="#fff" fontSize="8" fontWeight="bold">
            E♭
          </text>
        </g>
        <g onClick={() => handleKeyClick('lh_f')} style={{ cursor: 'pointer' }}>
          <path
            d="M 100 185 C 75 180, 75 200, 100 200 Z"
            fill={keyColor('lh_f')}
            stroke={keyBorder('lh_f')}
            strokeWidth="2"
          />
          <text x="86" y="194" fill="#fff" fontSize="8" fontWeight="bold">
            F
          </text>
        </g>

        {/* FRONT F KEY */}
        <g onClick={() => handleKeyClick('front_f')} style={{ cursor: 'pointer' }}>
          <circle
            cx="140"
            cy="140"
            r="8"
            fill={keyColor('front_f')}
            stroke={keyBorder('front_f')}
            strokeWidth="2"
          />
          <text x="140" y="143" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
            FF
          </text>
        </g>

        {/* LEFT HAND MAIN STACK (1, Bis, 2, 3) */}
        {/* Key 1 (B) */}
        <g onClick={() => handleKeyClick('lh1')} style={{ cursor: 'pointer' }}>
          <circle
            cx="140"
            cy="165"
            r="13"
            fill={keyColor('lh1')}
            stroke={keyBorder('lh1')}
            strokeWidth="2.5"
            filter={isKeyActive('lh1') ? 'url(#keyGlow)' : undefined}
          />
          <text x="140" y="169" fill="#fff" fontSize="11" fontWeight="800" textAnchor="middle">
            1
          </text>
        </g>

        {/* Bis Key (Bb) */}
        <g onClick={() => handleKeyClick('bis')} style={{ cursor: 'pointer' }}>
          <circle
            cx="140"
            cy="192"
            r="8"
            fill={keyColor('bis')}
            stroke={keyBorder('bis')}
            strokeWidth="2"
          />
          <text x="140" y="195" fill="#fff" fontSize="7" fontWeight="bold" textAnchor="middle">
            BIS
          </text>
        </g>

        {/* Key 2 (A) */}
        <g onClick={() => handleKeyClick('lh2')} style={{ cursor: 'pointer' }}>
          <circle
            cx="140"
            cy="218"
            r="13"
            fill={keyColor('lh2')}
            stroke={keyBorder('lh2')}
            strokeWidth="2.5"
            filter={isKeyActive('lh2') ? 'url(#keyGlow)' : undefined}
          />
          <text x="140" y="222" fill="#fff" fontSize="11" fontWeight="800" textAnchor="middle">
            2
          </text>
        </g>

        {/* Key 3 (G) */}
        <g onClick={() => handleKeyClick('lh3')} style={{ cursor: 'pointer' }}>
          <circle
            cx="140"
            cy="252"
            r="13"
            fill={keyColor('lh3')}
            stroke={keyBorder('lh3')}
            strokeWidth="2.5"
            filter={isKeyActive('lh3') ? 'url(#keyGlow)' : undefined}
          />
          <text x="140" y="256" fill="#fff" fontSize="11" fontWeight="800" textAnchor="middle">
            3
          </text>
        </g>

        {/* G# KEY */}
        <g onClick={() => handleKeyClick('lh_gsharp')} style={{ cursor: 'pointer' }}>
          <rect
            x="96"
            y="245"
            width="22"
            height="14"
            rx="4"
            fill={keyColor('lh_gsharp')}
            stroke={keyBorder('lh_gsharp')}
            strokeWidth="2"
          />
          <text x="107" y="255" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
            G♯
          </text>
        </g>

        {/* LEFT HAND PINKY CLUSTER (Low G#, Low C#, Low B, Low Bb) */}
        <g onClick={() => handleKeyClick('lh_low_csharp')} style={{ cursor: 'pointer' }}>
          <rect
            x="90"
            y="270"
            width="18"
            height="14"
            rx="3"
            fill={keyColor('lh_low_csharp')}
            stroke={keyBorder('lh_low_csharp')}
            strokeWidth="2"
          />
          <text x="99" y="280" fill="#fff" fontSize="7" fontWeight="bold" textAnchor="middle">
            C♯
          </text>
        </g>

        <g onClick={() => handleKeyClick('lh_low_b')} style={{ cursor: 'pointer' }}>
          <rect
            x="90"
            y="288"
            width="18"
            height="14"
            rx="3"
            fill={keyColor('lh_low_b')}
            stroke={keyBorder('lh_low_b')}
            strokeWidth="2"
          />
          <text x="99" y="298" fill="#fff" fontSize="7" fontWeight="bold" textAnchor="middle">
            B
          </text>
        </g>

        <g onClick={() => handleKeyClick('lh_low_bb')} style={{ cursor: 'pointer' }}>
          <rect
            x="90"
            y="306"
            width="18"
            height="14"
            rx="3"
            fill={keyColor('lh_low_bb')}
            stroke={keyBorder('lh_low_bb')}
            strokeWidth="2"
          />
          <text x="99" y="316" fill="#fff" fontSize="7" fontWeight="bold" textAnchor="middle">
            B♭
          </text>
        </g>

        {/* RIGHT HAND MAIN STACK (4, 5, 6) */}
        {/* Key 4 (F) */}
        <g onClick={() => handleKeyClick('rh1')} style={{ cursor: 'pointer' }}>
          <circle
            cx="140"
            cy="340"
            r="13"
            fill={keyColor('rh1')}
            stroke={keyBorder('rh1')}
            strokeWidth="2.5"
            filter={isKeyActive('rh1') ? 'url(#keyGlow)' : undefined}
          />
          <text x="140" y="344" fill="#fff" fontSize="11" fontWeight="800" textAnchor="middle">
            4
          </text>
        </g>

        {/* Key 5 (E) */}
        <g onClick={() => handleKeyClick('rh2')} style={{ cursor: 'pointer' }}>
          <circle
            cx="140"
            cy="374"
            r="13"
            fill={keyColor('rh2')}
            stroke={keyBorder('rh2')}
            strokeWidth="2.5"
            filter={isKeyActive('rh2') ? 'url(#keyGlow)' : undefined}
          />
          <text x="140" y="378" fill="#fff" fontSize="11" fontWeight="800" textAnchor="middle">
            5
          </text>
        </g>

        {/* Key 6 (D) */}
        <g onClick={() => handleKeyClick('rh3')} style={{ cursor: 'pointer' }}>
          <circle
            cx="140"
            cy="408"
            r="13"
            fill={keyColor('rh3')}
            stroke={keyBorder('rh3')}
            strokeWidth="2.5"
            filter={isKeyActive('rh3') ? 'url(#keyGlow)' : undefined}
          />
          <text x="140" y="412" fill="#fff" fontSize="11" fontWeight="800" textAnchor="middle">
            6
          </text>
        </g>

        {/* RIGHT HAND SIDE KEYS (Side E, Side C, Side Bb) */}
        <g onClick={() => handleKeyClick('rh_side_e')} style={{ cursor: 'pointer' }}>
          <path
            d="M 160 325 C 180 320, 180 340, 160 340 Z"
            fill={keyColor('rh_side_e')}
            stroke={keyBorder('rh_side_e')}
            strokeWidth="2"
          />
          <text x="174" y="334" fill="#fff" fontSize="8" fontWeight="bold">
            E
          </text>
        </g>
        <g onClick={() => handleKeyClick('rh_side_c')} style={{ cursor: 'pointer' }}>
          <path
            d="M 160 348 C 180 343, 180 363, 160 363 Z"
            fill={keyColor('rh_side_c')}
            stroke={keyBorder('rh_side_c')}
            strokeWidth="2"
          />
          <text x="174" y="357" fill="#fff" fontSize="8" fontWeight="bold">
            C
          </text>
        </g>
        <g onClick={() => handleKeyClick('rh_side_bb')} style={{ cursor: 'pointer' }}>
          <path
            d="M 160 371 C 180 366, 180 386, 160 386 Z"
            fill={keyColor('rh_side_bb')}
            stroke={keyBorder('rh_side_bb')}
            strokeWidth="2"
          />
          <text x="174" y="380" fill="#fff" fontSize="8" fontWeight="bold">
            B♭
          </text>
        </g>

        {/* RIGHT HAND PINKY CLUSTER (Low C, Low Eb) */}
        <g onClick={() => handleKeyClick('rh_low_eb')} style={{ cursor: 'pointer' }}>
          <rect
            x="162"
            y="420"
            width="20"
            height="15"
            rx="4"
            fill={keyColor('rh_low_eb')}
            stroke={keyBorder('rh_low_eb')}
            strokeWidth="2"
          />
          <text x="172" y="431" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
            E♭
          </text>
        </g>

        <g onClick={() => handleKeyClick('rh_low_c')} style={{ cursor: 'pointer' }}>
          <rect
            x="162"
            y="440"
            width="20"
            height="15"
            rx="4"
            fill={keyColor('rh_low_c')}
            stroke={keyBorder('rh_low_c')}
            strokeWidth="2"
          />
          <text x="172" y="451" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">
            C
          </text>
        </g>
      </svg>

      {/* Label and fingering details */}
      <div
        style={{
          marginTop: 12,
          textAlign: 'center',
          color: '#e4e4e7',
          fontFamily: 'Manrope, sans-serif',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>
          {variantName}
        </div>
        {fingering && (
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
            {fingering.description}
          </div>
        )}
      </div>
    </div>
  );
};
