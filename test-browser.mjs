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
page.on('console', msg => {
  consoleLogs.push({ type: msg.type(), text: msg.text() });
});
page.on('pageerror', err => {
  consoleLogs.push({ type: 'pageerror', text: err.message });
});

console.log('Navigating to page...');
await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

console.log('Waiting 30 seconds for kernel to boot...');
await page.waitForTimeout(30000);

console.log('=== CONSOLE LOGS ===');
for (const log of consoleLogs) {
  console.log(`[${log.type}] ${log.text}`);
}

const terminalText = await page.evaluate(() => {
  if (window.term) return 'window.term exists, write=' + typeof window.term.write;
  return 'no window.term';
});
console.log('Terminal:', terminalText);

const moduleState = await page.evaluate(() => {
  if (!window.Module) return 'No Module';
  return 'ccall=' + typeof window.Module.ccall + ' _baseUrl=' + window.Module._baseUrl;
});
console.log('Module:', moduleState);

await browser.close();
