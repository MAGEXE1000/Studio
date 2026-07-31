import { type Theme } from '@workspace/studio-core';
import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Sun, Moon, SunMoon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type TransitionVariant =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'diamond'
  | 'hexagon'
  | 'rectangle'
  | 'star';

export interface StudioThemeTogglerProps {
  currentTheme: Theme;
  currentAmoled: boolean;
  accentFrom: string;
  onChange: (theme: Theme, amoledMode: boolean) => void;
  labels?: any;
  variant?: TransitionVariant;
  duration?: number;
}

export default function StudioThemeToggler({
  currentTheme,
  currentAmoled,
  accentFrom,
  onChange,
  variant = 'circle',
  duration = 500,
}: StudioThemeTogglerProps) {
  // Determine current mode: 'white' | 'dark' | 'amoled'
  const mode = currentAmoled
    ? 'amoled'
    : currentTheme === 'dark'
    ? 'dark'
    : 'white';

  const getNextMode = (): { theme: Theme; amoled: boolean } => {
    if (mode === 'white') return { theme: 'dark', amoled: false };
    if (mode === 'dark') return { theme: 'dark', amoled: true };
    return { theme: 'light', amoled: false };
  };

  const handleToggle = useCallback((btn: HTMLButtonElement) => {
    const next = getNextMode();
    const root = document.documentElement;
    const isTransitioning = root.dataset.studioThemeVt === 'active';
    if (isTransitioning) return;

    if (!document.startViewTransition) {
      onChange(next.theme, next.amoled);
      return;
    }

    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    let clipFrom = `circle(0px at ${x}px ${y}px)`;
    let clipTo = `circle(${endRadius}px at ${x}px ${y}px)`;

    if (variant === 'square' || variant === 'rectangle') {
      clipFrom = `inset(${y}px ${window.innerWidth - x}px ${window.innerHeight - y}px ${x}px)`;
      clipTo = `inset(0px 0px 0px 0px)`;
    } else if (variant === 'diamond') {
      clipFrom = `polygon(${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px)`;
      clipTo = `polygon(50% -50%, 150% 50%, 50% 150%, -50% 50%)`;
    }

    root.dataset.studioThemeVt = 'active';
    root.style.setProperty('--studio-theme-vt-duration', `${duration}ms`);
    root.style.setProperty('--studio-theme-vt-clip-from', clipFrom);

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        onChange(next.theme, next.amoled);
      });
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        [
          { clipPath: clipFrom },
          { clipPath: clipTo },
        ],
        {
          duration,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });

    transition.finished.finally(() => {
      delete root.dataset.studioThemeVt;
      root.style.removeProperty('--studio-theme-vt-duration');
      root.style.removeProperty('--studio-theme-vt-clip-from');
    });
  }, [mode, onChange, variant, duration]);

  const IconComponent = mode === 'white' ? Sun : mode === 'dark' ? Moon : SunMoon;
  const labelText = mode === 'white' ? 'White Theme' : mode === 'dark' ? 'Dark Theme' : 'AMOLED Theme';

  return (
    <button
      type="button"
      className="btn-smooth"
      onClick={(e) => handleToggle(e.currentTarget)}
      title={`Current: ${labelText}. Click to toggle.`}
      aria-label={`Current: ${labelText}. Click to toggle theme.`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 42,
        height: 42,
        borderRadius: '50%',
        background: `color-mix(in srgb, ${accentFrom} 15%, var(--app-surface-high, rgba(255,255,255,0.08)))`,
        border: `1.5px solid color-mix(in srgb, ${accentFrom} 40%, transparent)`,
        color: accentFrom,
        cursor: 'pointer',
        boxShadow: `0 2px 12px color-mix(in srgb, ${accentFrom} 25%, transparent)`,
        transition: 'all 240ms cubic-bezier(0.34,1.56,0.64,1)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.28, ease: 'backOut' }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <IconComponent size={22} strokeWidth={2.2} />
        </motion.div>
      </AnimatePresence>
    </button>
  );
}

