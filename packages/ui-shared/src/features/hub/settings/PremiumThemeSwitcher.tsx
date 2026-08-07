import React from 'react';
import { ThemeToggle } from '../../../components/motion/theme-toggle';

export default function PremiumThemeSwitcher(props: React.ComponentPropsWithoutRef<'button'>) {
  return <ThemeToggle variant="circle-blur" start="bottom-up" {...props} />;
}
