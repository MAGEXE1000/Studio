import { lazy, Suspense } from 'react';

const LottiePlayer = lazy(() => (import('lottie-react').then(m => {
  if (typeof m.default === 'function') {
    return { default: m.default };
  }
  if (m.default && typeof (m.default as any).default === 'function') {
    return { default: (m.default as any).default };
  }
  return { default: m.default || m };
}) as any));

export interface AppLottieProps {
  animationData: object;
  loop?: boolean;
  autoplay?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onComplete?: () => void;
  isLight?: boolean;
}

export default function AppLottie({
  animationData,
  loop = true,
  autoplay = true,
  style,
  className,
  onComplete,
  isLight,
}: AppLottieProps) {
  const colorFilter = isLight ? 'invert(1)' : undefined;
  return (
    <Suspense fallback={null}>
      <LottiePlayer
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        className={className}
        onComplete={onComplete}
        style={{ filter: colorFilter, ...style }}
        rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
      />
    </Suspense>
  );
}
