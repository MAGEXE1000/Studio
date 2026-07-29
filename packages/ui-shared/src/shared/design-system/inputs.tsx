import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavigationDispatcher, useSettingsStore, ACCENT_COLORS, AppKey, SpringPresets } from '@workspace/studio-core';
// ── 6. Input ───────────────────────────────────────────────────────────────
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  desc?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, desc, error, style, className = '', ...props }, ref) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
        {label && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--c-text-secondary)',
              fontFamily: 'var(--font-headline)',
            }}
          >
            {label}
          </span>
        )}
        <input
          ref={ref}
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontFamily: 'var(--font-body)',
            backgroundColor: 'var(--c-surface-lowest)',
            border: `1.5px solid ${error ? 'var(--c-error)' : 'var(--c-border)'}`,
            color: 'var(--c-text-primary)',
            outline: 'none',
            transition: 'border-color 180ms ease, background-color 180ms ease, color 180ms ease',
            ...style,
          }}
          className={`studio-input ${className}`}
          {...props}
        />
        {desc && !error && (
          <span
            style={{
              fontSize: '10px',
              color: 'var(--c-text-secondary)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {desc}
          </span>
        )}
        {error && (
          <span
            style={{
              fontSize: '10px',
              color: 'var(--c-error)',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
            }}
          >
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ── Search Bar ───────────────────────────────────────────────────────────────
export interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  accent?: { from: string; to: string; mid: string };
}

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ onClear, accent, value, onChange, style, className = '', placeholder, ...props }, ref) => {
    const showClear = value && value.toString().length > 0 && onClear;

    return (
      <div
        className={`relative w-full ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          className="material-symbols-outlined absolute left-4 pointer-events-none"
          style={{
            color: 'var(--c-text-secondary, #acabaa)',
            fontSize: '20px',
            zIndex: 5,
          }}
        >
          search
        </span>
        <input
          ref={ref}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            width: '100%',
            height: '48px',
            padding: '10px 48px 10px 48px',
            borderRadius: '9999px',
            backgroundColor: 'var(--app-surface-high, rgba(128,128,128,0.06))',
            border: '1px solid var(--c-border, rgba(128,128,128,0.12))',
            color: 'var(--c-text-primary, #e7e5e4)',
            fontSize: '14px',
            fontFamily: 'var(--font-body, Inter, sans-serif)',
            outline: 'none',
            transition: 'all 240ms cubic-bezier(0.2, 0, 0, 1)',
            boxShadow: 'none',
            boxSizing: 'border-box',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = accent
              ? accent.from
              : 'var(--c-accent-from, #007aff)';
            e.currentTarget.style.backgroundColor =
              'var(--app-surface-highest, rgba(128,128,128,0.12))';
            e.currentTarget.style.boxShadow = 'var(--elevation-low, 0 1px 4px rgba(0,0,0,0.15))';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--c-border, rgba(128,128,128,0.12))';
            e.currentTarget.style.backgroundColor =
              'var(--app-surface-high, rgba(128,128,128,0.06))';
            e.currentTarget.style.boxShadow = 'none';
          }}
          {...props}
        />
        {showClear && (
          <button
            onClick={onClear}
            type="button"
            className="absolute right-3 btn-smooth outline-none cursor-pointer flex items-center justify-center"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--c-text-secondary, #acabaa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              close
            </span>
          </button>
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';

