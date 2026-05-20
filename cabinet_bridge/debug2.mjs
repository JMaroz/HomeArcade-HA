import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  page.on('pageerror', err => {
    errors.push('PAGE_ERROR: ' + err.message);
  });
  
  try {
    // Wait for network to settle
    await page.goto('http://localhost:5000/#/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);
    
    // Check what's in the DOM
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      if (!root) return 'NO ROOT ELEMENT';
      return root.innerHTML.slice(0, 800);
    });
    
    const title = await page.title();
    console.log('=== RESULTS ===');
    console.log('Title:', title);
    console.log('Root content:', rootContent);
    
    if (errors.length > 0) {
      console.log('\n=== ERRORS ===');
      errors.forEach((e, i) => console.log(`${i+1}. ${e}`));
    } else {
      console.log('\nNo errors!');
    }
  } catch (e) {
    console.log('Error running test:', e.message);
  }
  
  await browser.close();
})();