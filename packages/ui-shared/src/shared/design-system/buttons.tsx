import React, { useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { NavigationDispatcher, useSettingsStore, ACCENT_COLORS, AppKey, SpringPresets } from '@workspace/studio-core';
import { AnimatedIcon } from '../icons/AnimatedIcon';
import { EASE_OUT, SPRING_PRESS } from '../../lib/ease';
import { useHoverCapable } from '../../lib/hooks/use-hover-capable';

type Ripple = { id: number; x: number; y: number; size: number };

// ── 1. Button ──────────────────────────────────────────────────────────────
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: string;
  ripple?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      icon,
      ripple = false,
      children,
      style,
      className = '',
      disabled,
      onPointerDown,
      ...props
    },
    ref
  ) => {
    const reduce = useReducedMotion();
    const canHover = useHoverCapable();
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const nextId = useRef(0);

    const handlePointerDown = useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        if (ripple && !reduce && !disabled && !loading) {
          const rect = event.currentTarget.getBoundingClientRect();
          const sizeVal = Math.max(rect.width, rect.height) * 2;
          const id = nextId.current++;
          setRipples((prev) => [
            ...prev,
            {
              id,
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
              size: sizeVal,
            },
          ]);
        }
        onPointerDown?.(event);
      },
      [ripple, reduce, disabled, loading, onPointerDown]
    );

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
      if (variant === 'outline') {
        return {
          bg: 'transparent',
          text: 'var(--c-text-primary)',
          border: 'var(--c-border)',
        };
      }
      return {
        bg: 'var(--c-surface-high)',
        text: 'var(--c-text-primary)',
        border: 'var(--c-border)',
      };
    };

    const colors = getColors();

    // Size mappings matching BeUI standards
    const getPaddingAndHeight = () => {
      if (size === 'icon') {
        return {
          height: '32px',
          width: '32px',
          padding: '0',
          fontSize: '12px',
          borderRadius: '8px',
        };
      }
      if (size === 'sm') {
        return {
          height: '32px',
          padding: '0 14px',
          fontSize: '11px',
          borderRadius: '24px',
        };
      }
      if (size === 'lg') {
        return {
          height: '48px',
          padding: '0 24px',
          fontSize: '15px',
          borderRadius: '24px',
        };
      }
      return {
        height: '40px',
        padding: '0 18px',
        fontSize: '13px',
        borderRadius: '24px',
      };
    };

    const dims = getPaddingAndHeight();

    return (
      <motion.button
        ref={ref}
        type="button"
        whileTap={disabled || loading || reduce ? undefined : { scale: 0.93 }}
        whileHover={disabled || loading || reduce || !canHover ? undefined : { scale: 1.02 }}
        transition={SPRING_PRESS}
        onPointerDown={handlePointerDown}
        style={{
          height: dims.height,
          width: (dims as any).width,
          padding: dims.padding,
          fontSize: dims.fontSize,
          borderRadius: dims.borderRadius,
          fontFamily: 'var(--font-headline, Manrope, sans-serif)',
          fontWeight: 700,
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
          boxSizing: 'border-box',
          position: 'relative',
          overflow: ripple && !reduce ? 'hidden' : 'visible',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          transition: 'background-color 200ms ease, border-color 200ms ease, color 200ms ease',
          ...style,
        }}
        disabled={disabled || loading}
        className={`btn-smooth ${className}`}
        {...(props as any)}
      >
        {ripple && !reduce ? (
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <AnimatePresence>
              {ripples.map((r) => (
                <motion.span
                  key={r.id}
                  className="absolute rounded-full bg-current"
                  style={{
                    left: r.x,
                    top: r.y,
                    width: r.size,
                    height: r.size,
                    x: '-50%',
                    y: '-50%',
                  }}
                  initial={{ scale: 0.05, opacity: 0.25 }}
                  animate={{ scale: 1, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: EASE_OUT }}
                  onAnimationComplete={() =>
                    setRipples((prev) => prev.filter((x) => x.id !== r.id))
                  }
                />
              ))}
            </AnimatePresence>
          </span>
        ) : null}

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

// ── 2. Floating Button ────────────────────────────────────────────────────
export interface FloatingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
}

