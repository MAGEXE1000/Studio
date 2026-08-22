import React, { useState, useEffect } from 'react';

export interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  scale: number;
  radius: number;
  safeTop: number;
  safeBottom: number;
}

export const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: 'standard',
    name: 'iPhone 15 / Standard (393 × 852)',
    width: 393,
    height: 852,
    scale: 1,
    radius: 48,
    safeTop: 54,
    safeBottom: 34,
  },
  {
    id: 'pixel',
    name: 'Pixel 8 / Android (412 × 915)',
    width: 412,
    height: 915,
    scale: 1,
    radius: 44,
    safeTop: 48,
    safeBottom: 28,
  },
  {
    id: 'compact',
    name: 'Compact Phone (360 × 780)',
    width: 360,
    height: 780,
    scale: 1,
    radius: 36,
    safeTop: 40,
    safeBottom: 24,
  },
  {
    id: 'full',
    name: 'Full Responsive (100% Window)',
    width: 0,
    height: 0,
    scale: 1,
    radius: 0,
    safeTop: 0,
    safeBottom: 0,
  },
];

export function MobileDevicePreviewFrame({ children }: { children: React.ReactNode }) {
  // Check if preview frame is disabled via URL query param (?frame=0 or ?frame=off)
  const isFrameDisabledByUrl =
    typeof window !== 'undefined' &&
    (window.location.search.includes('frame=0') || window.location.search.includes('frame=off'));

  const [presetId, setPresetId] = useState<string>(() => {
    if (isFrameDisabledByUrl) return 'full';
    if (typeof window !== 'undefined' && window.innerWidth < 600) return 'full';
    return 'standard';
  });

  const [currentTime, setCurrentTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const activePreset = DEVICE_PRESETS.find((p) => p.id === presetId) || DEVICE_PRESETS[0];

  // If in full responsive mode (or on a real phone viewport), render without frame
  if (activePreset.id === 'full' || isFrameDisabledByUrl) {
    return (
      <div className="w-full h-full relative overflow-hidden bg-black text-white">{children}</div>
    );
  }

  return (
    <div
      className="w-screen h-screen flex flex-col items-center justify-center select-none overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #1a1c23 0%, #0d0e12 100%)',
        color: '#e2e8f0',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Top Preview Controls Toolbar */}
      <header
        className="w-full max-w-4xl px-4 py-2 mb-2 flex items-center justify-between z-50 rounded-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-zinc-200">
            STUDIO MOBILE WEB PREVIEW
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
            HMR ACTIVE
          </span>
        </div>

        {/* Viewport Preset Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-zinc-400 mr-1 hidden sm:inline">Viewport:</span>
          {DEVICE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setPresetId(preset.id)}
              className="text-[11px] px-2.5 py-1 rounded-lg transition-all"
              style={{
                background:
                  presetId === preset.id
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(255, 255, 255, 0.03)',
                color: presetId === preset.id ? '#ffffff' : '#94a3b8',
                border:
                  presetId === preset.id
                    ? '1px solid rgba(255, 255, 255, 0.3)'
                    : '1px solid transparent',
                fontWeight: presetId === preset.id ? 600 : 400,
              }}
            >
              {preset.id === 'standard' && 'iPhone 15'}
              {preset.id === 'pixel' && 'Pixel 8'}
              {preset.id === 'compact' && 'Compact'}
              {preset.id === 'full' && 'Responsive'}
            </button>
          ))}
        </div>
      </header>

      {/* Realistic Phone Device Frame Container */}
      <div
        className="relative flex flex-col items-center transition-all duration-300 ease-out"
        style={{
          width: `${activePreset.width}px`,
          height: `${activePreset.height}px`,
          maxHeight: 'calc(100vh - 70px)',
          borderRadius: `${activePreset.radius}px`,
          boxShadow:
            '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 0 12px #18191f, 0 0 0 14px #2b2d38, 0 0 40px rgba(0, 0, 0, 0.6)',
          background: '#000000',
          overflow: 'hidden',
        }}
      >
        {/* Hardware Notch / Island */}
        <div
          className="absolute top-2.5 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center justify-center"
          style={{
            width: '120px',
            height: '28px',
            borderRadius: '20px',
            background: '#000000',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Camera lens indicator */}
          <div className="w-3 h-3 rounded-full bg-[#0a0a0f] border border-zinc-800/80 mr-2 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-blue-900/60" />
          </div>
          {/* Sensor */}
          <div className="w-2 h-2 rounded-full bg-[#111116]" />
        </div>

        {/* Simulated Native Status Bar */}
        <div
          className="absolute top-0 left-0 right-0 z-40 px-7 flex items-center justify-between pointer-events-none text-xs font-semibold text-white/90"
          style={{ height: `${activePreset.safeTop}px` }}
        >
          <span className="text-[13px] tracking-tight pl-1">{currentTime}</span>
          <div className="flex items-center gap-1.5 pr-1">
            {/* Cellular signal */}
            <svg className="w-3.5 h-3.5 fill-current opacity-80" viewBox="0 0 24 24">
              <path
                d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z"
                opacity="0.3"
              />
              <path d="M2 22h20L12 2 2 22z" />
            </svg>
            {/* Wi-Fi */}
            <svg className="w-3.5 h-3.5 fill-current opacity-80" viewBox="0 0 24 24">
              <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3.5c3.73 0 7.12 1.48 9.64 3.88L12 19.3 2.36 11.38C4.88 8.98 8.27 7.5 12 7.5z" />
            </svg>
            {/* Battery */}
            <div className="w-5 h-2.5 rounded-sm border border-white/70 p-0.5 flex items-center">
              <div className="w-3 h-full bg-white rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Application Content Inside Viewport */}
        <main className="w-full h-full relative overflow-hidden bg-black flex-1 flex flex-col">
          {children}
        </main>

        {/* Simulated Home Indicator Bar */}
        <div
          className="absolute bottom-1 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex items-center justify-center"
          style={{ height: `${activePreset.safeBottom}px`, width: '100%' }}
        >
          <div
            style={{
              width: '135px',
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255, 255, 255, 0.45)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
