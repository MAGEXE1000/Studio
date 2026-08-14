import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 3000;
const DIST_DIR = path.resolve('dist/android-web');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const cleanPath = path.normalize(req.url === '/' ? '/index.html' : req.url.split('?')[0]).replace(/^(\.\.[\/\\])+/, '');
  const targetPath = path.resolve(DIST_DIR, '.' + cleanPath);
  const rel = path.relative(DIST_DIR, targetPath);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  let safePath = path.resolve(DIST_DIR, rel);
  if (!fs.existsSync(safePath) && fs.existsSync(safePath + '.html')) {
    safePath = safePath + '.html';
  } else if (!fs.existsSync(safePath)) {
    safePath = path.resolve(DIST_DIR, 'index.html');
  }

  const extname = String(path.extname(safePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(safePath, (error, content) => {
    if (error) {
      if(error.code == 'ENOENT'){
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(500);
        res.end('Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  
  try {
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
    });
    const page = await browser.newPage();
    
    // Intercept requests to simulate update API responses if needed
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().includes('version.json')) {
        request.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ version: "4.5.6", mandatory: false })
        });
      } else {
        request.continue();
      }
    });

    page.on('pageerror', (err) => {
      console.log('PAGE ERROR:', err.toString());
      console.log('STACK:', err.stack);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('CONSOLE ERROR:', msg.text());
      }
    });

    console.log('Navigating to app...');
    await page.goto(`http://localhost:${PORT}/`);
    
    console.log('Waiting 10 seconds for app to mount and trigger animations...');
    await new Promise(r => setTimeout(r, 10000));
    
    await browser.close();
  } catch (err) {
    console.error('Puppeteer error:', err);
  } finally {
    server.close();
  }
});
