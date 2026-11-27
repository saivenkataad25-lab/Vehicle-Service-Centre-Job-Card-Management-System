import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const command = 'npx --yes newman run docs/postman_collection.json --reporters cli';
const result = spawnSync('npx', ['--yes', 'newman', 'run', 'docs/postman_collection.json', '--reporters', 'cli'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});
const output = `${result.stdout || ''}${result.stderr || ''}`.trimEnd();
writeFileSync('docs/evidence/newman-run.txt', `$ ${command}\n${output}\n`);
if (result.status !== 0) {
  console.error(output);
  process.exit(result.status || 1);
}
console.log('NEWMAN_EVIDENCE_OK');
