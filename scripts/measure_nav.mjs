import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to http://localhost:5173/...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for .glass-nav to appear
  await page.waitForSelector('.glass-nav', { timeout: 15000 });

  const measurements = await page.evaluate(async () => {
    const glassNav = document.querySelector('.glass-nav');
    const activeTab = document.querySelector('[data-nav-item-index="0"]') || document.querySelector('[data-nav-item-index]') || document.querySelector('nav button');
    const htmlEl = document.documentElement;

    const navStyleBefore = window.getComputedStyle(glassNav);
    const navOriginBefore = navStyleBefore.transformOrigin;
    const navRectBefore = glassNav.getBoundingClientRect();
    const activeTabRectBefore = activeTab ? activeTab.getBoundingClientRect() : null;
    const activeTabOffsetBefore = activeTab ? {
      offsetLeft: activeTab.offsetLeft,
      offsetWidth: activeTab.offsetWidth,
      parentOffsetWidth: activeTab.offsetParent?.offsetWidth
    } : null;

    // Trigger collapsed state
    htmlEl.setAttribute('data-nav-collapsed', 'true');
    await new Promise(r => setTimeout(r, 500)); // wait for CSS transition

    const navStyleAfter = window.getComputedStyle(glassNav);
    const navOriginAfter = navStyleAfter.transformOrigin;
    const navTransformAfter = navStyleAfter.transform;
    const navRectAfter = glassNav.getBoundingClientRect();
    const activeTabRectAfter = activeTab ? activeTab.getBoundingClientRect() : null;

    return {
      navOriginBefore,
      navOriginAfter,
      navTransformAfter,
      navRectBefore: { left: navRectBefore.left, top: navRectBefore.top, width: navRectBefore.width, height: navRectBefore.height },
      navRectAfter: { left: navRectAfter.left, top: navRectAfter.top, width: navRectAfter.width, height: navRectAfter.height },
      activeTabRectBefore: activeTabRectBefore ? { left: activeTabRectBefore.left, top: activeTabRectBefore.top, width: activeTabRectBefore.width, height: activeTabRectBefore.height } : null,
      activeTabRectAfter: activeTabRectAfter ? { left: activeTabRectAfter.left, top: activeTabRectAfter.top, width: activeTabRectAfter.width, height: activeTabRectAfter.height } : null,
      activeTabOffsetBefore
    };
  });

  console.log('MEASUREMENT RESULTS:');
  console.log(JSON.stringify(measurements, null, 2));

  await browser.close();
})().catch(err => {
  console.error('Puppeteer error:', err);
  process.exit(1);
});
