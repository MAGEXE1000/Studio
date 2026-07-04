export const SHARED_NAV_TRANSITION = 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), background-color 300ms ease, border-color 300ms ease, box-shadow 300ms ease';

export const getSharedNavTransform = (navHidden: boolean, navCollapsed: boolean, entered = true) => {
  if (!entered) {
    return 'translateX(-50%) translateY(24px)';
  }
  return (navHidden || navCollapsed)
    ? 'translateX(-50%) translateY(calc(100% + 32px))'
    : 'translateX(-50%) translateY(0px)';
};

export const getSharedNavOpacity = (navHidden: boolean, navCollapsed: boolean, entered = true) => {
  if (!entered) return 0;
  return 1;
};
