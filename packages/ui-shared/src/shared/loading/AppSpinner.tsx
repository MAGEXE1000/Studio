import { Loader } from '../../components/motion/loader';

interface AppSpinnerProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

/**
 * AppSpinner — Redirected to official BeUI Loader (variant="spinner").
 */
export default function AppSpinner({
  size = 20,
  className,
}: AppSpinnerProps) {
  return <Loader variant="spinner" size={size} className={className} />;
}

