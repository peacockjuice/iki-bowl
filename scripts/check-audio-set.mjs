import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { getExpectedTrackFilenames } from './audio-spec.mjs';

const audioDir = join(process.cwd(), 'public', 'audio');
if (!existsSync(audioDir)) {
  console.error('Missing public/audio directory');
  process.exit(1);
}

const expected = getExpectedTrackFilenames();
const expectedSet = new Set(expected);

const actual = readdirSync(audioDir).filter((name) => name.endsWith('.mp3'));
const actualSet = new Set(actual);

const missing = expected.filter((name) => !actualSet.has(name));
const extra = actual.filter((name) => !expectedSet.has(name));

if (missing.length > 0) {
  console.error('Missing audio tracks:');
  missing.forEach((name) => console.error(`  - ${name}`));
}

if (extra.length > 0) {
  console.error('Unexpected audio tracks:');
  extra.forEach((name) => console.error(`  - ${name}`));
}

if (actual.length !== expected.length) {
  console.error(`Track count mismatch: expected ${expected.length}, actual ${actual.length}`);
}

if (missing.length > 0 || extra.length > 0 || actual.length !== expected.length) {
  process.exit(1);
}

console.log(`Audio set OK: ${actual.length} tracks`);
