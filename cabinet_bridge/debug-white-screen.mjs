import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  const logs = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', err => errors.push('PAGE ERROR: ' + err.message));
  
  try {
    await page.goto('http://localhost:5000/#/', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    const bodyHtml = await page.evaluate(() => document.body ? document.body.innerHTML.slice(0, 500) : 'no body');
    const hasContent = await page.evaluate(() => document.body ? document.body.childElementCount : 0);
    
    console.log('Title:', title);
    console.log('Body children:', hasContent);
    console.log('Body HTML snippet:', bodyHtml.slice(0, 200));
    
    if (errors.length) {
      console.log('\n=== ERRORS ===');
      errors.forEach(e => console.log(e));
    } else {
      console.log('\nNo console errors!');
    }
  } catch (e) {
    console.log('Navigation error:', e.message);
  }
  
  await browser.close();
})();