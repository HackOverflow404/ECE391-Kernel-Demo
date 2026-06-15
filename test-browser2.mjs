import { chromium } from '@playwright/test';

const CHROMIUM_PATH = process.env.HOME + '/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const browser = await chromium.launch({ 
  executablePath: CHROMIUM_PATH,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
const context = await browser.newContext();
const page = await context.newPage();

const consoleLogs = [];
const networkReqs = [];
page.on('console', msg => {
  consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', err => {
  consoleLogs.push(`[pageerror] ${err.message}`);
});
page.on('request', req => {
  const url = req.url();
  if (url.includes('/emu/')) networkReqs.push('REQ: ' + url.split('/emu/')[1]);
});
page.on('response', res => {
  const url = res.url();
  if (url.includes('/emu/')) networkReqs.push(`RES(${res.status()}): ` + url.split('/emu/')[1]);
});

await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
await page.waitForTimeout(20000);

console.log('=== CONSOLE LOGS ===');
consoleLogs.forEach(l => console.log(l));
console.log('\n=== NETWORK (/emu/) ===');
networkReqs.forEach(r => console.log(r));

// Try calling vm_start manually and check for output
const result = await page.evaluate(() => {
  return {
    moduleType: typeof window.Module,
    ccallType: typeof window.Module?.ccall,
    vmStartType: typeof window.Module?._vm_start,
    termType: typeof window.term,
    termWrite: typeof window.term?.write
  };
});
console.log('\n=== STATE ===', JSON.stringify(result));

await browser.close();
