import { ComponentFiberInfo, BreadcrumbItem } from '@workspace/studio-core';

/**
 * InspectorEngine
 * Advanced DOM & React Fiber inspection algorithms for Livex Developer Inspector.
 */

export interface BoxModel {
  content: { x: number; y: number; width: number; height: number };
  padding: { top: number; right: number; bottom: number; left: number };
  border: { top: number; right: number; bottom: number; left: number };
  margin: { top: number; right: number; bottom: number; left: number };
  rect: DOMRect;
  borderRadius: string;
  transform: string;
}

/**
 * Safe serializer for React props & state
 */
function sanitizeObject(obj: any, maxDepth = 2, currentDepth = 0): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'function') return `ƒ ${obj.name || 'anonymous'}()`;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof HTMLElement) return `<${obj.tagName.toLowerCase()}#${obj.id || 'node'}>`;
  if (obj.$$typeof) return '<ReactElement />';
  if (currentDepth >= maxDepth) return Array.isArray(obj) ? '[Array]' : '{Object}';

  try {
    if (Array.isArray(obj)) {
      return obj.slice(0, 10).map((item) => sanitizeObject(item, maxDepth, currentDepth + 1));
    }
    const sanitized: Record<string, any> = {};
    const keys = Object.keys(obj).slice(0, 20);
    for (const key of keys) {
      if (key.startsWith('_') || key === 'children') continue;
      sanitized[key] = sanitizeObject(obj[key], maxDepth, currentDepth + 1);
    }
    return sanitized;
  } catch (err) {
    return '[Unserializable]';
  }
}

/**
 * Extract React Fiber info from a target DOM node
 */
export function getFiberInfoFromDOMNode(element: HTMLElement | null): ComponentFiberInfo | null {
  if (!element) return null;

  let fiberKey: string | null = null;
  for (const key in element) {
    if (key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')) {
      fiberKey = key;
      break;
    }
  }

  let fiber = fiberKey ? (element as any)[fiberKey] : null;
  let currentFiber = fiber;
  let componentName = element.tagName.toLowerCase();
  let ownerName: string | undefined;
  let parentName: string | undefined;
  let props: Record<string, any> = {};
  let state: Record<string, any> = {};
  let sourceFile: string | undefined;
  let lineNumber: number | undefined;
  let columnNumber: number | undefined;
  let depth = 0;
  let isMemoized = false;

  // Walk up Fiber hierarchy to find meaningful React Component
  while (currentFiber) {
    depth++;
    const type = currentFiber.type;

    if (type) {
      if (typeof type === 'function' || typeof type === 'object') {
        const name =
          type.displayName ||
          type.name ||
          (type.render ? type.render.displayName || type.render.name : null);
        if (name && !componentName.includes('(')) {
          componentName = name;
          if (currentFiber._debugSource) {
            sourceFile = currentFiber._debugSource.fileName;
            lineNumber = currentFiber._debugSource.lineNumber;
            columnNumber = currentFiber._debugSource.columnNumber;
          }
          if (currentFiber.memoizedProps) {
            props = sanitizeObject(currentFiber.memoizedProps);
          }
          if (currentFiber.memoizedState) {
            state = sanitizeObject(currentFiber.memoizedState);
          }
          if (type.type && type.type.$$typeof) {
            isMemoized = true;
          }
          break;
        }
      }
    }

    if (currentFiber._debugOwner && !ownerName) {
      const ownerType = currentFiber._debugOwner.type;
      if (ownerType) {
        ownerName = ownerType.displayName || ownerType.name || 'Owner';
      }
    }

    currentFiber = currentFiber.return;
  }

  // Get parent element tag/name
  if (element.parentElement) {
    parentName = element.parentElement.tagName.toLowerCase();
  }

  const computed = window.getComputedStyle(element);
  const flexGridInfo = {
    display: computed.display,
    flexDirection: computed.flexDirection,
    justifyContent: computed.justifyContent,
    alignItems: computed.alignItems,
    gridTemplateColumns: computed.gridTemplateColumns,
    gap: computed.gap,
  };

  const childrenCount = element.children.length;
  const siblingCount = element.parentElement ? element.parentElement.children.length - 1 : 0;

  return {
    displayName: componentName,
    tagName: element.tagName.toLowerCase(),
    props,
    state,
    hooks: [],
    sourceFile,
    lineNumber,
    columnNumber,
    renderCount: 1,
    memoized: isMemoized,
    ownerName,
    parentName,
    childrenCount,
    siblingCount,
    renderDepth: depth,
    flexGridInfo,
  };
}

