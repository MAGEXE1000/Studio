import puppeteer from 'puppeteer';

let page = null;

function findNavigationNode(node) {
  if (!node) return null;
  if (node.role === 'button' && (node.name === 'Profile' || node.name === 'Home' || node.name === 'Settings' || node.name === 'Songs' || node.name === 'Library' || node.name === 'Preferences' || node.name === 'Beats' || node.name === 'Patterns' || node.name === 'Setup' || node.name === 'Stage')) {
    return { role: node.role, name: node.name };
  }
  if (node.children) {
    const list = [];
    for (const child of node.children) {
      const match = findNavigationNode(child);
      if (match) {
        if (Array.isArray(match)) {
          list.push(...match);
        } else {
          list.push(match);
        }
      }
    }
    if (list.length > 0) return list;
  }
  return null;
}

(async () => {
  console.log('Launching browser in headless "new" mode...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  // Capture console logs and page errors for diagnostics
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to http://localhost:5173/app...');
  await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle2', timeout: 30000 });

  console.log('Waiting for .glass-nav selector...');
  const initialCheck = await page.evaluate(() => {
    return {
      glassNavExists: !!document.querySelector('.glass-nav'),
      glassNavHTML: document.querySelector('.glass-nav')?.outerHTML || 'not found',
      appShellExists: !!document.querySelector('.studio-app-shell'),
      bodyHTML: document.body.innerHTML.substring(0, 500)
    };
  });
  console.log('INITIAL DOM CHECK:', initialCheck);

  // Wait for .glass-nav to appear (should load quickly now)
  await page.waitForSelector('.glass-nav', { timeout: 30000 });

  console.log('Measuring bottom navigation layout...');
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
    await new Promise(r => setTimeout(r, 500)); // wait for transitions

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

  console.log('Capturing accessibility snapshot of bottom navigation...');
  const axSnapshot = await page.accessibility.snapshot();
  // Find the navigation node and its children in the accessibility tree
  const navAxNode = findNavigationNode(axSnapshot);
  console.log('ACCESSIBILITY SNAPSHOT:');
  console.log(JSON.stringify(navAxNode || axSnapshot, null, 2));

  await browser.close();
})().catch(async err => {
  console.error('Puppeteer error:', err);
  if (page) {
    try {
      console.log('CURRENT URL:', page.url());
      const bodyHTML = await page.evaluate(() => document.body.innerHTML);
      console.log('BODY HTML LENGTH:', bodyHTML.length);
      console.log('Is .glass-nav present in HTML string?', bodyHTML.includes('glass-nav'));
      console.log('Is .shared-bottom-nav present in HTML string?', bodyHTML.includes('shared-bottom-nav'));
      console.log('BODY HTML PREVIEW:', bodyHTML.substring(0, 1000));
    } catch (e) {
      console.error('Failed to log page details:', e);
    }
  }
  process.exit(1);
});
