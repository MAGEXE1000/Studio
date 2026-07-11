export interface FlightRecorderEvent {
  timestamp: number; // UTC ms
  thread: 'js' | 'native' | 'ui';
  sessionId: string | null;
  workflowId: string | null;
  eventType: string;
  caller: string;
  funcName?: string;
  fileName?: string;
  previousState?: string | null;
  newState?: string | null;
  reason?: string;
  duration?: number;
  warning?: string | null;
  error?: string | null;
  stack?: string | null;
  details?: string;
  count?: number; // Repetition aggregator
  severity?: 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
}

const STORAGE_KEY = 'studio:updater_flight_recorder_events';
const SEVERITY_KEY = 'studio:updater_flight_recorder_severity';
const MAX_EVENTS = 300; // Ring buffer bounds
const MAX_SIZE_BYTES = 50 * 1024; // 50 KB limit
const RETENTION_DAYS = 7;

const SEVERITY_VALUES = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5
};

export class UpdaterFlightRecorder {
  private static events: FlightRecorderEvent[] = [];
  private static loaded = false;
  private static severityLevel: 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL' = 'INFO';

  private static load() {
    if (this.loaded) return;
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.events = JSON.parse(stored);
          this.prune();
        }
        const severity = localStorage.getItem(SEVERITY_KEY);
        if (severity && severity in SEVERITY_VALUES) {
          this.severityLevel = severity as any;
        }
      }
    } catch (e) {
      console.warn('[FlightRecorder] Failed to load persisted events:', e);
    }
    this.loaded = true;
  }

  private static save() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
      }
    } catch (e) {
      console.warn('[FlightRecorder] Failed to persist events:', e);
    }
  }

  private static estimateSize(events: FlightRecorderEvent[]): number {
    try {
      return JSON.stringify(events).length;
    } catch {
      return events.length * 150;
    }
  }

  private static prune() {
    const cutOff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    
    // 1. Filter out items older than 7 days
    let filtered = this.events.filter(e => e.timestamp >= cutOff);

    // 2. Clean up expired sessions (keep only the 5 most recent sessions)
    const sessionIds = Array.from(new Set(filtered.map(e => e.sessionId).filter(Boolean)));
    if (sessionIds.length > 5) {
      const activeSessionsToKeep = sessionIds.slice(sessionIds.length - 5);
      filtered = filtered.filter(e => !e.sessionId || activeSessionsToKeep.includes(e.sessionId));
    }

    // 3. Limit to MAX_EVENTS count
    if (filtered.length > MAX_EVENTS) {
      filtered = filtered.slice(filtered.length - MAX_EVENTS);
    }

    // 4. Limit by size (50KB) - slice from start (oldest) if too large
    while (filtered.length > 0 && this.estimateSize(filtered) > MAX_SIZE_BYTES) {
      filtered.shift();
    }

    this.events = filtered;
  }

  public static setSeverityLevel(level: 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL') {
    this.severityLevel = level;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SEVERITY_KEY, level);
      }
    } catch (_) {}
  }

  public static getSeverityLevel(): 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL' {
    this.load();
    return this.severityLevel;
  }

  public static record(event: Omit<FlightRecorderEvent, 'timestamp'> & { timestamp?: number }) {
    this.load();
    
    const eventSeverity = event.severity || 'INFO';
    if (SEVERITY_VALUES[eventSeverity] < SEVERITY_VALUES[this.severityLevel]) {
      return; // Skip logs below the active severity threshold
    }

    const fullEvent: FlightRecorderEvent = {
      timestamp: event.timestamp || Date.now(),
      severity: eventSeverity,
      ...event
    };

    // Deduplicate / aggregate progress and lifecycle events to prevent excessive noise
    const lastEvent = this.events[this.events.length - 1];
    const isProgress = fullEvent.eventType.toLowerCase().includes('progress');
    const isLifecycle = fullEvent.eventType === 'appStateChange' || fullEvent.eventType.toLowerCase().includes('lifecycle');
    
    if (lastEvent && (
      (lastEvent.eventType === fullEvent.eventType &&
       lastEvent.newState === fullEvent.newState &&
       lastEvent.previousState === fullEvent.previousState &&
       lastEvent.caller === fullEvent.caller &&
       lastEvent.error === fullEvent.error &&
       lastEvent.warning === fullEvent.warning) ||
      (isProgress && lastEvent.eventType.toLowerCase().includes('progress')) ||
      (isLifecycle && (lastEvent.eventType === 'appStateChange' || lastEvent.eventType.toLowerCase().includes('lifecycle')))
    )) {
      lastEvent.count = (lastEvent.count || 1) + 1;
      lastEvent.timestamp = fullEvent.timestamp;
      lastEvent.reason = fullEvent.reason;
      if (fullEvent.newState !== undefined) lastEvent.newState = fullEvent.newState;
      this.prune();
      this.save();
      return;
    }

    this.events.push(fullEvent);
    this.prune();
    this.save();

    // Log to JS console
    const warningText = fullEvent.warning ? ` [WARNING: ${fullEvent.warning}]` : '';
    const errorText = fullEvent.error ? ` [ERROR: ${fullEvent.error}]` : '';
    console.log(`[FlightRecorder] [${fullEvent.severity}] [${fullEvent.thread.toUpperCase()}] ${fullEvent.eventType} | ${fullEvent.reason || 'None'}${warningText}${errorText}`);
  }

  public static getEvents(): FlightRecorderEvent[] {
    this.load();
    return this.events;
  }

  public static clear() {
    this.events = [];
    this.save();
  }
}
