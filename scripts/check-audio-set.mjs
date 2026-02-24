import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { getExpectedTrackFilenames } from './audio-spec.mjs';

const audioDir = join(process.cwd(), 'public', 'audio');
if (!existsSync(audioDir)) {
  console.error('Missing public/audio directory');
  process.exit(1);
}

const expected = getExpectedTrackFilenames();
const actual = readdirSync(audioDir).filter((name) => name.endsWith('.mp3'));
const actualSet = new Set(actual);

const missing = expected.filter((name) => !actualSet.has(name));
if (missing.length > 0) {
  console.error('Missing active audio tracks:');
  missing.forEach((name) => console.error(`  - ${name}`));
  process.exit(1);
}

const extra = actual.filter((name) => !expected.includes(name));
if (extra.length > 0) {
  console.error('Unexpected top-level audio tracks found (legacy not allowed):');
  extra.forEach((name) => console.error(`  - ${name}`));
  process.exit(1);
}

console.log(`Audio set OK: ${expected.length} active tracks present, no extras.`);
