import { statSync } from 'node:fs';
import { join } from 'node:path';

import { getExpectedTrackFilenames } from './audio-spec.mjs';

const warnThresholdMb = 220;
const failThresholdMb = 260;

const toMb = (bytes) => bytes / (1024 * 1024);

const audioDir = join(process.cwd(), 'public', 'audio');
const expectedTracks = getExpectedTrackFilenames();

let totalBytes = 0;
for (const file of expectedTracks) {
  const filePath = join(audioDir, file);
  totalBytes += statSync(filePath).size;
}

const totalMb = toMb(totalBytes);
console.log(`Expected track set size: ${totalMb.toFixed(2)} MB`);

if (totalMb > failThresholdMb) {
  console.error(`Audio size gate failed: ${totalMb.toFixed(2)} MB > ${failThresholdMb} MB`);
  process.exit(1);
}

if (totalMb > warnThresholdMb) {
  console.warn(`Audio size warning: ${totalMb.toFixed(2)} MB > ${warnThresholdMb} MB`);
}
