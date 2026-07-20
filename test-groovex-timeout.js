const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');

  // Wait for hub
  await page.waitForSelector('.app-mode-hub', { timeout: 10000 });

  console.log('App loaded. Switching to groovex...');

  // Expose a function to collect logs
  const logs = [];
  page.on('console', (msg) => {
    logs.push(msg.text());
    if (msg.text().includes('Safety timeout fired')) {
      console.log('DETECTED: ' + msg.text());
    } else if (msg.text().includes('App preloaded')) {
      console.log('PRELOADED: ' + msg.text());
    }
  });

  // click the groovex card or run command
  try {
    await page.evaluate(() => {
      // use the global store to switch
      const useChordStore = window.__zustand_stores?.useChordStore;
      if (useChordStore) {
        useChordStore.getState().updateSettings({ appMode: 'groovex' });
      } else {
        document
          .querySelector(
            'button[aria-label="Groovex"], .hub-app-card.groovex, [data-testid="app-card-groovex"]'
          )
          .click();
      }
    });
  } catch (e) {
    console.error(e);
  }

  await new Promise((r) => setTimeout(r, 6000)); // wait 6s to see if timeout fires

  const hasLoaded = logs.some((l) => l.includes('App preloaded: groovex'));
  const hasTimeout = logs.some((l) => l.includes('Safety timeout fired'));

  console.log('Loaded fast?', hasLoaded);
  console.log('Timeout fired?', hasTimeout);

  await browser.close();
})();
