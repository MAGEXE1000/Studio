import React from 'react';
import { ThemeToggle } from '../../components/motion/theme-toggle';

export default function InkThemeToggle({
  className,
  style,
  ...props
}: {
  className?: string;
  style?: React.CSSProperties;
} & React.ComponentPropsWithoutRef<'button'>) {
  return (
    <ThemeToggle
      variant="circle-blur"
      start="bottom-up"
      className={className}
      style={style}
      {...props}
    />
  );
}
