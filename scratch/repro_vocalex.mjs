import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  page.on('console', (msg) => {
    if (
      msg.type() === 'error' ||
      msg.text().includes('React Error') ||
      msg.text().includes('Invalid hook call')
    ) {
      console.log('[BROWSER ERROR]', msg.text());
    }
  });
  page.on('pageerror', (err) => {
    console.log('[PAGE ERROR]', err.toString());
  });

  console.log('Navigating to landing page...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  console.log('Clicking USE STUDIO WEB...');
  try {
    const startBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find((el) =>
        el.textContent.includes('USE STUDIO WEB')
      );
    });
    if (startBtn) {
      await startBtn.click();
      await new Promise((r) => setTimeout(r, 2000));
    }
  } catch (e) {}

  // Expose a helper to navigate
  const tabs = ['practice', 'pitch', 'vocalLab', 'takes'];
  for (const tab of tabs) {
    console.log(`Navigating to Vocalex tab: ${tab}...`);
    try {
      await page.evaluate((t) => {
        window.NavigationDispatcher.push({ app: 'vocalex', page: t });
      }, tab);
      await new Promise((r) => setTimeout(r, 1500));
    } catch (e) {
      console.log(`Failed to navigate to tab ${tab}: ${e.message}`);
    }
  }

  console.log('Done.');
  await browser.close();
})();
