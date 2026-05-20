import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text().slice(0, 200));
  });
  
  page.on('pageerror', err => {
    errors.push('PAGE_ERROR: ' + err.message.slice(0, 300));
  });
  
  // Test Library page
  console.log('=== Testing Library (/) ===');
  await page.goto('http://localhost:5000/#/', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  const libraryRoot = await page.evaluate(() => {
    const r = document.getElementById('root');
    if (!r) return 'NO ROOT';
    // Check for visible content
    const body = document.body;
    const hasChildren = body ? body.children.length : 0;
    const text = body ? body.innerText.slice(0, 100) : '';
    return { hasChildren, text };
  });
  console.log('Library root:', JSON.stringify(libraryRoot));
  
  // Test Friends page
  console.log('\n=== Testing Friends (/friends) ===');
  await page.goto('http://localhost:5000/#/friends', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  const friendsRoot = await page.evaluate(() => {
    const r = document.getElementById('root');
    if (!r) return 'NO ROOT';
    const text = r.innerText.slice(0, 100);
    return { text };
  });
  console.log('Friends root:', JSON.stringify(friendsRoot));
  
  // Test Settings page
  console.log('\n=== Testing Settings (/settings) ===');
  await page.goto('http://localhost:5000/#/settings', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  const settingsRoot = await page.evaluate(() => {
    const r = document.getElementById('root');
    if (!r) return 'NO ROOT';
    const text = r.innerText.slice(0, 100);
    return { text };
  });
  console.log('Settings root:', JSON.stringify(settingsRoot));
  
  console.log('\n=== ERRORS ===');
  if (errors.length === 0) console.log('No errors!');
  else errors.forEach((e, i) => console.log(`${i+1}. ${e}`));
  
  await browser.close();
})();