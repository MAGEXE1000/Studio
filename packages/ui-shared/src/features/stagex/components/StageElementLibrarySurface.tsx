import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { StageLibraryItem } from '../types';
import { STAGEX_LIBRARY, STAGEX_ICON_MAP } from '../constants';

export interface StageElementLibrarySurfaceProps {
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

export const StageElementLibrarySurface: React.FC<StageElementLibrarySurfaceProps> = ({
  onClose,
  onSelectElement,
  isLight,
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
          className="w-7 h-7 object-contain pointer-events-none"
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
    <div
      data-testid="stagex-element-library-surface"
      className="flex flex-col w-full"
      style={{
        transition: 'opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Header: Category Horizontal Selector + Close Button */}
      <div className="flex items-center justify-between gap-2 pb-2">
        <div
          data-testid="drawer-categories-row"
          className="flex items-center gap-1.5 overflow-x-auto min-w-0 flex-1 py-0.5"
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
                    : isLight
                      ? '1px solid rgba(0, 0, 0, 0.04)'
                      : '1px solid rgba(255, 255, 255, 0.04)',
                  fontWeight: isActive ? 700 : 600,
                }}
              >
                <span className="material-symbols-outlined text-[15px]">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dedicated Close Button */}
        <button
          type="button"
          data-testid="stagex-drawer-close-btn"
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer active:scale-90 transition-all"
          style={{
            background: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
            color: isLight ? '#52525b' : '#a1a1aa',
            border: isLight
              ? '1px solid rgba(0, 0, 0, 0.06)'
              : '1px solid rgba(255, 255, 255, 0.08)',
          }}
          aria-label="Close Element Drawer"
          title="Close"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>

      {/* Elements Horizontal Scrolling Shelf */}
      <div
        ref={itemsContainerRef}
        data-testid="drawer-elements-row"
        className="flex items-center gap-2 overflow-x-auto pt-0.5"
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
            className="flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all active:scale-95 flex-shrink-0 cursor-pointer group"
            style={{
              width: '74px',
              height: '74px',
              background: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
              border: isLight
                ? '1px solid rgba(0, 0, 0, 0.07)'
                : '1px solid rgba(255, 255, 255, 0.07)',
              color: isLight ? '#09090b' : '#ffffff',
            }}
            title={`Add ${item.name}`}
          >
            <div className="w-7 h-7 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105">
              {renderIcon(item)}
            </div>
            <span
              className="text-[9.5px] font-semibold text-center w-full truncate px-0.5 leading-tight"
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
  );
};
