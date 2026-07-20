import { Capacitor } from '@capacitor/core';
import { useState, useEffect } from 'react';

export function useIsWebDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => {
    return (
      !Capacitor.isNativePlatform() && typeof window !== 'undefined' && window.innerWidth >= 768
    );
  });

  useEffect(() => {
    if (!!Capacitor.isNativePlatform()) return;

    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isDesktop;
}
