import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

import { getExpectedTrackFilenames } from './audio-spec.mjs';

const audioDir = join(process.cwd(), 'public', 'audio');
const maxTailSec = 35;

if (!existsSync(audioDir)) {
  console.error('Missing public/audio directory');
  process.exit(1);
}

const files = getExpectedTrackFilenames();
let hasFailure = false;

for (const file of files) {
  const path = join(audioDir, file);

  const probe = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nokey=1:noprint_wrappers=1', path],
    { encoding: 'utf-8' },
  );

  if (probe.status !== 0) {
    hasFailure = true;
    console.error(`ffprobe failed for ${file}`);
    continue;
  }

  const actualSec = Number.parseFloat(probe.stdout.trim());
  if (!Number.isFinite(actualSec)) {
    hasFailure = true;
    console.error(`${file}: invalid duration`);
    continue;
  }

  const match = file.match(/-(\d+)m\.mp3$/);
  if (!match) {
    hasFailure = true;
    console.error(`Cannot parse duration from filename: ${file}`);
    continue;
  }

  const targetSec = Number(match[1]) * 60;
  const upperSec = targetSec + maxTailSec;
  if (actualSec < targetSec || actualSec > upperSec) {
    hasFailure = true;
    console.error(`${file}: expected ${targetSec}-${upperSec}s (tail window), actual ${actualSec.toFixed(3)}s`);
    continue;
  }

  console.log(`${file}: OK(tail) (${actualSec.toFixed(3)}s)`);
}

if (hasFailure) {
  process.exit(1);
}
