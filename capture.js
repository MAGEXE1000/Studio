const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(msg.type() + ': ' + msg.text());
  });

  page.on('pageerror', error => {
    console.log('PAGE_ERROR: ' + error.message);
  });

  try {
    await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle2', timeout: 15000 });
  } catch(e) {
    console.log('Timeout waiting for page load');
  }
  
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})();