export function FloatingButton({ icon, style, className = '', ...props }: FloatingButtonProps) {
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();

  return (
    <motion.button
      whileHover={reduce || !canHover ? undefined : { scale: 1.02, y: -1 }}
      whileTap={reduce ? undefined : { scale: 0.93, y: 0 }}
      transition={SPRING_PRESS}
      style={{
        width: '56px',
        height: '56px',
        borderRadius: 'var(--radius-3xl, 24px)',
        backgroundColor: 'var(--c-accent-from)',
        color: '#ffffff',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--elevation-high, 0 8px 32px rgba(0, 0, 0, 0.25))',
        cursor: 'pointer',
        outline: 'none',
        boxSizing: 'border-box',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      className={`studio-fab ${className}`}
      {...(props as any)}
    >
      <AnimatedIcon name={icon} size={24} />
    </motion.button>
  );
}

// ── 3. Action Button ──────────────────────────────────────────────────────
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
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();

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

  return (
    <motion.button
      type="button"
      onClick={handleTap}
      disabled={isButtonDisabled}
      aria-label={getAriaLabel()}
      whileHover={
        isButtonDisabled || reduce || !canHover
          ? undefined
          : { scale: 1.02, boxShadow: '0 6px 16px rgba(0,0,0,0.25)', y: -1 }
      }
      whileTap={isButtonDisabled || reduce ? undefined : { scale: 0.93 }}
      transition={SPRING_PRESS}
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

// ── 4. ButtonLink ──────────────────────────────────────────────────────────
export interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: string;
}

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      icon,
      children,
      style,
      className = '',
      ...props
    },
    ref
  ) => {
    const reduce = useReducedMotion();
    const canHover = useHoverCapable();

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
      if (variant === 'outline') {
        return {
          bg: 'transparent',
          text: 'var(--c-text-primary)',
          border: 'var(--c-border)',
        };
      }
      return {
        bg: 'var(--c-surface-high)',
        text: 'var(--c-text-primary)',
        border: 'var(--c-border)',
      };
    };

    const colors = getColors();

    const getPaddingAndHeight = () => {
      if (size === 'icon') {
        return {
          height: '32px',
          width: '32px',
          padding: '0',
          fontSize: '12px',
          borderRadius: '8px',
        };
      }
      if (size === 'sm') {
        return {
          height: '32px',
          padding: '0 14px',
          fontSize: '11px',
          borderRadius: '24px',
        };
      }
      if (size === 'lg') {
        return {
          height: '48px',
          padding: '0 24px',
          fontSize: '15px',
          borderRadius: '24px',
        };
      }
      return {
        height: '40px',
        padding: '0 18px',
        fontSize: '13px',
        borderRadius: '24px',
      };
    };

    const dims = getPaddingAndHeight();

    return (
      <motion.a
        ref={ref}
        whileTap={reduce ? undefined : { scale: 0.93 }}
        whileHover={reduce || !canHover ? undefined : { scale: 1.02 }}
        transition={SPRING_PRESS}
        style={{
          height: dims.height,
          width: (dims as any).width,
          padding: dims.padding,
          fontSize: dims.fontSize,
          borderRadius: dims.borderRadius,
          fontFamily: 'var(--font-headline, Manrope, sans-serif)',
          fontWeight: 700,
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1.5px solid ${colors.border}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          cursor: 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          position: 'relative',
          userSelect: 'none',
          textDecoration: 'none',
          WebkitTapHighlightColor: 'transparent',
          transition: 'background-color 200ms ease, border-color 200ms ease, color 200ms ease',
          ...style,
        }}
        className={`btn-smooth ${className}`}
        {...(props as any)}
      >
        {icon && <AnimatedIcon name={icon} size={16} />}
        {children}
      </motion.a>
    );
  }
);

ButtonLink.displayName = 'ButtonLink';

// ── 5. StatefulButton ──────────────────────────────────────────────────────
export interface StatefulButtonProps extends Omit<ButtonProps, 'onClick'> {
  state: 'idle' | 'loading' | 'success' | 'error';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  successIcon?: string;
  errorIcon?: string;
}

export const StatefulButton = forwardRef<HTMLButtonElement, StatefulButtonProps>(
  (
    {
      state,
      onClick,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      successIcon = 'check',
      errorIcon = 'error',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isActuallyLoading = state === 'loading' || loading;
    const isActuallyDisabled = disabled || isActuallyLoading;

    const getIcon = () => {
      if (state === 'success') return successIcon;
      if (state === 'error') return errorIcon;
      return icon;
    };

    return (
      <Button
        ref={ref}
        variant={state === 'error' ? 'danger' : variant}
        size={size}
        loading={isActuallyLoading}
        icon={getIcon()}
        disabled={isActuallyDisabled}
        onClick={onClick}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

StatefulButton.displayName = 'StatefulButton';


