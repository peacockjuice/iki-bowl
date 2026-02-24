import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const projectRoot = process.cwd();

const targets = [
  'src/main.ts',
  'src/ui/template.ts',
  'README.md',
  'package.json',
  'package-lock.json',
  'public/sw.js',
  'index.html',
  'public/manifest.webmanifest',
];

const forbiddenPatterns = [
  { label: 'Master volume', regex: /Master volume/g },
  { label: 'volumePercent', regex: /\bvolumePercent\b/g },
  { label: 'setVolumeFromPercent', regex: /\bsetVolumeFromPercent\b/g },
];

let hasFailure = false;

for (const relativePath of targets) {
  const absolutePath = join(projectRoot, relativePath);
  const content = readFileSync(absolutePath, 'utf8');

  for (const pattern of forbiddenPatterns) {
    const matches = content.match(pattern.regex);
    if (!matches || matches.length === 0) {
      continue;
    }

    hasFailure = true;
    console.error(`${relativePath}: found forbidden token "${pattern.label}" (${matches.length})`);
  }
}

if (hasFailure) {
  process.exit(1);
}

console.log('Branding check OK: no legacy name/volume tokens in guarded files.');
