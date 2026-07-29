import React from 'react';
import StudioProgressBar from '../progress/StudioProgressBar';

export interface ProgressProps {
  value: number;
  accentFrom?: string;
  accentTo?: string;
  height?: number;
  style?: React.CSSProperties;
}

export function Progress(props: ProgressProps) {
  return <StudioProgressBar {...props} />;
}
