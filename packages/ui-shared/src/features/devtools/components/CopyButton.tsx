import React, { useState, useRef } from 'react';
import { Button } from '../../../shared/design-system/buttons';
import { AnimatedIcon } from '../../../shared/icons/AnimatedIcon';

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
 *  - Powered by canonical HeroUI Button system
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

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
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
    <Button
      variant={hasError ? 'danger' : 'secondary'}
      size={size}
      aria-label={isCopied ? copiedLabel : label}
      onClick={handleCopy}
      className={className}
      style={{
        ...(isCopied && {
          background: 'rgba(16, 185, 129, 0.18)',
          borderColor: 'rgba(16, 185, 129, 0.4)',
          color: '#10b981',
          boxShadow: '0 2px 12px rgba(16, 185, 129, 0.25)',
        }),
        ...style,
      }}
      icon={
        <AnimatedIcon
          name={hasError ? 'error' : isCopied ? 'check' : 'copy'}
          size={isSmall ? 15 : 17}
          color={hasError ? '#ef4444' : isCopied ? '#10b981' : 'currentColor'}
          state={hasError ? 'error' : isCopied ? 'success' : 'inactive'}
        />
      }
    >
      <span>{hasError ? 'Copy Failed' : isCopied ? copiedLabel : label}</span>
    </Button>
  );
};

export default CopyButton;
