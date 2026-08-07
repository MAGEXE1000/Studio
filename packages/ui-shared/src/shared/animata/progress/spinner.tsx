import { Loader } from '../../../components/motion/loader';

interface StudioSpinnerProps {
  className?: string;
  outerSize?: string;
  childSize?: string;
  colorFrom?: string;
  colorTo?: string;
}

export default function StudioSpinner({
  className,
}: StudioSpinnerProps) {
  return <Loader variant="spinner" size={24} className={className} />;
}

