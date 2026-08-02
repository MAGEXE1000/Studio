import React, { useRef, useEffect } from 'react';

interface SegmentedOtpInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export const SegmentedOtpInput: React.FC<SegmentedOtpInputProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into an array of 6 characters
  const cells = Array.from({ length: 6 }, (_, i) => value[i] || '');

  // Handle auto-focus on mount
  useEffect(() => {
    // Focus the first empty cell, or the first cell
    const emptyIndex = cells.findIndex(c => !c);
    const targetIndex = emptyIndex !== -1 ? emptyIndex : 0;
    if (inputRefs.current[targetIndex] && !disabled) {
      inputRefs.current[targetIndex]?.focus();
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const newCells = [...cells];
    
    // Take only the last character entered
    const char = val[val.length - 1] || '';
    newCells[index] = char;
    
    const newValue = newCells.join('');
    onChange(newValue);

    // If character entered, auto focus next cell
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newCells = [...cells];
      
      if (cells[index]) {
        // If current cell has value, clear it
        newCells[index] = '';
        onChange(newCells.join(''));
      } else if (index > 0) {
        // If current cell is empty, clear previous cell and focus it
        newCells[index - 1] = '';
        onChange(newCells.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);

    if (pastedText) {
      onChange(pastedText);
      const focusIndex = Math.min(pastedText.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="grid grid-cols-6 gap-3">
      {cells.map((char, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          maxLength={2} // allow typing over existing char
          value={char}
          disabled={disabled}
          onChange={(e) => handleInputChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          placeholder="—"
          className="w-full h-16 rounded-2xl bg-[#131313]/80 backdrop-blur-md border border-white/10 text-center font-code-display text-code-display text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 focus-within:-translate-y-0.5 focus-within:scale-105 hover:border-[#adc6ff] focus:border-[#adc6ff] hover:shadow-[0_0_12px_-2px_rgba(173,198,255,0.4)] focus:shadow-[0_0_12px_-2px_rgba(173,198,255,0.4)]"
          aria-label={`Digit ${index + 1}`}
          inputMode="text"
        />
      ))}
    </div>
  );
};
