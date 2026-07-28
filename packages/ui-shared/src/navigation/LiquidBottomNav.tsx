import React from 'react';
import { motion } from 'motion/react';
import { AnimatedIcon } from '../components/icons/AnimatedIcon';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
}

export interface LiquidBottomNavProps {
  items: NavItem[];
  activeId: string;
  onItemSelect: (item: NavItem) => void;
  accentColor?: string;
  isProfileOpen?: boolean;
}

export const LiquidBottomNav: React.FC<LiquidBottomNavProps> = ({
  items,
  activeId,
  onItemSelect,
  accentColor = '#f59e0b',
  isProfileOpen = false,
}) => {
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId || (item.id === 'profile' && isProfileOpen))
  );

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(18, 18, 22, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 28,
        padding: '6px 10px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.55), 0 2px 10px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: 420,
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Morphing Liquid Active Pill Background */}
      <motion.div
        layoutId="liquidActiveNavPill"
        style={{
          position: 'absolute',
          top: 6,
          bottom: 6,
          left: 10,
          width: `calc((100% - 20px) / ${items.length})`,
          borderRadius: 22,
          background: `linear-gradient(135deg, ${accentColor}25, ${accentColor}40)`,
          border: `1px solid ${accentColor}60`,
          boxShadow: `0 4px 16px ${accentColor}30`,
          zIndex: 0,
        }}
        animate={{
          x: `${activeIndex * 100}%`,
        }}
        transition={{
          type: 'spring',
          stiffness: 450,
          damping: 32,
        }}
      />

      {/* Nav Item Buttons with Bakai Animated Icons */}
      {items.map((item) => {
        const isActive = activeId === item.id || (item.id === 'profile' && isProfileOpen);

        return (
          <button
            key={item.id}
            onClick={() => onItemSelect(item)}
            style={{
              position: 'relative',
              zIndex: 1,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 0',
              border: 'none',
              background: 'transparent',
              color: isActive ? accentColor : '#a1a1aa',
              cursor: 'pointer',
              outline: 'none',
              transition: 'color 0.2s ease',
            }}
          >
            <AnimatedIcon
              name={item.icon || 'info'}
              size={22}
              color={isActive ? accentColor : '#a1a1aa'}
              state={isActive ? 'active' : 'inactive'}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 800 : 600,
                marginTop: 3,
                letterSpacing: '-0.01em',
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
