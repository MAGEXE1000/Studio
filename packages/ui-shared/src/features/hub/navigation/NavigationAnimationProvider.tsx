import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

interface NavigationAnimationContextValue {
  currentTab: string | null;
  previousTab: string | null;
  isTransitioning: boolean;
}

const NavigationAnimationContext = createContext<NavigationAnimationContextValue>({
  currentTab: null,
  previousTab: null,
  isTransitioning: false,
});

export const useNavigationAnimation = () => useContext(NavigationAnimationContext);

interface NavigationAnimationProviderProps {
  activeTab: string | null;
  children: React.ReactNode;
}

export const NavigationAnimationProvider: React.FC<NavigationAnimationProviderProps> = ({
  activeTab,
  children,
}) => {
  const [state, setState] = useState<{
    currentTab: string | null;
    previousTab: string | null;
  }>({
    currentTab: activeTab,
    previousTab: null,
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setState((prev) => {
      // Only update if the tab actually changed
      if (prev.currentTab === activeTab) {
        return prev;
      }
      
      return {
        currentTab: activeTab,
        previousTab: prev.currentTab,
      };
    });

    // We can signal a brief "transitioning" state, useful for syncing logic
    setIsTransitioning(true);
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    // We consider the transition "active" for the duration of a standard animation
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 600); // 600ms covers our longest spring animation

    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [activeTab]);

  return (
    <NavigationAnimationContext.Provider
      value={{
        currentTab: state.currentTab,
        previousTab: state.previousTab,
        isTransitioning,
      }}
    >
      {children}
    </NavigationAnimationContext.Provider>
  );
};
