import { SourceMapConsumer } from 'source-map-js';

interface SourceLocation {
  file: string;
  line: number | string;
  func: string;
}

export class SourceMapResolver {
  private static isInitialized = false;
  private static consumers = new Map<string, SourceMapConsumer>();
  private static mapUrls = new Map<string, string>(); // scriptUrl -> mapUrl
  
  public static async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    // Attempt to intercept all script tags to find their sourcemaps if we are in diagnostic mode
    if (typeof document !== 'undefined') {
      const scripts = document.querySelectorAll('script');
      scripts.forEach(script => {
        if (script.src) {
          // Assume the map is right next to it, e.g. .js.map
          this.mapUrls.set(script.src, script.src + '.map');
        }
      });
    }
  }

  public static async resolve(url: string, line: number, column: number, defaultFunc: string): Promise<SourceLocation> {
    if (!url || url.startsWith('chrome-extension')) {
      return { file: url, line, func: defaultFunc };
    }

    // Attempt to load the sourcemap consumer
    let consumer = this.consumers.get(url);
    if (!consumer) {
      let mapUrl = this.mapUrls.get(url) || url + '.map';
      try {
        const response = await fetch(mapUrl);
        if (response.ok) {
          const rawSourceMap = await response.json();
          consumer = new SourceMapConsumer(rawSourceMap);
          this.consumers.set(url, consumer);
        } else {
          // Mark as unresolvable
          this.consumers.set(url, null as any);
        }
      } catch (e) {
        this.consumers.set(url, null as any);
      }
    }

    if (!consumer) {
      return { file: url, line, func: defaultFunc };
    }

    try {
      const original = consumer.originalPositionFor({
        line: line,
        column: column
      });

      if (original.source) {
        let file = original.source;
        if (file.includes('node_modules')) {
          const parts = file.split('node_modules/');
          file = `node_modules/${parts[parts.length - 1]}`;
        } else if (file.includes('src/')) {
          const parts = file.split('src/');
          file = `src/${parts[parts.length - 1]}`;
        } else if (file.startsWith('..')) {
           // Clean up relative paths from Vite
           file = file.replace(/^(\.\.\/)+/, '');
        }
        
        return {
          file,
          line: original.line || line,
          func: original.name || defaultFunc
        };
      }
    } catch (e) {
      // ignore parsing errors
    }

    return { file: url, line, func: defaultFunc };
  }

  /**
   * Resolves a raw Error().stack string synchronously (if maps are preloaded) or just cleans it up.
   */
  public static parseStackTrace(stack: string): { file: string, line: string, func: string }[] {
    const lines = stack.split('\n');
    const result = [];
    for (const line of lines) {
      if (line.includes('BackDispatcher') || line.includes('Error')) continue;
      
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) || line.match(/at\s+(.+?):(\d+):(\d+)/);
      if (match) {
        let func = 'anonymous';
        let url = '';
        let row = '0';
        let col = '0';
        
        if (match.length === 5) {
          func = match[1];
          url = match[2];
          row = match[3];
          col = match[4];
        } else if (match.length === 4) {
          url = match[1];
          row = match[2];
          col = match[3];
        }

        let file = url;
        if (file.includes('src/')) {
          file = 'src/' + file.split('src/')[1];
        } else if (file.includes('packages/')) {
          file = 'packages/' + file.split('packages/')[1];
        }

        result.push({ file, line: row, func });
      } else {
        result.push({ file: 'UNKNOWN', line: '0', func: line.trim() });
      }
    }
    return result;
  }
}
