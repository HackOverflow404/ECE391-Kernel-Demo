import { chromium } from '@playwright/test';

const CHROMIUM_PATH = process.env.HOME + '/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';

const browser = await chromium.launch({ 
  executablePath: CHROMIUM_PATH,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
const context = await browser.newContext();
const page = await context.newPage();

const logs = [];
const errors = [];

page.on('console', msg => {
  const type = msg.type();
  const text = msg.text();
  if (type === 'error') errors.push('[ERR] ' + text);
  else logs.push('[' + type + '] ' + text);
});

page.on('pageerror', err => errors.push('[PAGEERR] ' + err.message));

await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

// Wait 30 seconds for kernel to boot and mount filesystem
await page.waitForTimeout(30000);

console.log('\n=== CONSOLE ERRORS (includes stderr from WASM) ===');
for (const e of errors) console.log(e);

console.log('\n=== CONSOLE LOGS ===');
for (const l of logs.filter(l => l.includes('TEMU') || l.includes('viocons') || l.includes('xterm')))
  console.log(l);

// Capture xterm terminal text content
try {
  const termText = await page.evaluate(() => {
    // Try xterm.js internal buffer
    const termEl = document.querySelector('.xterm-rows');
    if (termEl) return termEl.innerText;
    // fallback: any element with terminal-ish class
    const any = document.querySelector('[class*="xterm"]');
    return any ? any.innerText : '(no xterm element found)';
  });
  console.log('\n=== TERMINAL TEXT ===');
  console.log(termText);
} catch (e) {
  console.log('\n=== TERMINAL TEXT (error) ===', e.message);
}

await browser.close();
