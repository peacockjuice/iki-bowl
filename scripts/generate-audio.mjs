import { copyFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const projectRoot = process.cwd();
const audioDir = join(projectRoot, 'public', 'audio');
const recordsDir = join(audioDir, 'records');

const RECORD_TO_TARGET_MAP = {
  'bowls_4_4_5.mp3': 'even-44-5m.mp3',
  'bowls_4_4_10.mp3': 'even-44-10m.mp3',
  'bowls_4_4_20.mp3': 'even-44-20m.mp3',
  'bowls_5_5_5.mp3': 'even-55-5m.mp3',
  'bowls_5_5_10.mp3': 'even-55-10m.mp3',
  'bowls_5_5_20.mp3': 'even-55-20m.mp3',
  'bowls_6_6_5.mp3': 'even-66-5m.mp3',
  'bowls_6_6_10.mp3': 'even-66-10m.mp3',
  'bowls_6_6_20.mp3': 'even-66-20m.mp3',
  'bowls_7_7_5.mp3': 'even-77-5m.mp3',
  'bowls_7_7_10.mp3': 'even-77-10m.mp3',
  'bowls_7_7_20.mp3': 'even-77-20m.mp3',
  'bowls_4444_5.mp3': 'box-4444-5m.mp3',
  'bowls_4444_10.mp3': 'box-4444-10m.mp3',
  'bowls_4444_20.mp3': 'box-4444-20m.mp3',
  'bowls_478_5.mp3': 'relax-478-5m.mp3',
  'bowls_478_10.mp3': 'relax-478-10m.mp3',
  'bowls_478_20.mp3': 'relax-478-20m.mp3',
};

function assertRecords() {
  for (const sourceName of Object.keys(RECORD_TO_TARGET_MAP)) {
    const sourcePath = join(recordsDir, sourceName);
    if (!existsSync(sourcePath)) {
      throw new Error(`Missing record source: ${sourcePath}`);
    }
  }
}

function removeTopLevelAudioMp3() {
  const topLevel = readdirSync(audioDir)
    .filter((name) => name.endsWith('.mp3'))
    .map((name) => join(audioDir, name));
  for (const path of topLevel) {
    rmSync(path, { force: true });
  }
}

function copyRecordsToTargets() {
  for (const [sourceName, targetName] of Object.entries(RECORD_TO_TARGET_MAP)) {
    const sourcePath = join(recordsDir, sourceName);
    const targetPath = join(audioDir, targetName);
    copyFileSync(sourcePath, targetPath);
    console.log(`Copied ${sourceName} -> ${targetName}`);
  }
}

function generate() {
  assertRecords();
  removeTopLevelAudioMp3();
  copyRecordsToTargets();
  console.log('Audio replacement from records completed');
}

generate();