/**
 * Calculate accurate Box Model (Margin, Border, Padding, Content) for an element
 */
export function getBoxModel(element: HTMLElement): BoxModel {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  const marginTop = parseFloat(style.marginTop) || 0;
  const marginRight = parseFloat(style.marginRight) || 0;
  const marginBottom = parseFloat(style.marginBottom) || 0;
  const marginLeft = parseFloat(style.marginLeft) || 0;

  const borderTop = parseFloat(style.borderTopWidth) || 0;
  const borderRight = parseFloat(style.borderRightWidth) || 0;
  const borderBottom = parseFloat(style.borderBottomWidth) || 0;
  const borderLeft = parseFloat(style.borderLeftWidth) || 0;

  const paddingTop = parseFloat(style.paddingTop) || 0;
  const paddingRight = parseFloat(style.paddingRight) || 0;
  const paddingBottom = parseFloat(style.paddingBottom) || 0;
  const paddingLeft = parseFloat(style.paddingLeft) || 0;

  const contentX = rect.left + borderLeft + paddingLeft;
  const contentY = rect.top + borderTop + paddingTop;
  const contentWidth = Math.max(0, rect.width - borderLeft - borderRight - paddingLeft - paddingRight);
  const contentHeight = Math.max(0, rect.height - borderTop - borderBottom - paddingTop - paddingBottom);

  return {
    content: {
      x: contentX,
      y: contentY,
      width: contentWidth,
      height: contentHeight,
    },
    padding: {
      top: paddingTop,
      right: paddingRight,
      bottom: paddingBottom,
      left: paddingLeft,
    },
    border: {
      top: borderTop,
      right: borderRight,
      bottom: borderBottom,
      left: borderLeft,
    },
    margin: {
      top: marginTop,
      right: marginRight,
      bottom: marginBottom,
      left: marginLeft,
    },
    rect,
    borderRadius: style.borderRadius || '0px',
    transform: style.transform || 'none',
  };
}

/**
 * Smart Component Traversal Methods
 */
export function getParentElement(element: HTMLElement | null): HTMLElement | null {
  if (!element || !element.parentElement) return null;
  let parent: HTMLElement | null = element.parentElement;
  while (
    parent &&
    (parent.tagName === 'BODY' ||
      parent.tagName === 'HTML' ||
      parent.getAttribute('data-inspector-overlay') === 'true' ||
      parent.closest('[data-inspector-dock="true"]'))
  ) {
    parent = parent.parentElement;
  }
  return parent;
}

export function getFirstChildElement(element: HTMLElement | null): HTMLElement | null {
  if (!element || element.children.length === 0) return null;
  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i] as HTMLElement;
    if (child && !child.closest('[data-inspector-dock="true"]')) {
      return child;
    }
  }
  return null;
}

export function getPreviousSiblingElement(element: HTMLElement | null): HTMLElement | null {
  if (!element || !element.previousElementSibling) return null;
  return element.previousElementSibling as HTMLElement;
}

export function getNextSiblingElement(element: HTMLElement | null): HTMLElement | null {
  if (!element || !element.nextElementSibling) return null;
  return element.nextElementSibling as HTMLElement;
}

export function getNearestInteractiveElement(element: HTMLElement | null): HTMLElement | null {
  if (!element) return null;
  return element.closest('button, a, input, select, textarea, [role="button"], [tabindex]') as HTMLElement | null;
}

export function getNearestLayoutContainer(element: HTMLElement | null): HTMLElement | null {
  if (!element) return null;
  let curr: HTMLElement | null = element.parentElement;
  while (curr && curr.tagName !== 'BODY') {
    const display = window.getComputedStyle(curr).display;
    if (display.includes('flex') || display.includes('grid')) {
      return curr;
    }
    curr = curr.parentElement;
  }
  return null;
}

export function getBreadcrumbsForElement(element: HTMLElement | null): BreadcrumbItem[] {
  if (!element) return [];
  const crumbs: BreadcrumbItem[] = [];
  let curr: HTMLElement | null = element;
  while (curr && curr.tagName !== 'BODY' && curr.tagName !== 'HTML') {
    if (curr.getAttribute('data-inspector-overlay') === 'true' || curr.closest('[data-inspector-dock="true"]')) {
      curr = curr.parentElement;
      continue;
    }
    const fiber = getFiberInfoFromDOMNode(curr);
    crumbs.unshift({
      name: fiber?.displayName || curr.tagName.toLowerCase(),
      element: curr,
      isReact: fiber ? fiber.displayName !== curr.tagName.toLowerCase() : false,
    });
    curr = curr.parentElement;
  }
  return crumbs.slice(-6);
}

