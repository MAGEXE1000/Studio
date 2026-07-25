import fs from 'fs';

const filePath = 'C:\\Users\\ayuda\\Documents\\.gemini\\antigravity\\scratch\\Studio\\packages\\studio-core\\src\\lib\\diagnostics\\devTools.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace ErrorEntry interface to include count, firstSeen, lastSeen, fingerprint
const oldErrorInterface = `export interface ErrorEntry {
  timestamp: number;
  message: string;
  stack: string;
  source: string;
  module: string;
}`;

const newErrorInterface = `export interface ErrorEntry {
  id: string;
  fingerprint: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
  timestamp: number;
  message: string;
  stack: string;
  source: string;
  module: string;
}`;

content = content.replace(oldErrorInterface, newErrorInterface);

// Add normalizeErrorInput and getErrorFingerprint helpers
const normalizationHelpers = `
// Smart Error Normalizer to eliminate 'console.error {}' and format raw values
export function normalizeErrorInput(...args: any[]): { message: string; stack: string } {
  if (args.length === 0) {
    return { message: 'Empty error logged', stack: '' };
  }

  let messageParts: string[] = [];
  let extractedStack = '';

  for (const arg of args) {
    if (arg === null || arg === undefined) {
      messageParts.push(String(arg));
      continue;
    }

    if (arg instanceof Error) {
      messageParts.push(arg.message || arg.name || 'Unknown Error');
      if (arg.stack && !extractedStack) {
        extractedStack = arg.stack;
      }
      continue;
    }

    if (typeof arg === 'object') {
      if (arg.message && typeof arg.message === 'string') {
        messageParts.push(arg.message);
        if (arg.stack && typeof arg.stack === 'string' && !extractedStack) {
          extractedStack = arg.stack;
        }
        continue;
      }

      if (arg.reason || arg.cause) {
        const sub = arg.reason || arg.cause;
        if (sub instanceof Error) {
          messageParts.push(sub.message);
          if (sub.stack && !extractedStack) extractedStack = sub.stack;
        } else if (typeof sub === 'string') {
          messageParts.push(sub);
        } else {
          messageParts.push(JSON.stringify(sub));
        }
        continue;
      }

      // Check non-enumerable properties or JSON stringify
      try {
        const json = JSON.stringify(arg);
        if (json === '{}') {
          const keys = Object.getOwnPropertyNames(arg);
          if (keys.length > 0) {
            const kv = keys.map((k) => \`\${k}: \${arg[k]}\`).join(', ');
            messageParts.push(\`[\${arg.constructor?.name || 'Object'}: \${kv}]\`);
          } else {
            messageParts.push(\`[\${arg.constructor?.name || 'Empty Object {}'}]\`);
          }
        } else {
          messageParts.push(json);
        }
      } catch (_) {
        messageParts.push(String(arg));
      }
      continue;
    }

    messageParts.push(String(arg));
  }

  const finalMessage = messageParts.filter(Boolean).join(' ') || 'Unknown Error';
  return { message: finalMessage, stack: extractedStack };
}

// Generate stable fingerprint for smart error grouping
export function getErrorFingerprint(module: string, message: string, stack: string): string {
  const firstStackLine = stack ? stack.split('\\n')[0].trim() : '';
  const cleanMsg = message.replace(/0x[0-9a-fA-F]+/g, '').substring(0, 150);
  return \`\${module}|\${cleanMsg}|\${firstStackLine}\`;
}
`;

content = content.replace('let initialized = false;', normalizationHelpers + '\nlet initialized = false;');

// Replace addError with Smart Error Grouping engine
const oldAddError = `export function addError(err: Omit<ErrorEntry, 'timestamp'>) {
  const isDevMode = useSettingsStore.getState().settings.developerMode;
  if (!isDevMode) return;

  const isFirestore =
    err.message.includes('@firebase/firestore') || err.message.toLowerCase().includes('firestore');

  errorsBuffer.push({
    ...err,
    module: isFirestore ? 'network' : err.module,
    source: isFirestore ? 'Firestore' : err.source,
    timestamp: Date.now(),
  });

  if (errorsBuffer.length > MAX_ITEMS) errorsBuffer.shift();
  notifyListeners();
}`;

