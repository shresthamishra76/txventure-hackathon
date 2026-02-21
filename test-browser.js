// Browser automation test script
// Run with: node test-browser.js

const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Set viewport size
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  // Capture errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 10000 });
  
  // Wait for the page to load
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'screenshot-initial.png', fullPage: true });
  console.log('Screenshot saved: screenshot-initial.png');
  
  // Check if elements exist
  const headerExists = await page.$('header');
  const controlPanelExists = await page.$('.w-\\[280px\\]');
  const mapExists = await page.$('.leaflet-container');
  
  console.log('\n=== Page Elements ===');
  console.log('Header exists:', !!headerExists);
  console.log('Control Panel exists:', !!controlPanelExists);
  console.log('Map exists:', !!mapExists);
  
  // Count nodes
  const nodeCount = await page.$$eval('[class*="absolute pointer-events-auto cursor-pointer"]', nodes => nodes.length);
  console.log('Visible nodes:', nodeCount);
  
  console.log('\n=== Console Messages ===');
  consoleMessages.forEach(msg => {
    console.log(`[${msg.type}] ${msg.text}`);
  });
  
  console.log('\n=== JavaScript Errors ===');
  if (errors.length === 0) {
    console.log('No JavaScript errors detected!');
  } else {
    errors.forEach(err => console.log('ERROR:', err));
  }
  
  // Keep browser open for manual inspection
  console.log('\nBrowser will stay open. Press Ctrl+C to close.');
  
  // Don't close the browser automatically
  // await browser.close();
})();
