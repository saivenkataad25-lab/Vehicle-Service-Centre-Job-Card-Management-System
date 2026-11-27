import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const puppeteerModule = await import(process.env.VSC_PUPPETEER_CORE || pathToFileURL(resolve('.tools/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
const puppeteer = puppeteerModule.default || puppeteerModule;
const mode = process.argv[2] || 'all';
const browser = await puppeteer.launch({ headless: true, executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const suffix = Date.now().toString().slice(-6);
const today = new Date().toISOString().slice(0, 10);
const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
let customerId = null;

async function fill(selector, value) {
  await page.$eval(selector, (el, text) => {
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function clickButton(label) {
  const clicked = await page.evaluate((text) => {
    const button = [...document.querySelectorAll('button')].find((candidate) => candidate.textContent.trim() === text);
    if (!button) return false;
    button.click();
    return true;
  }, label);
  if (!clicked) throw new Error(`Button not found: ${label}`);
}

async function shot(name) {
  await page.screenshot({ path: `docs/evidence/${name}`, fullPage: true });
  console.log(`SHOT ${name}`);
}

async function api(method, path, body) {
  const response = await fetch(`http://localhost:8080/api${path}`, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${method} ${path} failed: ${response.status} ${JSON.stringify(data)}`);
  return data;
}

if (mode !== 'pages') {
  await page.goto('http://localhost:4200/dashboard', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.body.innerText.includes('Workload by status'));
  await shot('02-dashboard.png');

  await page.goto('http://localhost:4200/customers/new', { waitUntil: 'networkidle2' });
  await fill('#customer-code', `C-EVID-${suffix}`);
  await fill('#customer-name', 'Evidence Customer');
  await fill('#customer-phone', '1234567890');
  await fill('#customer-email', `evidence${suffix}@test.local`);
  await fill('#customer-address', '1 Evidence Road');
  await clickButton('Save customer');
  await page.waitForFunction(() => /\/customers\/\d+$/.test(location.pathname));
  await page.waitForFunction(() => document.body.innerText.includes('1 Evidence Road'));
  customerId = Number(page.url().split('/').pop());
  await shot('03-create.png');

  await page.goto('http://localhost:4200/customers', { waitUntil: 'networkidle2' });
  await fill('#customer-search', 'Evidence Customer');
  await page.waitForFunction(() => document.body.innerText.includes('Evidence Customer'));
  const listShot = resolve(tmpdir(), `vsc-read-list-${suffix}.png`);
  await page.screenshot({ path: listShot, fullPage: true });

  await page.goto(`http://localhost:4200/customers/${customerId}`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.body.innerText.includes('1 Evidence Road'));
  const detailShot = resolve(tmpdir(), `vsc-read-detail-${suffix}.png`);
  await page.screenshot({ path: detailShot, fullPage: true });

  const composite = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
  :root { color-scheme: dark; font-family: Inter, system-ui, sans-serif; background: #070a10; color: #e8edf6; }
  body { margin: 0; padding: 24px; }
  h1 { font-size: 22px; margin: 0 0 16px; }
  h2 { font-size: 15px; margin: 0 0 8px; color: #8fc2ff; }
  section { margin-bottom: 24px; }
  img { width: 100%; border: 1px solid #263044; border-radius: 8px; }
  </style></head><body><h1>Read evidence: searchable list and record detail</h1>
  <section><h2>1. Customer list filtered by search</h2><img src="${pathToFileURL(listShot).href}"></section>
  <section><h2>2. Selected customer detail</h2><img src="${pathToFileURL(detailShot).href}"></section></body></html>`;
  const compositePath = resolve(tmpdir(), `vsc-read-composite-${suffix}.html`);
  writeFileSync(compositePath, composite);
  await page.goto(pathToFileURL(compositePath).href, { waitUntil: 'load' });
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0));
  await shot('04-read.png');

  await page.goto(`http://localhost:4200/customers/${customerId}/edit`, { waitUntil: 'networkidle2' });
  await fill('#customer-address', '8 Evidence Lane');
  await clickButton('Save customer');
  await page.waitForFunction(() => /\/customers\/\d+$/.test(location.pathname));
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.body.innerText.includes('8 Evidence Lane'));
  await shot('05-update.png');

  const jobs = await api('GET', '/job-cards');
  let openJob = jobs.find((job) => job.jobStatus === 'OPEN');
  if (!openJob) {
    const customer = await api('POST', '/customers', {
      customerCode: `C-EJOB-${suffix}`,
      fullName: 'Evidence Job Customer',
      phone: '1234567891',
      email: `evidencejob${suffix}@test.local`,
      address: '9 Evidence Road'
    });
    const vehicle = await api('POST', '/vehicles', {
      registrationNumber: `EJOB-${suffix}`,
      make: 'Toyota',
      model: 'Hilux',
      year: 2020,
      fuelType: 'DIESEL',
      customerId: customer.id,
      odometerReading: 13000
    });
    const booking = await api('POST', '/service-bookings', {
      bookingNumber: `B-EJOB-${suffix}`,
      vehicleId: vehicle.id,
      bookingDate: today,
      preferredDate: in7,
      complaint: 'Evidence status change',
      bookingStatus: 'CONFIRMED'
    });
    openJob = await api('POST', '/job-cards', {
      bookingId: booking.id,
      technicianId: null,
      openedDate: today,
      promisedDate: in7,
      serviceTasks: [{ taskName: 'Oil change', description: 'Replace oil', estimatedHours: 1, hourlyRate: 40, amount: 0 }]
    });
  }
  await page.goto(`http://localhost:4200/job-cards/${openJob.id}`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.body.innerText.includes('Status history'));
  await clickButton('Start work');
  await page.waitForFunction(() => document.body.innerText.includes('Job card saved.'));
  await page.waitForFunction(() => document.body.innerText.includes('IN_PROGRESS'));
  await shot('06-status.png');
}

for (const [file, name] of [['setup.html', '01-setup.png'], ['api.html', '07-api.png'], ['database.html', '08-database.png']]) {
  await page.goto(pathToFileURL(resolve('docs/evidence', file)).href, { waitUntil: 'load' });
  await shot(name);
}

if (customerId !== null) {
  const deleted = await fetch(`http://localhost:8080/api/customers/${customerId}`, { method: 'DELETE' });
  console.log(`CLEANUP customer=${customerId} status=${deleted.status}`);
}
console.log('EVIDENCE_SCREENSHOTS_OK');
await browser.close();