const newAddError = `export function addError(err: Partial<ErrorEntry> & { message: string }) {
  const isDevMode = useSettingsStore.getState().settings.developerMode;
  if (!isDevMode && !initialized) return;

  const isFirestore =
    err.message.includes('@firebase/firestore') || err.message.toLowerCase().includes('firestore');
  const targetModule = isFirestore ? 'network' : (err.module || 'general');
  const targetSource = isFirestore ? 'Firestore' : (err.source || 'runtime');
  const stack = err.stack || '';
  const fingerprint = getErrorFingerprint(targetModule, err.message, stack);

  const existingIndex = errorsBuffer.findIndex((e) => e.fingerprint === fingerprint);

  if (existingIndex !== -1) {
    const existing = errorsBuffer[existingIndex];
    existing.count += 1;
    existing.lastSeen = Date.now();
    existing.timestamp = Date.now();
    // Move updated error to top of buffer
    errorsBuffer.splice(existingIndex, 1);
    errorsBuffer.unshift(existing);
  } else {
    const newEntry: ErrorEntry = {
      id: Math.random().toString(36).substring(2, 9),
      fingerprint,
      count: 1,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      timestamp: Date.now(),
      message: err.message,
      stack,
      source: targetSource,
      module: targetModule,
    };
    errorsBuffer.unshift(newEntry);
    if (errorsBuffer.length > MAX_ITEMS) errorsBuffer.pop();
  }

  notifyListeners();
}`;

content = content.replace(oldAddError, newAddError);

// Replace console.error override to use normalizeErrorInput
const oldConsoleError = `  console.error = (...args: any[]) => {
    originalConsole!.error(...args);
    let module = 'general';
    let cleanArgs = args;
    if (typeof args[0] === 'string' && args[0].startsWith('[')) {
      const closeIdx = args[0].indexOf(']');
      if (closeIdx > 0) {
        module = args[0].slice(1, closeIdx);
        const rest = args[0].slice(closeIdx + 1).trim();
        cleanArgs = rest ? [rest, ...args.slice(1)] : args.slice(1);
      }
    }
    addLog('error', module, ...cleanArgs);

    // Add to error viewer automatically
    const msg = cleanArgs
      .map((c) => (typeof c === 'object' ? JSON.stringify(c) : String(c)))
      .join(' ');
    addError({
      message: msg,
      stack: new Error().stack || '',
      source: 'console.error',
      module,
    });
  };`;

const newConsoleError = `  console.error = (...args: any[]) => {
    originalConsole!.error(...args);
    let module = 'general';
    let cleanArgs = args;
    if (typeof args[0] === 'string' && args[0].startsWith('[')) {
      const closeIdx = args[0].indexOf(']');
      if (closeIdx > 0) {
        module = args[0].slice(1, closeIdx);
        const rest = args[0].slice(closeIdx + 1).trim();
        cleanArgs = rest ? [rest, ...args.slice(1)] : args.slice(1);
      }
    }

    const { message, stack } = normalizeErrorInput(...cleanArgs);
    addLog('error', module, message);

    addError({
      message,
      stack: stack || new Error().stack || '',
      source: 'console.error',
      module,
    });
  };`;

content = content.replace(oldConsoleError, newConsoleError);

// Replace window.onerror and unhandledrejection handlers
const oldWindowError = `  // Intercept Global Errors & Unhandled Rejections
  window.addEventListener('error', (e) => {
    addError({
      message: e.message || String(e.error),
      stack: e.error?.stack || '',
      source: e.filename ? \`\${e.filename}:\${e.lineno}:\${e.colno}\` : 'window.onerror',
      module: 'general',
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    addError({
      message: reason?.message || String(reason),
      stack: reason?.stack || '',
      source: 'unhandledrejection',
      module: 'general',
    });
  });`;

const newWindowError = `  // Intercept Global Errors & Unhandled Rejections
  window.addEventListener('error', (e) => {
    const { message, stack } = normalizeErrorInput(e.error || e.message);
    addError({
      message,
      stack: stack || (e.error && e.error.stack) || '',
      source: e.filename ? \`\${e.filename}:\${e.lineno}:\${e.colno}\` : 'window.onerror',
      module: 'general',
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    const { message, stack } = normalizeErrorInput(e.reason);
    addError({
      message: message ? \`Unhandled Rejection: \${message}\` : 'Unhandled Rejection',
      stack,
      source: 'unhandledrejection',
      module: 'general',
    });
  });`;

content = content.replace(oldWindowError, newWindowError);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully upgraded devTools.ts with Smart Error Grouping and Empty Object Normalization!');
