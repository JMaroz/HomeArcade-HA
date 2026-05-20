import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  const consoleLogs = [];
  
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text().slice(0, 300)}`);
    if (msg.type() === 'error') errors.push(msg.text().slice(0, 300));
  });
  
  page.on('pageerror', err => {
    errors.push('PAGE_ERROR: ' + err.message.slice(0, 300));
  });

  // Test the actual deployed URL
  console.log('=== Testing HA Addon URL ===');
  try {
    await page.goto('http://localhost:5000/#/', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    const root = await page.evaluate(() => {
      const r = document.getElementById('root');
      if (!r) return { error: 'NO ROOT', html: '' };
      return { 
        children: r.children.length, 
        text: r.innerText.slice(0, 200),
        html: r.innerHTML.slice(0, 300)
      };
    });
    
    console.log('Root:', JSON.stringify(root, null, 2));
    
    // Check for 404 resources
    const failedRequests = [];
    page.on('requestfailed', req => {
      failedRequests.push(req.url() + ' -> ' + req.failure().errorText);
    });
    
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    if (failedRequests.length > 0) {
      console.log('\n=== FAILED REQUESTS ===');
      failedRequests.forEach(r => console.log(r));
    }
    
  } catch (e) {
    console.log('Navigation error:', e.message);
  }
  
  console.log('\n=== ERRORS ===');
  if (errors.length === 0) console.log('No errors!');
  else errors.forEach((e, i) => console.log(`${i+1}. ${e}`));
  
  await browser.close();
})();