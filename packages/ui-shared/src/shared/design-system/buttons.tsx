import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavigationDispatcher, useSettingsStore, ACCENT_COLORS, AppKey, SpringPresets } from '@workspace/studio-core';
import { AnimatedIcon } from '../icons/AnimatedIcon';

const isHoverable = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
// ── 1. Button ──────────────────────────────────────────────────────────────
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      icon,
      children,
      style,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const getColors = () => {
      if (variant === 'primary') {
        return {
          bg: 'var(--c-accent-from)',
          text: '#ffffff',
          border: 'transparent',
        };
      }
      if (variant === 'danger') {
        return {
          bg: 'var(--c-error-container)',
          text: 'var(--c-error)',
          border: 'var(--c-error-container)',
        };
      }
      if (variant === 'ghost') {
        return {
          bg: 'transparent',
          text: 'var(--c-text-primary)',
          border: 'transparent',
        };
      }
      return {
        bg: 'var(--c-surface-high)',
        text: 'var(--c-text-primary)',
        border: 'var(--c-border)',
      };
    };

    const colors = getColors();
    const pad = size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 24px' : '10px 18px';
    const fontSize = size === 'sm' ? '11px' : size === 'lg' ? '14px' : '12px';

    return (
      <motion.button
        ref={ref}
        whileTap={disabled || loading ? undefined : { scale: 0.96 }}
        transition={SpringPresets.soft}
        style={{
          padding: pad,
          fontSize,
          fontFamily: 'var(--font-headline)',
          fontWeight: 700,
          borderRadius: 'var(--radius-md)',
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1.5px solid ${colors.border}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          outline: 'none',
          transition: 'background-color 200ms ease, border-color 200ms ease, color 200ms ease',
          ...style,
        }}
        disabled={disabled || loading}
        className={`btn-smooth ${className}`}
        {...(props as any)}
      >
        {loading ? (
          <AnimatedIcon name="loader-circle" state="loading" size={16} />
        ) : icon ? (
          <AnimatedIcon name={icon} size={16} />
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// ── 12. Floating Button ────────────────────────────────────────────────────
export interface FloatingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
}

export function FloatingButton({ icon, style, className = '', ...props }: FloatingButtonProps) {
  return (
    <motion.button
      whileHover={isHoverable ? { scale: 1.06, y: -2 } : undefined}
      whileTap={{ scale: 0.94, y: 0 }}
      transition={SpringPresets.medium}
      style={{
        width: '56px',
        height: '56px',
        borderRadius: 'var(--radius-3xl)',
        backgroundColor: 'var(--c-accent-from)',
        color: '#ffffff',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--elevation-high)',
        cursor: 'pointer',
        outline: 'none',
        ...style,
      }}
      className={`studio-fab ${className}`}
      {...(props as any)}
    >
      <AnimatedIcon name={icon} size={24} />
    </motion.button>
  );
}

export type ActionButtonVariant =
  | 'copy'
  | 'share'
  | 'delete'
  | 'save'
  | 'favorite'
  | 'visibility'
  | 'upload'
  | 'download'
  | 'duplicate'
  | 'refresh'
  | 'export'
  | 'import'
  | 'edit';

export interface ActionButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onDragOver' | 'onAnimationStart'
> {
  variant: ActionButtonVariant;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<boolean | void> | boolean | void;
  isFavorite?: boolean;
  isVisible?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  label?: string;
  iconSize?: number;
  children?: React.ReactNode;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant,
  onClick,
  isFavorite = false,
  isVisible = true,
  isLoading = false,
  isDisabled = false,
  label,
  iconSize = 20,
  children,
  style,
  className = '',
  ...props
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  // Reset success state after a delay
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (success) {
      timer = setTimeout(() => {
        setSuccess(false);
      }, 2000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [success]);

  // Reset delete confirmation after a delay if not confirmed
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (confirmingDelete) {
      timer = setTimeout(() => {
        setConfirmingDelete(false);
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [confirmingDelete]);

  const activeLoading = isLoading || internalLoading;
  const isButtonDisabled = isDisabled || activeLoading;

  const handleTap = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isButtonDisabled) return;

    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rippleId = Date.now();
    setRipples((prev) => [...prev, { id: rippleId, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== rippleId));
    }, 600);

    // Destructive delete flow safety check
    if (variant === 'delete' && !confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    if (onClick) {
      try {
        setInternalLoading(true);
        const result = await onClick(e);
        setInternalLoading(false);

        // Success animation trigger
        if (result !== false) {
          setSuccess(true);
          if (variant === 'delete') {
            setConfirmingDelete(false);
          }
        }
      } catch (err) {
        setInternalLoading(false);
        console.error('ActionButton failed execution:', err);
      }
    } else {
      // Dummy action support for local transitions
      setSuccess(true);
    }
  };

  // Get icon based on state/variant
  const getIconName = (): string => {
    if (success) {
      return variant === 'delete' ? 'delete_forever' : 'check';
    }
    if (activeLoading) return 'progress_activity';

    switch (variant) {
      case 'copy':
        return 'content_copy';
      case 'share':
        return 'share';
      case 'delete':
        return confirmingDelete ? 'warning' : 'delete';
      case 'save':
        return 'save';
      case 'favorite':
        return isFavorite ? 'star' : 'star_outline';
      case 'visibility':
        return isVisible ? 'visibility' : 'visibility_off';
      case 'upload':
        return 'upload';
      case 'download':
        return 'download';
      case 'duplicate':
        return 'content_copy';
      case 'refresh':
        return 'refresh';
      case 'export':
        return 'output';
      case 'import':
        return 'publish';
      case 'edit':
        return 'edit';
      default:
        return 'smart_button';
    }
  };

  // Get accessible labels
  const getAriaLabel = (): string => {
    if (label) return label;
    switch (variant) {
      case 'copy':
        return success ? 'Copied successfully' : 'Copy contents';
      case 'share':
        return 'Share diagnostics or information';
      case 'delete':
        return confirmingDelete ? 'Confirm delete' : 'Delete item';
      case 'save':
        return 'Save current work';
      case 'favorite':
        return isFavorite ? 'Remove from favorites' : 'Add to favorites';
      case 'visibility':
        return isVisible ? 'Hide content' : 'Show content';
      case 'edit':
        return 'Edit name or properties';
      default:
        return `${variant} action button`;
    }
  };

  // Spring transition presets
  const springTransition = { type: 'spring' as const, stiffness: 350, damping: 18, mass: 0.8 };

  // Color matching variants
  const getButtonStyles = () => {
    let bg = 'rgba(255, 255, 255, 0.05)';
    let border = '1px solid rgba(255, 255, 255, 0.08)';
    let color = 'var(--c-text-primary, #ffffff)';
    const shadow = '0 2px 8px rgba(0,0,0,0.15)';

    if (variant === 'delete') {
      if (confirmingDelete) {
        bg = 'rgba(239, 68, 68, 0.2)';
        border = '1px solid rgb(239, 68, 68)';
        color = 'rgb(248, 113, 113)';
      } else if (success) {
        bg = 'rgba(16, 185, 129, 0.15)';
        border = '1px solid rgb(16, 185, 129)';
        color = 'rgb(52, 211, 153)';
      }
    } else if (success) {
      bg = 'rgba(16, 185, 129, 0.15)';
      border = '1px solid rgb(16, 185, 129)';
      color = 'rgb(52, 211, 153)';
    }

    return { bg, border, color, shadow };
  };

  const { bg, border, color, shadow } = getButtonStyles();

  // Custom morph rotations/scales per variant
  const getIconAnimationProps = (): any => {
    if (success) {
      return {
        initial: { scale: 0.4, rotate: -45, opacity: 0 },
        animate: { scale: 1, rotate: 0, opacity: 1 },
        exit: { scale: 0.4, rotate: 45, opacity: 0 },
        transition: springTransition,
      };
    }

    switch (variant) {
      case 'refresh':
        return {
          animate: activeLoading ? { rotate: 360 } : { rotate: 0 },
          transition: activeLoading
            ? { repeat: Infinity, duration: 1, ease: 'linear' as const }
            : springTransition,
        };
      case 'visibility':
        return {
          initial: { scale: 0.8, opacity: 0.5 },
          animate: { scale: 1, opacity: 1, rotate: isVisible ? 0 : 180 },
          transition: springTransition,
        };
      case 'edit':
        return {
          whileHover: { rotate: [0, -10, 10, -10, 0], transition: { duration: 0.4 } },
        };
      case 'favorite':
        return {
          animate: { scale: isFavorite ? [1, 1.3, 1] : 1 },
          transition: springTransition,
        };
      case 'upload':
        return {
          whileHover: { y: -2, transition: springTransition },
        };
      case 'download':
        return {
          whileHover: { y: 2, transition: springTransition },
        };
      default:
        return {};
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleTap}
      disabled={isButtonDisabled}
      aria-label={getAriaLabel()}
      whileHover={
        isButtonDisabled ? {} : { scale: 1.05, boxShadow: '0 6px 16px rgba(0,0,0,0.25)', y: -1 }
      }
      whileTap={isButtonDisabled ? {} : { scale: 0.95 }}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        border: border,
        color: color,
        borderRadius: '12px',
        padding: '8px 12px',
        cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
        outline: 'none',
        overflow: 'hidden',
        boxShadow: shadow,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
        fontSize: '13px',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        opacity: isDisabled ? 0.5 : 1,
        transition:
          'background 250ms ease, border-color 250ms ease, color 250ms ease, opacity 250ms ease',
        ...style,
      }}
      className={`action-btn-root ${className}`}
      {...props}
    >
      {/* Ripple render */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            transform: 'translate(-50%, -50%) scale(5)',
            transformOrigin: 'center',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'transform 450ms cubic-bezier(0.1, 0.8, 0.3, 1), opacity 450ms ease-out',
          }}
          ref={(el) => {
            if (el) {
              requestAnimationFrame(() => {
                el.style.transform = 'translate(-50%, -50%) scale(12)';
                el.style.opacity = '1';
                setTimeout(() => {
                  el.style.opacity = '0';
                }, 100);
              });
            }
          }}
        />
      ))}

      {/* Animated Icon morph */}
      <AnimatePresence mode="wait" initial={false}>
        <AnimatedIcon
          key={getIconName()}
          name={getIconName()}
          size={iconSize}
          state={success ? 'success' : activeLoading ? 'loading' : 'inactive'}
          color="currentColor"
        />
      </AnimatePresence>

      {children && <span style={{ marginLeft: '8px', lineHeight: 1 }}>{children}</span>}
    </motion.button>
  );
};

ActionButton.displayName = 'ActionButton';
