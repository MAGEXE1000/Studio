export function initLongTaskObserver() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const duration = entry.duration;
        let bucket = '';
        if (duration > 200) bucket = '>200ms';
        else if (duration > 100) bucket = '>100ms';
        else if (duration > 50) bucket = '>50ms';
        else if (duration > 33) bucket = '>33ms';
        else if (duration > 16) bucket = '>16ms';
        else if (duration > 8) bucket = '>8ms';

        if (bucket) {
          console.warn(`[LongTask] [${bucket}] Duration: ${duration.toFixed(2)}ms | Name: ${entry.name}`);
        }
      }
    });

    observer.observe({ type: 'longtask', buffered: true });
  } catch (e) {
    console.error('Longtask observer not supported', e);
  }
}
