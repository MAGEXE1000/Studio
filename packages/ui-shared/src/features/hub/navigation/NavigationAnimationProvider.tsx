import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

export type NavDirection = 'forward' | 'reverse' | 'none';

interface NavigationAnimationContextValue {
  currentTab: string | null;
  previousTab: string | null;
  isTransitioning: boolean;
  direction: NavDirection;
  indexDelta: number;
}

const NavigationAnimationContext = createContext<NavigationAnimationContextValue>({
  currentTab: null,
  previousTab: null,
  isTransitioning: false,
  direction: 'none',
  indexDelta: 0,
});

export const useNavigationAnimation = () => useContext(NavigationAnimationContext);

interface NavigationAnimationProviderProps {
  activeTab: string | null;
  items?: Array<{ key?: string; id?: string }>;
  children: React.ReactNode;
}

export const NavigationAnimationProvider: React.FC<NavigationAnimationProviderProps> = ({
  activeTab,
  items,
  children,
}) => {
  const [state, setState] = useState<{
    currentTab: string | null;
    previousTab: string | null;
    direction: NavDirection;
    indexDelta: number;
  }>({
    currentTab: activeTab,
    previousTab: null,
    direction: 'none',
    indexDelta: 0,
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setState((prev) => {
      // Only update if the tab actually changed
      if (prev.currentTab === activeTab) {
        return prev;
      }
      
      let direction: NavDirection = 'none';
      let indexDelta = 0;

      if (items && items.length > 0) {
        const prevIdx = items.findIndex((i) => (i.key || i.id) === prev.currentTab);
        const currIdx = items.findIndex((i) => (i.key || i.id) === activeTab);
        if (prevIdx !== -1 && currIdx !== -1) {
          indexDelta = currIdx - prevIdx;
          if (indexDelta > 0) direction = 'forward';
          else if (indexDelta < 0) direction = 'reverse';
        }
      }

      return {
        currentTab: activeTab,
        previousTab: prev.currentTab,
        direction,
        indexDelta,
      };
    });

    setIsTransitioning(true);
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 600);

    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [activeTab, items]);

  return (
    <NavigationAnimationContext.Provider
      value={{
        currentTab: state.currentTab,
        previousTab: state.previousTab,
        isTransitioning,
        direction: state.direction,
        indexDelta: state.indexDelta,
      }}
    >
      {children}
    </NavigationAnimationContext.Provider>
  );
};
