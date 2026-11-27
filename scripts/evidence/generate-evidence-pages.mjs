import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((line) => line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    })
);

const runDate = new Date().toISOString().slice(0, 10);
const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const page = (title, body) => `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
:root { color-scheme: dark; font-family: Inter, system-ui, sans-serif; background: #070a10; color: #e8edf6; }
body { margin: 0; padding: 40px; }
main { max-width: 1180px; margin: auto; }
h1 { font-size: 28px; margin: 0 0 8px; }
p.secondary { color: #9aa7bb; margin: 0 0 24px; }
section { background: #0f1520; border: 1px solid #263044; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
h2 { font-size: 16px; margin: 0 0 12px; color: #8fc2ff; }
pre { margin: 0; white-space: pre-wrap; word-break: break-word; color: #d7e2f2; font-size: 12px; line-height: 1.5; }
</style></head>
<body><main><h1>${escapeHtml(title)}</h1><p class="secondary">Vehicle Service Centre Job Card Management System · Phase 7 evidence · ${escapeHtml(runDate)}</p>${body}</main></body>
</html>`;

const shellSection = (title, command) => {
  const output = execFileSync('bash', ['-c', command], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  return `<section><h2>${escapeHtml(title)}</h2><pre>$ ${escapeHtml(command)}\n${escapeHtml(output)}</pre></section>`;
};

const transcriptSection = (title, file) => `<section><h2>${escapeHtml(title)}</h2><pre>${escapeHtml(readFileSync(file, 'utf8').trim())}</pre></section>`;

writeFileSync('docs/evidence/setup.html', page('Project setup evidence', [
  shellSection('Angular, Spring Boot, database, and scripts', 'git ls-files frontend backend database scripts | sort'),
  shellSection('Angular proxy configuration', 'cat frontend/proxy.conf.json'),
  shellSection('Spring Boot configuration', 'cat backend/src/main/resources/application.properties'),
  shellSection('Installed tool versions',
    '. scripts/env.sh && printf "node: " && node -v && printf "npm: " && npm -v && printf "java: " && java -version 2>&1 | head -1 && printf "maven: " && mvn -v | head -1 && printf "mysql: " && mysql --version'),
  shellSection('Run commands', 'printf "%s\\n" "npm run db:setup" "npm run api" "npm run web" "http://localhost:4200/"'),
  transcriptSection('Clean-start transcript', 'docs/evidence/clean-start.txt')
].join('')));

const collection = JSON.parse(readFileSync('docs/postman_collection.json', 'utf8'));
const collectionText = `docs/postman_collection.json\n${collection.info.name}\n${collection.item.map((item) => item.name).join('\n')}`;
writeFileSync('docs/evidence/api.html', page('API verification evidence', `
  <section><h2>Reproducible API test transcript</h2><pre>${escapeHtml(readFileSync('docs/evidence/test-results.txt', 'utf8').trim())}</pre></section>
  <section><h2>Postman collection</h2><pre>${escapeHtml(collectionText)}</pre></section>
  ${transcriptSection('Newman CLI run of the Postman collection', 'docs/evidence/newman-run.txt')}
`));

const mysqlArgs = [
  '-h', env.VSC_DB_HOST, '-P', env.VSC_DB_PORT,
  '-u', env.VSC_DB_USERNAME, `-p${env.VSC_DB_PASSWORD}`,
  env.VSC_DB_NAME, '--batch', '--raw', '-e'
];

function query(title, sql) {
  const output = execFileSync('mysql', [...mysqlArgs, sql], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  return `<section><h2>${escapeHtml(title)}</h2><pre>$ mysql ${escapeHtml(env.VSC_DB_NAME)} -e "${escapeHtml(sql)}"\n${escapeHtml(output)}</pre></section>`;
}

writeFileSync('docs/evidence/database.html', page('Database verification evidence', [
  query('Tables', 'SHOW TABLES'),
  query('Key columns', `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='${env.VSC_DB_NAME}' AND COLUMN_NAME IN ('customer_id','vehicle_id','booking_id','technician_id','job_card_id','phone','customer_code','registration_number','completed_at','delivered_at') ORDER BY TABLE_NAME, ORDINAL_POSITION`),
  query('Row counts', "SELECT 'customers' AS table_name, COUNT(*) AS rows_count FROM customers UNION ALL SELECT 'vehicles', COUNT(*) FROM vehicles UNION ALL SELECT 'service_bookings', COUNT(*) FROM service_bookings UNION ALL SELECT 'technicians', COUNT(*) FROM technicians UNION ALL SELECT 'job_cards', COUNT(*) FROM job_cards"),
  query('Foreign-key relationships', `SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA='${env.VSC_DB_NAME}' AND REFERENCED_TABLE_NAME IS NOT NULL ORDER BY TABLE_NAME, CONSTRAINT_NAME`),
  query('Check constraints', `SELECT CONSTRAINT_NAME, TABLE_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA='${env.VSC_DB_NAME}' AND CONSTRAINT_TYPE='CHECK' ORDER BY TABLE_NAME, CONSTRAINT_NAME`),
  query('Sample customers', 'SELECT customer_id, customer_code, full_name, phone FROM customers ORDER BY customer_id LIMIT 3'),
  query('Sample vehicles', 'SELECT vehicle_id, registration_number, customer_id FROM vehicles ORDER BY vehicle_id LIMIT 3'),
  query('Sample bookings', 'SELECT booking_id, booking_number, vehicle_id, booking_status FROM service_bookings ORDER BY booking_id LIMIT 3'),
  query('Sample technicians', 'SELECT technician_id, technician_code, full_name, availability_status FROM technicians ORDER BY technician_id LIMIT 3'),
  query('Sample job cards with timestamps', 'SELECT job_card_id, job_card_number, booking_id, technician_id, job_status, completed_at, delivered_at FROM job_cards ORDER BY job_card_id LIMIT 3'),
  transcriptSection('Executed constraint-failure transcript', 'docs/evidence/database-constraints.txt')
].join('')));

console.log('EVIDENCE_PAGES_OK');
