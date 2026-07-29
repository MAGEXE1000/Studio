import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AnimatedNavigationIcon } from './AnimatedNavigationIcon';
import { NavigationAnimationProvider } from './NavigationAnimationProvider';

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
  const [prevIndex, setPrevIndex] = useState(0);

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId || (item.id === 'profile' && isProfileOpen))
  );

  const handleSelect = (item: NavItem, idx: number) => {
    setPrevIndex(activeIndex);
    onItemSelect(item);
  };

  return (
    <NavigationAnimationProvider activeTab={activeId}>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(18, 18, 22, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
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
        {/* Morphing & Velocity-Stretching Liquid Active Pill Background */}
        <motion.div
          layoutId="liquidActiveNavPill"
          style={{
            position: 'absolute',
            top: 6,
            bottom: 6,
            left: 10,
            width: `calc((100% - 20px) / ${items.length})`,
            borderRadius: 22,
            background: `linear-gradient(135deg, ${accentColor}28, ${accentColor}45)`,
            border: `1.2px solid ${accentColor}70`,
            boxShadow: `0 4px 18px ${accentColor}35`,
            zIndex: 0,
          }}
          animate={{
            x: `${activeIndex * 100}%`,
            scaleX: [1, 1.15, 0.96, 1], // Physical stretch during slide velocity
          }}
          transition={{
            type: 'spring',
            stiffness: 480,
            damping: 30,
            mass: 0.8,
          }}
        />

        {/* Nav Item Buttons with Physical Reactive Bakai Icons & Label Springs */}
        {items.map((item, idx) => {
          const isActive = activeId === item.id || (item.id === 'profile' && isProfileOpen);

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item, idx)}
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
                transition: 'color 0.22s ease',
              }}
            >
              {/* Reactive Icon with synchronized spring motion */}
              <AnimatedNavigationIcon
                itemKey={item.id}
                iconName={item.icon || 'info'}
                size={22}
                color={isActive ? accentColor : '#a1a1aa'}
                isActive={isActive}
              />

              {/* Synchronized Label Slide & Fade */}
              <motion.span
                animate={{
                  y: isActive ? -1 : 0,
                  opacity: isActive ? 1 : 0.7,
                  scale: isActive ? 1.05 : 1,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 25,
                }}
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 800 : 600,
                  marginTop: 3,
                  letterSpacing: '-0.01em',
                }}
              >
                {item.label}
              </motion.span>
            </button>
          );
        })}
      </div>
    </NavigationAnimationProvider>
  );
};
