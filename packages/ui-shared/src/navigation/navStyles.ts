export const SHARED_NAV_TRANSITION =
  'transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1), border-radius 250ms cubic-bezier(0.2, 0.8, 0.2, 1), background-color 250ms ease, border-color 250ms ease, box-shadow 250ms ease';

export const getSharedNavTransform = (
  navHidden: boolean,
  navCollapsed: boolean,
  entered = true
) => {
  if (!entered) {
    return 'translateX(-50%) translateY(24px)';
  }
  if (navHidden) {
    return 'translateX(-50%) translateY(calc(100% + 32px))';
  }
  if (navCollapsed) {
    return 'translateX(-50%) translateY(calc(100% - 12px + var(--nav-safe-bottom, 0px))) scaleX(0.33) scaleY(0.045)';
  }
  return 'translateX(-50%) translateY(0px) scaleX(1) scaleY(1)';
};

export const getSharedNavOpacity = (navHidden: boolean, navCollapsed: boolean, entered = true) => {
  if (!entered) return 0;
  return 1;
};
