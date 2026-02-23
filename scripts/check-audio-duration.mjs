import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const audioDir = join(process.cwd(), 'public', 'audio');
const toleranceSec = 0.12;

if (!existsSync(audioDir)) {
  console.error('Missing public/audio directory');
  process.exit(1);
}

const files = readdirSync(audioDir).filter((name) => name.endsWith('.mp3'));
if (files.length === 0) {
  console.error('No mp3 files found in public/audio');
  process.exit(1);
}

let hasFailure = false;
for (const file of files) {
  const match = file.match(/-(\d+)m\.mp3$/);
  if (!match) {
    continue;
  }

  const expectedSec = Number(match[1]) * 60;
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
  const delta = Math.abs(actualSec - expectedSec);
  if (!Number.isFinite(actualSec) || delta > toleranceSec) {
    hasFailure = true;
    console.error(`${file}: expected ${expectedSec}s, actual ${actualSec.toFixed(3)}s, delta ${delta.toFixed(3)}s`);
  } else {
    console.log(`${file}: OK (${actualSec.toFixed(3)}s)`);
  }
}

if (hasFailure) {
  process.exit(1);
}
