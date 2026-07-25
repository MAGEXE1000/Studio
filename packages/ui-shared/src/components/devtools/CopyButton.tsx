import React, { useState, useRef } from 'react';

export interface CopyButtonProps {
  getTextToCopy: () => string | Promise<string>;
  label?: string;
  copiedLabel?: string;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  getTextToCopy,
  label = 'Copy',
  copiedLabel = 'Copied!',
  size = 'sm',
  style,
  className = '',
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const text = await getTextToCopy();
      await navigator.clipboard.writeText(text);

      setIsCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsCopied(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to copy diagnostics:', err);
    }
  };

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`btn-smooth ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: isSmall ? '5px 12px' : '8px 16px',
        borderRadius: '999px',
        background: isCopied ? 'rgba(16, 185, 129, 0.18)' : 'var(--app-surface-high, rgba(255, 255, 255, 0.08))',
        border: `1px solid ${isCopied ? 'rgba(16, 185, 129, 0.4)' : 'rgba(128, 128, 128, 0.12)'}`,
        color: isCopied ? '#10b981' : 'var(--c-text-primary, #ffffff)',
        fontSize: isSmall ? '11px' : '12px',
        fontWeight: 700,
        fontFamily: 'Manrope, system-ui, sans-serif',
        cursor: 'pointer',
        boxShadow: isCopied ? '0 2px 10px rgba(16, 185, 129, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.15)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: isSmall ? 15 : 17,
          color: isCopied ? '#10b981' : 'var(--c-text-secondary, #94a3b8)',
          transition: 'all 0.2s ease',
        }}
      >
        {isCopied ? 'check' : 'content_copy'}
      </span>
      <span>{isCopied ? copiedLabel : label}</span>
    </button>
  );
};

export default CopyButton;
