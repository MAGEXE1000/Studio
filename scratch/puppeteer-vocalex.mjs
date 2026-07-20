import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Capture console messages
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (err) => console.error('PAGE ERROR:', err.toString()));

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    // Assuming we need to click to open Vocalex.
    // The vocalex app is probably available on the hub.
    // I can also try navigating to it directly if there's a route, but usually it's clicked.
    // Wait for the app to load
    await page.waitForTimeout(2000);
    // Print the HTML to see what to click
    const content = await page.content();
    if (content.includes('Vocalex')) {
      // Let's click it
      const [button] = await page.$x("//*[contains(text(), 'Vocalex')]");
      if (button) {
        await button.click();
        await page.waitForTimeout(2000);
      } else {
        console.log('Could not find Vocalex button');
      }
    }
  } catch (err) {
    console.error('SCRIPT ERROR:', err);
  } finally {
    await browser.close();
  }
})();
