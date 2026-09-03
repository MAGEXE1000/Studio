import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { StageLibraryItem } from '../types';
import { STAGEX_LIBRARY, STAGEX_ICON_MAP } from '../constants';

export interface StageElementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectElement: (item: StageLibraryItem) => void;
  isLight: boolean;
  isAmoled: boolean;
  accent: { from: string; to: string };
}

interface DrawerCategory {
  key: string;
  label: string;
  icon: string;
}

const CATEGORIES: DrawerCategory[] = [
  { key: 'all', label: 'All', icon: 'apps' },
  { key: 'mics', label: 'Mics', icon: 'mic' },
  { key: 'inst', label: 'Instruments', icon: 'electric_bolt' },
  { key: 'drums', label: 'Drums', icon: 'music_note' },
  { key: 'amps', label: 'Amps', icon: 'speaker' },
  { key: 'mon', label: 'Monitors', icon: 'volume_up' },
  { key: 'util', label: 'DI & Gear', icon: 'settings_input_component' },
  { key: 'people', label: 'People', icon: 'person' },
];

export const StageElementDrawer: React.FC<StageElementDrawerProps> = ({
  isOpen,
  onClose,
  onSelectElement,
  isLight,
  isAmoled,
  accent,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  // Scroll element list back to start when category changes
  useEffect(() => {
    if (itemsContainerRef.current) {
      itemsContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [activeCategory]);

  // Flattened elements for "All" or selected category items
  const activeItems = useMemo(() => {
    if (activeCategory === 'all') {
      const all: StageLibraryItem[] = [];
      Object.keys(STAGEX_LIBRARY).forEach((catKey) => {
        all.push(...(STAGEX_LIBRARY[catKey] || []));
      });
      return all;
    }
    return STAGEX_LIBRARY[activeCategory] || [];
  }, [activeCategory]);

  const renderIcon = (item: StageLibraryItem) => {
    const iconPath = STAGEX_ICON_MAP[item.icon as keyof typeof STAGEX_ICON_MAP] || item.icon;
    if (
      iconPath &&
      (iconPath.endsWith('.png') || iconPath.endsWith('.webp') || iconPath.endsWith('.svg'))
    ) {
      return (
        <img
          src={iconPath}
          alt={item.name}
          className="w-6 h-6 object-contain pointer-events-none"
          style={{
            filter: isLight ? undefined : 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
          }}
        />
      );
    }
    return (
      <span className="material-symbols-outlined text-[22px]">{item.icon || 'music_note'}</span>
    );
  };

  return (
    <>
      {/* Tap Outside Backdrop */}
      {isOpen && (
        <div
          data-testid="stagex-drawer-backdrop"
          className="fixed inset-0 z-30"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Floating Bottom Drawer */}
      <div
        data-testid="stagex-element-drawer"
        role="region"
        aria-label="Stage Element Catalog"
        className="fixed z-40 flex flex-col pointer-events-auto"
        style={{
          bottom: 'calc(var(--content-bottom-pad, 88px) + env(safe-area-inset-bottom, 0px) + 8px)',
          left: '12px',
          right: 'calc(max(16px, env(safe-area-inset-right, 0px)) + 54px)',
          maxWidth: '520px',
          background: isAmoled
            ? 'rgba(12, 12, 16, 0.90)'
            : isLight
              ? 'rgba(255, 255, 255, 0.92)'
              : 'rgba(20, 20, 26, 0.88)',
          border: isAmoled
            ? '1px solid rgba(255, 255, 255, 0.12)'
            : isLight
              ? '1px solid rgba(0, 0, 0, 0.08)'
              : '1px solid rgba(255, 255, 255, 0.10)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
          borderRadius: '20px',
          padding: '8px 10px 10px 10px',
          pointerEvents: isOpen ? 'auto' : 'none',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0px) scale(1)' : 'translateY(12px) scale(0.97)',
          transition:
            'opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Category Horizontal Selector */}
        <div
          data-testid="drawer-categories-row"
          className="flex items-center gap-1.5 overflow-x-auto pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                data-testid={`drawer-cat-${cat.key}`}
                onClick={() => setActiveCategory(cat.key)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 transition-all active:scale-95 cursor-pointer"
                style={{
                  background: isActive
                    ? isLight
                      ? '#09090b'
                      : '#ffffff'
                    : isLight
                      ? 'rgba(0, 0, 0, 0.05)'
                      : 'rgba(255, 255, 255, 0.06)',
                  color: isActive
                    ? isLight
                      ? '#ffffff'
                      : '#09090b'
                    : isLight
                      ? '#52525b'
                      : '#a1a1aa',
                  border: isActive
                    ? isLight
                      ? '1px solid #09090b'
                      : '1px solid #ffffff'
                    : '1px solid transparent',
                  fontWeight: isActive ? 700 : 600,
                }}
              >
                <span className="material-symbols-outlined text-[15px]">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Elements Horizontal Scrolling Shelf */}
        <div
          ref={itemsContainerRef}
          data-testid="drawer-elements-row"
          className="flex items-center gap-2 overflow-x-auto pt-1"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {activeItems.map((item, idx) => (
            <button
              key={`${item.name}-${idx}`}
              type="button"
              data-testid={`drawer-item-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => {
                onSelectElement(item);
                onClose();
              }}
              className="flex flex-col items-center justify-center p-1.5 rounded-xl transition-all active:scale-95 flex-shrink-0 cursor-pointer"
              style={{
                width: '66px',
                height: '66px',
                background: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.05)',
                border: isLight
                  ? '1px solid rgba(0, 0, 0, 0.07)'
                  : '1px solid rgba(255, 255, 255, 0.07)',
                color: isLight ? '#09090b' : '#ffffff',
              }}
              title={`Add ${item.name}`}
            >
              <div className="w-6 h-6 flex items-center justify-center mb-1">
                {renderIcon(item)}
              </div>
              <span
                className="text-[9.5px] font-medium text-center w-full truncate px-0.5"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  color: isLight ? '#27272a' : '#d4d4d8',
                }}
              >
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
