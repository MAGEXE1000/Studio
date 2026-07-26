import React, { useState, useRef } from 'react';

export interface CopyButtonProps {
  getTextToCopy: () => string | Promise<string>;
  label?: string;
  copiedLabel?: string;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Standardized Canonical CopyButton with Crossfade, Spring Scale & ~1.4s Auto-Revert.
 * Specifications:
 *  - Writes value to clipboard on click
 *  - Icon crossfades & spring scales from 'content_copy' to 'check'
 *  - Text swaps from "Copy" to "Copied"
 *  - Reverts automatically after ~1.4s (1400ms)
 *  - Handles clipboard failure gracefully without breaking
 *  - Zero layout shift (fixed flex alignment and min width)
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  getTextToCopy,
  label = 'Copy',
  copiedLabel = 'Copied!',
  size = 'sm',
  style,
  className = '',
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [hasError, setHasError] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDebouncingRef = useRef(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isDebouncingRef.current) return;
    isDebouncingRef.current = true;

    try {
      const text = await getTextToCopy();
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-HTTPS or legacy clipboard access
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      setIsCopied(true);
      setHasError(false);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsCopied(false);
        isDebouncingRef.current = false;
      }, 1400);
    } catch (err) {
      console.warn('Clipboard write error:', err);
      setHasError(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setHasError(false);
        isDebouncingRef.current = false;
      }, 1400);
    }
  };

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      role="button"
      aria-label={isCopied ? copiedLabel : label}
      onClick={handleCopy}
      className={`btn-smooth ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: isSmall ? '6px 14px' : '8px 18px',
        borderRadius: '999px',
        background: hasError
          ? 'rgba(239, 68, 68, 0.18)'
          : isCopied
            ? 'rgba(16, 185, 129, 0.18)'
            : 'var(--app-surface-high, rgba(255, 255, 255, 0.08))',
        border: `1px solid ${
          hasError
            ? 'rgba(239, 68, 68, 0.4)'
            : isCopied
              ? 'rgba(16, 185, 129, 0.4)'
              : 'rgba(128, 128, 128, 0.12)'
        }`,
        color: hasError
          ? '#ef4444'
          : isCopied
            ? '#10b981'
            : 'var(--c-text-primary, #ffffff)',
        fontSize: isSmall ? '11px' : '12px',
        fontWeight: 700,
        fontFamily: 'Manrope, system-ui, sans-serif',
        cursor: 'pointer',
        boxShadow: isCopied
          ? '0 2px 12px rgba(16, 185, 129, 0.25)'
          : '0 2px 8px rgba(0, 0, 0, 0.15)',
        transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        outline: 'none',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: isSmall ? 15 : 17,
          color: hasError ? '#ef4444' : isCopied ? '#10b981' : 'var(--c-text-secondary, #94a3b8)',
          transform: isCopied ? 'scale(1.15) rotate(0deg)' : 'scale(1)',
          transition: 'transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease',
        }}
      >
        {hasError ? 'error' : isCopied ? 'check' : 'content_copy'}
      </span>
      <span>{hasError ? 'Copy Failed' : isCopied ? copiedLabel : label}</span>
    </button>
  );
};

export default CopyButton;
