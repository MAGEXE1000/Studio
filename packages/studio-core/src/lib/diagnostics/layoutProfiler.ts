import { SourceMapResolver } from './SourceMapResolver';

export class LayoutProfiler {
  private static isInitialized = false;
  private static observer: MutationObserver | null = null;
  private static dirty = false;
  
  public static init() {
    if (this.isInitialized) return;
    if (typeof window === 'undefined' || !(window as any).__ENABLE_DIAGNOSTICS__) return;
    this.isInitialized = true;

    // Observe DOM mutations to mark layout as dirty
    this.observer = new MutationObserver(() => {
      this.dirty = true;
      // Reset dirty flag at the end of the frame
      requestAnimationFrame(() => {
        this.dirty = false;
      });
    });

    this.observer.observe(document.documentElement, {
      childList: true,
      attributes: true,
      subtree: true,
      characterData: true
    });

    // Intercept DOM reads
    this.interceptProperty(HTMLElement.prototype, 'offsetHeight');
    this.interceptProperty(HTMLElement.prototype, 'offsetWidth');
    this.interceptProperty(HTMLElement.prototype, 'clientHeight');
    this.interceptProperty(HTMLElement.prototype, 'clientWidth');
    this.interceptMethod(HTMLElement.prototype, 'getBoundingClientRect');
  }

  private static interceptProperty(proto: any, prop: string) {
    const originalDescriptor = Object.getOwnPropertyDescriptor(proto, prop);
    if (!originalDescriptor || !originalDescriptor.get) return;

    Object.defineProperty(proto, prop, {
      get: function() {
        LayoutProfiler.checkThrashing(prop);
        return originalDescriptor.get!.call(this);
      },
      enumerable: originalDescriptor.enumerable,
      configurable: true
    });
  }

  private static interceptMethod(proto: any, method: string) {
    const original = proto[method];
    proto[method] = function(...args: any[]) {
      LayoutProfiler.checkThrashing(method);
      return original.apply(this, args);
    };
  }

  private static checkThrashing(apiName: string) {
    if (!this.dirty) return;
    
    // We are reading a layout property immediately after a DOM mutation in the same frame
    const err = new Error();
    let caller = 'Unknown';
    if (err.stack) {
      const lines = err.stack.split('\n');
      for (let i = 2; i < lines.length; i++) {
        if (!lines[i].includes('layoutProfiler')) {
          const parsed = SourceMapResolver.parseStackTrace(lines.slice(i).join('\n'));
          if (parsed.length > 0) {
            caller = `${parsed[0].func} (${parsed[0].file}:${parsed[0].line})`;
          } else {
            caller = lines[i].trim();
          }
          break;
        }
      }
    }

    let component = 'Unknown';
    let fileLocation = 'Unknown';
    if (caller !== 'Unknown') {
      const parts = caller.split(' (');
      component = parts[0];
      if (parts[1]) {
        fileLocation = parts[1].replace(')', '');
      }
    }

    console.warn(`------------------------------------------
Title
Forced Synchronous Layout
Severity
BUG
Classification
BUG
Studio subsystem
LayoutProfiler
React component
${component}
Component hierarchy
Unknown
Source file
${fileLocation.split(':')[0]}
Source line
${fileLocation.split(':')[1] || 'Unknown'}
Hook
N/A
Function
${component}
Store involved
N/A
Store mutation
N/A
Navigation route
N/A
Trigger
DOM read immediately following DOM write
Previous value
N/A
Current value
N/A
Render count
N/A
Layout count
1
Paint count
N/A
JS execution time
Unknown
Layout time
Unknown
Paint time
Unknown
Total duration
Unknown
Expected?
NO
Root cause
DOM read (${apiName}) occurred in the same frame as a DOM write. This causes Layout Thrashing!
Recommendation
Batch DOM reads and writes, or avoid reading layout properties like offsetHeight/clientWidth immediately after state changes.
------------------------------------------`);
  }
}
