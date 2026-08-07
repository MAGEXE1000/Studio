import { Loader } from '../../components/motion/loader';

interface LoadingLottieProps {
  width?: number;
  isLight?: boolean;
  style?: React.CSSProperties;
}

export default function LoadingLottie({ width = 48, isLight, style }: LoadingLottieProps) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      <Loader variant="dots" size={width} className={isLight ? 'text-white' : undefined} />
    </div>
  );
}

