import puppeteer from 'puppeteer';
import fs from 'fs';

async function runProfiler() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Inject FPS monitor and React Profiler data collection
  await page.evaluateOnNewDocument(() => {
    window.__FPS_DATA__ = [];
    let lastFrameTime = performance.now();
    let frameCount = 0;

    function measureFPS() {
      const now = performance.now();
      frameCount++;
      if (now - lastFrameTime >= 1000) {
        window.__FPS_DATA__.push(frameCount);
        frameCount = 0;
        lastFrameTime = now;
      }
      requestAnimationFrame(measureFPS);
    }
    requestAnimationFrame(measureFPS);
  });

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // 1. Cold Startup
  const startupTimings = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paints = performance.getEntriesByType('paint');
    return {
      fetchStart: nav?.fetchStart || 0,
      domInteractive: nav?.domInteractive || 0,
      domComplete: nav?.domComplete || 0,
      firstPaint: paints.find((p) => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paints.find((p) => p.name === 'first-contentful-paint')?.startTime || 0,
    };
  });

  // 2. Initial Heap
  const initialHeap = await page.evaluate(() => {
    return performance.memory ? performance.memory.usedJSHeapSize : 0;
  });

  // 3. Sub-app switch latency (Simulate clicks on sidebars)
  console.log('Testing Sub-app switches...');
  await page.evaluate(() => {
    window.__NAV_TIMINGS__ = {};
  });

  const appsToTest = ['Chordex', 'Drumex', 'Stagex', 'Groovex', 'Vocalex'];
  for (const app of appsToTest) {
    try {
      console.log(`Clicking ${app}...`);
      await page.evaluate((appName) => {
        // Find a sidebar label or button with the app name
        const el = Array.from(document.querySelectorAll('*')).find(
          (e) =>
            (e.tagName === 'DIV' ||
              e.tagName === 'BUTTON' ||
              e.tagName === 'A' ||
              e.tagName === 'SPAN') &&
            e.innerText &&
            e.innerText.trim() === appName &&
            e.children.length === 0 // typically the text node container
        );
        if (el) {
          const t0 = performance.now();
          el.click();
          window.__NAV_TIMINGS__[appName] = { start: t0 };
        }
      }, app);
      // Wait for 1 second for render to complete
      await new Promise((r) => setTimeout(r, 1000));
      await page.evaluate((appName) => {
        if (window.__NAV_TIMINGS__[appName]) {
          window.__NAV_TIMINGS__[appName].end = performance.now();
        }
      }, app);
    } catch (e) {
      console.log(`Failed to click ${app}`);
    }
  }

  // 4. Get final heap
  const finalHeap = await page.evaluate(() => {
    return performance.memory ? performance.memory.usedJSHeapSize : 0;
  });

  // 5. Get FPS
  const fpsData = await page.evaluate(() => window.__FPS_DATA__);
  const avgFps = fpsData.length > 0 ? fpsData.reduce((a, b) => a + b, 0) / fpsData.length : 60;
  const minFps = fpsData.length > 0 ? Math.min(...fpsData) : 60;

  // 6. Get React Profiler Data
  const reactData = await page.evaluate(() => window.__REACT_PROFILE_DATA__ || []);

  const navTimings = await page.evaluate(() => window.__NAV_TIMINGS__);

  const report = {
    startup: {
      coldDomInteractive: startupTimings.domInteractive,
      firstPaint: startupTimings.firstPaint,
      firstContentfulPaint: startupTimings.firstContentfulPaint,
    },
    memory: {
      initialHeapMB: initialHeap / (1024 * 1024),
      finalHeapMB: finalHeap / (1024 * 1024),
      growthMB: (finalHeap - initialHeap) / (1024 * 1024),
    },
    fps: {
      average: avgFps,
      minimum: minFps,
      drops: fpsData.filter((f) => f < 55).length,
    },
    navigation: Object.fromEntries(
      Object.entries(navTimings).map(([k, v]) => [k, v.end - v.start])
    ),
    reactProfiler: reactData,
  };

  fs.writeFileSync('performance-benchmark.json', JSON.stringify(report, null, 2));
  console.log('Report saved to performance-benchmark.json');

  await browser.close();
}

runProfiler().catch(console.error);