export function getInspectableElementAtPoint(x: number, y: number): HTMLElement | null {
  const elements = document.elementsFromPoint(x, y);
  for (const el of elements) {
    if (el instanceof HTMLElement) {
      if (
        el.closest('[data-inspector-overlay="true"]') ||
        el.closest('[data-inspector-dock="true"]') ||
        el.tagName === 'BODY' ||
        el.tagName === 'HTML'
      ) {
        continue;
      }
      return el;
    }
  }
  return null;
}

let freezeListenersActive = false;

function blockFrozenEvent(e: Event) {
  const target = e.target as HTMLElement | null;
  if (!target) return;

  // Allow events originating from Developer Inspector controls
  if (
    target.closest('[data-inspector-dock="true"]') ||
    target.closest('[data-inspector-overlay="true"]')
  ) {
    return;
  }

  // Block ALL application interaction completely
  e.preventDefault();
  e.stopPropagation();
  if (typeof (e as any).stopImmediatePropagation === 'function') {
    (e as any).stopImmediatePropagation();
  }
}

/**
 * Freeze UI Engine (Freezes 100% of Studio interface except inspector controls)
 */
export function freezeStudioUI(freeze: boolean) {
  const root = document.documentElement;
  const STYLE_ID = 'livex-freeze-ui-style';

  if (freeze) {
    root.classList.add('livex-freeze-ui');
    root.style.setProperty('--motion-speed-scale', '0');
    root.style.setProperty('--motion-duration', '0s');

    // Inject airtight global CSS freeze rules
    if (!document.getElementById(STYLE_ID)) {
      const styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      styleEl.textContent = `
        html.livex-freeze-ui body * {
          pointer-events: none !important;
          user-select: none !important;
          touch-action: none !important;
          animation-play-state: paused !important;
          transition: none !important;
        }
        html.livex-freeze-ui body {
          overflow: hidden !important;
          touch-action: none !important;
          user-select: none !important;
        }
        html.livex-freeze-ui [data-inspector-dock="true"],
        html.livex-freeze-ui [data-inspector-dock="true"] *,
        html.livex-freeze-ui [data-inspector-overlay="true"],
        html.livex-freeze-ui [data-inspector-overlay="true"] * {
          pointer-events: auto !important;
          user-select: auto !important;
          touch-action: auto !important;
        }
      `;
      document.head.appendChild(styleEl);
    }

    // Register capturing event listeners for total input freezing
    if (!freezeListenersActive && typeof window !== 'undefined') {
      freezeListenersActive = true;
      const frozenEvents = [
        'click',
        'dblclick',
        'mousedown',
        'mouseup',
        'pointerdown',
        'pointerup',
        'touchstart',
        'touchmove',
        'touchend',
        'keydown',
        'keyup',
        'wheel',
        'contextmenu',
        'focusin',
        'focusout',
      ];
      frozenEvents.forEach((evt) => {
        window.addEventListener(evt, blockFrozenEvent, { capture: true, passive: false });
      });
    }

    // Pause all media elements
    document.querySelectorAll('video, audio').forEach((media) => {
      try {
        (media as HTMLMediaElement).pause();
      } catch (err) {}
    });
  } else {
    root.classList.remove('livex-freeze-ui');
    root.style.removeProperty('--motion-speed-scale');
    root.style.removeProperty('--motion-duration');

    const styleEl = document.getElementById(STYLE_ID);
    if (styleEl) styleEl.remove();

    if (freezeListenersActive && typeof window !== 'undefined') {
      freezeListenersActive = false;
      const frozenEvents = [
        'click',
        'dblclick',
        'mousedown',
        'mouseup',
        'pointerdown',
        'pointerup',
        'touchstart',
        'touchmove',
        'touchend',
        'keydown',
        'keyup',
        'wheel',
        'contextmenu',
        'focusin',
        'focusout',
      ];
      frozenEvents.forEach((evt) => {
        window.removeEventListener(evt, blockFrozenEvent, { capture: true } as any);
      });
    }
  }
}
