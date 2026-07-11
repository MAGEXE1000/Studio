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
}

const STORAGE_KEY = 'studio:updater_flight_recorder_events';
const MAX_EVENTS = 1000; // Bounded maximum to prevent storage leaks
const RETENTION_DAYS = 7;

export class UpdaterFlightRecorder {
  private static events: FlightRecorderEvent[] = [];
  private static loaded = false;

  private static load() {
    if (this.loaded) return;
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.events = JSON.parse(stored);
          this.prune();
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

  private static prune() {
    const cutOff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    // 1. Filter out items older than 7 days
    let filtered = this.events.filter(e => e.timestamp >= cutOff);
    // 2. Limit to MAX_EVENTS count
    if (filtered.length > MAX_EVENTS) {
      filtered = filtered.slice(filtered.length - MAX_EVENTS);
    }
    this.events = filtered;
  }

  public static record(event: Omit<FlightRecorderEvent, 'timestamp'> & { timestamp?: number }) {
    this.load();
    const fullEvent: FlightRecorderEvent = {
      timestamp: event.timestamp || Date.now(),
      ...event
    };

    // Compress consecutive identical entries to prevent excessive log size & noise
    const lastEvent = this.events[this.events.length - 1];
    if (lastEvent &&
        lastEvent.eventType === fullEvent.eventType &&
        lastEvent.newState === fullEvent.newState &&
        lastEvent.previousState === fullEvent.previousState &&
        lastEvent.caller === fullEvent.caller &&
        lastEvent.error === fullEvent.error &&
        lastEvent.warning === fullEvent.warning) {
      lastEvent.count = (lastEvent.count || 1) + 1;
      lastEvent.timestamp = fullEvent.timestamp;
      lastEvent.reason = `${fullEvent.reason || ''} (Repeated ${lastEvent.count} times)`;
      this.save();
      return;
    }

    this.events.push(fullEvent);
    this.prune();
    this.save();

    // Log to JS console as well for diagnostic convenience
    const warningText = fullEvent.warning ? ` [WARNING: ${fullEvent.warning}]` : '';
    const errorText = fullEvent.error ? ` [ERROR: ${fullEvent.error}]` : '';
    console.log(`[FlightRecorder] [${fullEvent.thread.toUpperCase()}] ${fullEvent.eventType} | Caller: ${fullEvent.caller} | Reason: ${fullEvent.reason || 'None'}${warningText}${errorText}`);
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
