import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const puppeteerModule = await import(process.env.VSC_PUPPETEER_CORE || pathToFileURL(resolve('.tools/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
const puppeteer = puppeteerModule.default || puppeteerModule;

const base = 'http://localhost:4200';
const api = 'http://localhost:8080/api';
const suffix = Date.now().toString().slice(-7);
const today = new Date().toISOString().slice(0, 10);
const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
const customerCode = `C-E2E-${suffix}`;
const customerName = `E2E Driver ${suffix}`;
const registration = `E2E-${suffix}`;
const bookingNumber = `B-E2E-${suffix}`;
const pageErrors = [];

function check(condition, message) {
  if (!condition) {
    throw new Error(`ASSERT: ${message}`);
  }
  console.log(`OK   ${message}`);
}

async function open(page, path) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.page');
}

async function fill(page, selector, value) {
  await page.waitForSelector(selector);
  await page.$eval(selector, (el, text) => {
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function clickText(page, text) {
  const clicked = await page.evaluate((label) => {
    const buttons = [...document.querySelectorAll('button, a')];
    const match = buttons.find((el) => el.textContent.trim() === label);
    if (!match) {
      return false;
    }
    match.click();
    return true;
  }, text);
  check(clicked, `clicked "${text}"`);
}

async function selectByText(page, selector, text) {
  await page.waitForSelector(selector);
  const value = await page.$$eval(`${selector} option`, (options, label) => {
    const match = options.find((option) => option.textContent.includes(label));
    return match ? match.value : null;
  }, text);
  check(value !== null, `option containing "${text}" exists in ${selector}`);
  await page.select(selector, value);
}

async function waitForPath(page, pattern) {
  await page.waitForFunction((source) => new RegExp(source).test(location.pathname), {}, pattern.source);
}

async function bodyText(page) {
  return page.$eval('body', (el) => el.innerText);
}

const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('favicon')) {
      pageErrors.push(message.text());
    }
  });

  await open(page, '/customers/new');
  await fill(page, '#customer-code', customerCode);
  await fill(page, '#customer-name', customerName);
  await fill(page, '#customer-phone', `555${suffix}`);
  await fill(page, '#customer-email', `e2e${suffix}@test.local`);
  await fill(page, '#customer-address', '12 Smoke Test Road');
  await clickText(page, 'Save customer');
  await waitForPath(page, /^\/customers\/\d+$/);
  const customerId = Number(new URL(page.url()).pathname.split('/').pop());
  check(customerId > 0, `customer created via UI (id ${customerId})`);

  await open(page, '/vehicles/new');
  await fill(page, '#vehicle-registration', registration);
  await selectByText(page, '#vehicle-customer', customerName);
  await fill(page, '#vehicle-make', 'Toyota');
  await fill(page, '#vehicle-model', 'Hilux');
  await fill(page, '#vehicle-year', '2020');
  await selectByText(page, '#vehicle-fuel', 'Diesel');
  await fill(page, '#vehicle-odometer', '88000');
  await clickText(page, 'Save vehicle');
  await waitForPath(page, /^\/vehicles\/\d+$/);
  const vehicleId = Number(new URL(page.url()).pathname.split('/').pop());
  check(vehicleId > 0, `vehicle created via UI (id ${vehicleId})`);

  await open(page, '/bookings/new');
  await fill(page, '#booking-number', bookingNumber);
  await selectByText(page, '#booking-vehicle', registration);
  await fill(page, '#booking-date', today);
  await fill(page, '#booking-preferred', in7);
  await fill(page, '#booking-complaint', 'E2E smoke: engine noise and oil seepage.');
  await selectByText(page, '#booking-status', 'Confirmed');
  await clickText(page, 'Save booking');
  await waitForPath(page, /^\/bookings\/\d+$/);
  const bookingId = Number(new URL(page.url()).pathname.split('/').pop());
  check(bookingId > 0, `confirmed booking created via UI (id ${bookingId})`);
  await page.waitForFunction(() => document.body.innerText.includes('Customer complaint'));
  const bookingPage = await bodyText(page);
  check(bookingPage.includes('CONFIRMED') || bookingPage.includes('Confirmed'), 'booking detail shows confirmed status');
  check(bookingPage.includes('Create job card'), 'confirmed booking offers job-card conversion');

  await clickText(page, 'Create job card');
  await waitForPath(page, /^\/job-cards\/new/);
  await page.waitForSelector('#job-booking');
  const bookingValue = await page.$$eval('#job-booking option', (options, label) => {
    const match = options.find((option) => option.textContent.includes(label));
    return match ? match.value : null;
  }, bookingNumber);
  check(bookingValue !== null, 'booking preselected by query param');
  await page.select('#job-booking', bookingValue);
  const technicians = await (await fetch(`${api}/technicians`)).json();
  const tech = technicians.find((item) => item.availabilityStatus === 'AVAILABLE') ?? technicians[0];
  check(Boolean(tech), 'technician available for assignment');
  await selectByText(page, '#job-technician', tech.fullName);
  await fill(page, '#task-name-0', 'E2E inspection');
  await fill(page, '#task-description-0', 'Smoke test inspection task.');
  await fill(page, '#task-hours-0', '2');
  await fill(page, '#task-rate-0', '60');
  await clickText(page, 'Create job card');
  await waitForPath(page, /^\/job-cards\/\d+$/);
  const jobId = Number(new URL(page.url()).pathname.split('/').pop());
  check(jobId > 0, `job card created via UI (id ${jobId})`);
  await page.waitForFunction(() => document.body.innerText.includes('Status history'));
  let jobPage = await bodyText(page);
  const jobNumber = (jobPage.match(/JC-\S+/) ?? [])[0];
  check(Boolean(jobNumber), `job card number displayed (${jobNumber})`);
  check(jobPage.includes('120.00'), 'recalculated labour estimate formatted to 2 decimals');
  check(!/\d{4}-\d{2}-\d{2}\b/.test(jobPage), 'job card detail shows no raw ISO dates');

  await clickText(page, 'Start work');
  await page.waitForFunction(() => document.body.innerText.includes('Job card saved.'));
  check((await bodyText(page)).includes('IN_PROGRESS'), 'OPEN -> IN_PROGRESS transition persisted');

  await fill(page, '#detail-notes', 'E2E smoke: inspection completed, no further work required.');
  await clickText(page, 'Complete work');
  await page.waitForFunction(() => document.body.innerText.includes('Job card saved.'));
  jobPage = await bodyText(page);
  check(jobPage.includes('COMPLETED'), 'IN_PROGRESS -> COMPLETED transition persisted');
  check((await page.$eval('#detail-notes', (el) => el.value)).includes('E2E smoke: inspection completed'), 'completion notes persisted');
  check(jobPage.includes('Status history'), 'status history retained');

  await open(page, `/job-cards/${jobId}`);
  await page.waitForFunction(() => document.body.innerText.includes('Status history'));
  jobPage = await bodyText(page);
  check(jobPage.includes('COMPLETED') && (await page.$eval('#detail-notes', (el) => el.value)).includes('E2E smoke: inspection completed'), 'job card survives refresh with status and notes');

  await open(page, '/reports?status=COMPLETED');
  await page.waitForSelector('#report-from');
  await page.waitForFunction((source) => document.body.innerText.includes(source), {}, jobNumber);
  let reportPage = await bodyText(page);
  check(Boolean(jobNumber) && reportPage.includes(jobNumber), 'completed report lists new job card');
  await fill(page, '#report-from', today);
  await fill(page, '#report-to', today);
  await page.waitForFunction((source) => document.body.innerText.includes(source), {}, jobNumber);
  reportPage = await bodyText(page);
  check(reportPage.includes(jobNumber), 'completed report date filters retain new job card');
  check(reportPage.includes('120.00'), 'report money formatting matches detail formatting');

  await open(page, '/dashboard');
  await page.waitForFunction(() => document.body.innerText.includes('Workload by status'));
  check((await bodyText(page)).includes('Workload by status'), 'dashboard renders after workflow');

  check(pageErrors.length === 0, `no browser console/page errors (${pageErrors.length})`);
  console.log(`E2E_SMOKE_OK customer=${customerId} vehicle=${vehicleId} booking=${bookingId} job=${jobId} jobNumber=${jobNumber}`);
} finally {
  await browser.close();
}
