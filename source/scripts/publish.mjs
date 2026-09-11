import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(sourceRoot, '..');
const distRoot = resolve(repoRoot, 'dist');

await mkdir(resolve(repoRoot, 'assets'), { recursive: true });
await rm(resolve(repoRoot, 'assets'), { recursive: true, force: true });

for (const entry of await readdir(distRoot, { withFileTypes: true })) {
  await cp(resolve(distRoot, entry.name), resolve(repoRoot, entry.name), {
    recursive: true,
    force: true
  });
}

console.log('Published the verified static build to the repository root.');
