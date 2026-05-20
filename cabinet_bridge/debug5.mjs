import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', err => errors.push(err.message.slice(0, 400)));
  
  await page.goto('http://localhost:5000/#/', { timeout: 20000 });
  await page.waitForTimeout(5000);
  
  // Check the full page structure
  const info = await page.evaluate(() => {
    const root = document.getElementById('root');
    const body = document.body;
    const html = document.documentElement;
    
    return {
      rootExists: !!root,
      rootChildren: root ? root.children.length : -1,
      rootHTML: root ? root.innerHTML.slice(0, 500) : 'N/A',
      bodyBg: window.getComputedStyle(body).backgroundColor,
      rootBg: root ? window.getComputedStyle(root).backgroundColor : 'N/A',
      rootDisplay: root ? window.getComputedStyle(root).display : 'N/A',
      htmlBg: window.getComputedStyle(html).backgroundColor,
      allStyles: {
        bodyBg: window.getComputedStyle(document.body).backgroundColor,
        bodyMargin: window.getComputedStyle(document.body).margin,
        rootDisplay: root ? window.getComputedStyle(root).display : 'N/A',
        rootBg: root ? window.getComputedStyle(root).backgroundColor : 'N/A',
        rootMinH: root ? window.getComputedStyle(root).minHeight : 'N/A',
      }
    };
  });
  
  console.log('Page info:', JSON.stringify(info, null, 2));
  
  if (errors.length > 0) {
    console.log('\n=== PAGE ERRORS ===');
    errors.forEach((e, i) => console.log(i + 1 + '. ' + e));
  } else {
    console.log('\nNo page errors!');
  }
  
  await browser.close();
})();