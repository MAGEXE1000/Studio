// reactProfiler.ts

interface Fiber {
  tag: number;
  type: any;
  elementType: any;
  memoizedProps: any;
  memoizedState: any;
  alternate: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  actualDuration?: number;
  actualStartTime?: number;
  treeBaseDuration?: number;
}

export class ReactRootCauseProfiler {
  private static isInitialized = false;

  public static init() {
    if (this.isInitialized) return;
    if (typeof window === 'undefined' || !(window as any).__ENABLE_DIAGNOSTICS__) return;

    // React DevTools Hook must be injected before React loads
    const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook && hook.onCommitFiberRoot) {
      const originalOnCommit = hook.onCommitFiberRoot;
      hook.onCommitFiberRoot = (rendererID: number, root: any, priorityLevel: any) => {
        try {
          if (root && root.current) {
            this.traverseFiberTree(root.current);
          }
        } catch (e) {
          console.warn('[ReactProfiler] Error traversing fiber tree:', e);
        }
        return originalOnCommit(rendererID, root, priorityLevel);
      };
    } else {
      // If it doesn't exist, we mock it so React attaches to it
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        supportsFiber: true,
        inject: () => {},
        onCommitFiberRoot: (rendererID: number, root: any) => {
          if (root && root.current) {
            this.traverseFiberTree(root.current);
          }
        },
        onCommitFiberUnmount: () => {}
      };
    }

    this.isInitialized = true;
  }

  private static traverseFiberTree(fiber: Fiber) {
    // tag 0: FunctionComponent, tag 1: ClassComponent, tag 15: MemoComponent, tag 11: ForwardRef
    const isComponent = fiber.tag === 0 || fiber.tag === 1 || fiber.tag === 15 || fiber.tag === 11;
    const isRoot = fiber.tag === 3; // HostRoot
    
    if (isRoot && fiber.actualDuration && fiber.actualDuration > 50) {
      const activeComps = (window as any).__ACTIVE_DIAGNOSTICS_COMPONENTS__ || [];
      activeComps.push(`React Render Cascade (${fiber.actualDuration.toFixed(0)}ms)`);
      if (activeComps.length > 5) activeComps.shift();
      (window as any).__ACTIVE_DIAGNOSTICS_COMPONENTS__ = activeComps;
    }

    if (isComponent && fiber.alternate) {
      this.analyzeComponentRender(fiber);
    }

    let child = fiber.child;
    while (child) {
      this.traverseFiberTree(child);
      child = child.sibling;
    }
  }

  private static analyzeComponentRender(fiber: Fiber) {
    const oldProps = fiber.alternate?.memoizedProps || {};
    const newProps = fiber.memoizedProps || {};
    const oldState = fiber.alternate?.memoizedState;
    const newState = fiber.memoizedState;

    const propChanges = this.getDiff(oldProps, newProps);
    const stateChanges = this.getHookDiff(oldState, newState);

    if (propChanges.length > 0 || stateChanges.length > 0) {
      const componentName = this.getComponentName(fiber);
      const duration = fiber.actualDuration || 0;
      
      // Filter out noisy, extremely fast renders (e.g. < 0.5ms) unless they are part of a cascade
      if (duration > 16.0) {
        this.logRenderCause(componentName, duration, propChanges, stateChanges);
      }
    }
  }

  private static getDiff(oldObj: any, newObj: any): string[] {
    const changes: string[] = [];
    if (oldObj === newObj) return changes;
    if (!oldObj || !newObj) return ['(object initialized or destroyed)'];
    if (typeof oldObj !== 'object' || typeof newObj !== 'object') return ['(type changed)'];

    for (const key in newObj) {
      if (oldObj[key] !== newObj[key]) {
        changes.push(key);
      }
    }
    return changes;
  }

  private static getHookDiff(oldState: any, newState: any): string[] {
    const changes: string[] = [];
    let oldCurrent = oldState;
    let newCurrent = newState;
    let hookIndex = 0;

    while (oldCurrent && newCurrent) {
      if (oldCurrent.memoizedState !== newCurrent.memoizedState) {
        if (typeof newCurrent.memoizedState === 'object' && newCurrent.memoizedState !== null) {
          if (Array.isArray(newCurrent.memoizedState) && Array.isArray(oldCurrent.memoizedState)) {
             // Basic dependency array diffing
             if (newCurrent.memoizedState.length !== oldCurrent.memoizedState.length) {
               changes.push(`Hook[${hookIndex}] (Dep Array length changed)`);
             } else {
               let arrayChanged = false;
               for (let i = 0; i < newCurrent.memoizedState.length; i++) {
                 if (newCurrent.memoizedState[i] !== oldCurrent.memoizedState[i]) {
                   arrayChanged = true;
                   break;
                 }
               }
               if (arrayChanged) changes.push(`Hook[${hookIndex}] (Deps changed)`);
             }
          } else {
             const subDiff = this.getDiff(oldCurrent.memoizedState, newCurrent.memoizedState);
             if (subDiff.length > 0) {
               changes.push(`Hook[${hookIndex}] (Keys: ${subDiff.join(', ')})`);
             } else {
               changes.push(`Hook[${hookIndex}] (Object reference changed)`);
             }
          }
        } else {
          changes.push(`Hook[${hookIndex}] (Primitive value changed)`);
        }
      }
      oldCurrent = oldCurrent.next;
      newCurrent = newCurrent.next;
      hookIndex++;
    }
    return changes;
  }

  private static getComponentName(fiber: Fiber): string {
    if (fiber.type && typeof fiber.type === 'function') {
      return fiber.type.displayName || fiber.type.name || 'Anonymous';
    }
    if (fiber.type && typeof fiber.type === 'object') {
      if (fiber.type.render) {
         return fiber.type.render.displayName || fiber.type.render.name || 'ForwardRef';
      }
    }
    if (typeof fiber.elementType === 'string') {
       return fiber.elementType;
    }
    return 'UnknownComponent';
  }

  private static logRenderCause(name: string, duration: number, propChanges: string[], stateChanges: string[]) {
    // Determine if memoization would have helped
    const memoizationHelp = propChanges.length === 0 && stateChanges.length > 0 ? 
      'State/Hook changes forced a render. Check if dependencies in hooks are unstable.' :
      (propChanges.length > 0 ? 'Props changed. If the parent passed unstable references (e.g. inline functions or object literals), memoization (useCallback/useMemo) in the parent will prevent this.' : 'Memoization (React.memo) could prevent this if the parent re-rendered unnecessarily.');

    let severity = 'INFO';
    if (duration > 100) severity = 'CRITICAL';
    else if (duration > 32) severity = 'BUG';
    else if (duration > 16) severity = 'OPTIMIZATION OPPORTUNITY';

    const msg = `------------------------------------------
Title
React Render
Severity
${severity}
Classification
${severity}
Studio subsystem
ReactProfiler
React component
${name}
Component hierarchy
Unknown
Source file
Unknown (React Internal)
Source line
Unknown
Hook
${stateChanges.filter(s => s.startsWith('Hook')).join(', ') || 'N/A'}
Function
Render
Store involved
N/A
Store mutation
N/A
Navigation route
N/A
Trigger
${propChanges.length > 0 ? 'Prop changes' : (stateChanges.length > 0 ? 'State/Hook changes' : 'Parent Re-render')}
Previous value
N/A
Current value
N/A
Render count
1
Layout count
N/A
Paint count
N/A
JS execution time
${duration.toFixed(1)}ms
Layout time
N/A
Paint time
N/A
Total duration
${duration.toFixed(1)}ms
Expected?
${duration > 16 ? 'NO' : 'YES'}
Root cause
React re-rendered ${name} due to ${propChanges.length > 0 ? 'Props: ' + propChanges.join(', ') : ''} ${stateChanges.length > 0 ? 'State/Hooks: ' + stateChanges.join(', ') : ''}.
Recommendation
${memoizationHelp}
------------------------------------------`;
    
    // Update active diagnostics tracking so RootCauseAnalyzer LongTask knows what's rendering
    const activeComps = (window as any).__ACTIVE_DIAGNOSTICS_COMPONENTS__ || [];
    activeComps.push(name);
    if (activeComps.length > 5) activeComps.shift();
    (window as any).__ACTIVE_DIAGNOSTICS_COMPONENTS__ = activeComps;

    // Only warn if duration is very long, otherwise just debug
    if (duration > 32.0) {
       console.warn(msg);
    } else {
       console.debug(msg);
    }
  }
}
