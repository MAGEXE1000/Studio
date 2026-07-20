import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
    ],
  });
  const page = await browser.newPage();

  page.on('console', (msg) => {
    console.log(`[${msg.type()}]`, msg.text());
  });

  page.on('pageerror', (err) => {
    console.log('[PAGE ERROR]', err.message, err.stack);
  });

  console.log('Navigating to landing page...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

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

  console.log('Navigating to PitchPanel...');
  await page.evaluate(() => {
    window.NavigationDispatcher.push({ app: 'vocalex', page: 'pitch' });
  });
  await new Promise((r) => setTimeout(r, 2000));

  console.log('Navigating to TakesPanel...');
  await page.evaluate(() => {
    window.NavigationDispatcher.push({ app: 'vocalex', page: 'takes' });
  });
  await new Promise((r) => setTimeout(r, 2000));

  console.log('Navigating to Recording...');
  await page.evaluate(() => {
    window.NavigationDispatcher.push({ app: 'vocalex', page: 'takes', subView: 'recording' });
  });
  await new Promise((r) => setTimeout(r, 2000));

  console.log('Done.');
  await browser.close();
})();
