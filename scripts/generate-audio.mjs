import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

import { DURATIONS_MIN, EQUAL_SECONDS } from './audio-spec.mjs';

const SAMPLE_RATE = 22050;
const TARGET_PEAK = 0.89;
const MP3_BITRATE = '40k';

const projectRoot = process.cwd();
const audioDir = join(projectRoot, 'public', 'audio');
const sourceDir = join(audioDir, 'source');
const tempDir = join(projectRoot, '.tmp-audio');

const BOWLS_FILES = {
  inhale: join(projectRoot, 'bowls_3_1.mp3'),
  hold: join(projectRoot, 'bowls_3_2.mp3'),
  exhale: join(projectRoot, 'bowls_3_3.mp3'),
};

function ensureDirs() {
  [audioDir, sourceDir, tempDir].forEach((dir) => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });
}

function assertInputFiles() {
  for (const [role, path] of Object.entries(BOWLS_FILES)) {
    if (!existsSync(path)) {
      throw new Error(`Missing source sample for ${role}: ${path}`);
    }
  }
}

function decodeToMonoFloat32(inputPath) {
  const result = spawnSync(
    'ffmpeg',
    ['-v', 'error', '-i', inputPath, '-f', 'f32le', '-ac', '1', '-ar', String(SAMPLE_RATE), 'pipe:1'],
    {
      encoding: null,
      maxBuffer: 512 * 1024 * 1024,
    },
  );

  if (result.status !== 0 || !result.stdout) {
    throw new Error(`ffmpeg decode failed for ${inputPath}`);
  }

  const buffer = result.stdout;
  const floatCount = Math.floor(buffer.byteLength / 4);
  const view = new Float32Array(buffer.buffer, buffer.byteOffset, floatCount);
  return new Float32Array(view);
}

function writeSourceCopies() {
  copyFileSync(BOWLS_FILES.inhale, join(sourceDir, 'bowls_3_1.mp3'));
  copyFileSync(BOWLS_FILES.hold, join(sourceDir, 'bowls_3_2.mp3'));
  copyFileSync(BOWLS_FILES.exhale, join(sourceDir, 'bowls_3_3.mp3'));

  // Compatibility aliases used by older docs and tooling.
  copyFileSync(BOWLS_FILES.inhale, join(sourceDir, 'gong_inhale.mp3'));
  copyFileSync(BOWLS_FILES.hold, join(sourceDir, 'tick_soft.mp3'));
  copyFileSync(BOWLS_FILES.exhale, join(sourceDir, 'gong_exhale.mp3'));
}

function normalizeBuffer(buffer) {
  let peak = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    const abs = Math.abs(buffer[i]);
    if (abs > peak) {
      peak = abs;
    }
  }

  if (peak <= TARGET_PEAK || peak <= 0) {
    return buffer;
  }

  const scale = TARGET_PEAK / peak;
  for (let i = 0; i < buffer.length; i += 1) {
    const value = buffer[i] * scale;
    buffer[i] = Math.max(-1, Math.min(1, value));
  }
  return buffer;
}

function encodeWav(floatData, outputPath) {
  const channels = 1;
  const bitsPerSample = 16;
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataSize = floatData.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < floatData.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, floatData[i]));
    const int = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    buffer.writeInt16LE(Math.round(int), 44 + i * 2);
  }

  writeFileSync(outputPath, buffer);
}

function toMp3(inputWavPath, outputMp3Path) {
  const result = spawnSync(
    'ffmpeg',
    [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      inputWavPath,
      '-ac',
      '1',
      '-ar',
      String(SAMPLE_RATE),
      '-codec:a',
      'libmp3lame',
      '-b:a',
      MP3_BITRATE,
      outputMp3Path,
    ],
    { stdio: 'inherit' },
  );

  if (result.status !== 0) {
    throw new Error(`ffmpeg encode failed for ${outputMp3Path}`);
  }
}

function copyPhase(track, startSample, samplesToWrite, source) {
  if (samplesToWrite <= 0 || source.length === 0) {
    return;
  }

  for (let i = 0; i < samplesToWrite; i += 1) {
    track[startSample + i] += source[i % source.length];
  }
}

function buildTrack(durationSec, phaseSpec, sourceByRole) {
  const totalSamples = Math.floor(durationSec * SAMPLE_RATE);
  const track = new Float32Array(totalSamples);

  let cursor = 0;
  while (cursor < totalSamples) {
    for (const phase of phaseSpec) {
      if (cursor >= totalSamples) {
        break;
      }

      const desiredSamples = Math.floor(phase.seconds * SAMPLE_RATE);
      const writable = Math.min(desiredSamples, totalSamples - cursor);
      copyPhase(track, cursor, writable, sourceByRole[phase.role]);
      cursor += writable;
    }
  }

  return track;
}

function createEqualPhaseSpec(equalSeconds) {
  return [
    { role: 'inhale', seconds: equalSeconds },
    { role: 'exhale', seconds: equalSeconds },
  ];
}

function createBoxPhaseSpec() {
  return [
    { role: 'inhale', seconds: 4 },
    { role: 'hold', seconds: 4 },
    { role: 'exhale', seconds: 4 },
    { role: 'hold', seconds: 4 },
  ];
}

function createRelaxPhaseSpec() {
  return [
    { role: 'inhale', seconds: 4 },
    { role: 'hold', seconds: 7 },
    { role: 'exhale', seconds: 8 },
  ];
}

function renderTrack(filename, durationMin, phaseSpec, sourceByRole) {
  const durationSec = durationMin * 60;
  const mixed = buildTrack(durationSec, phaseSpec, sourceByRole);
  normalizeBuffer(mixed);

  const wavPath = join(tempDir, `${filename}.wav`);
  const mp3Path = join(audioDir, `${filename}.mp3`);
  encodeWav(mixed, wavPath);
  toMp3(wavPath, mp3Path);
  console.log(`Generated ${filename}.mp3`);
}

function generate() {
  assertInputFiles();
  ensureDirs();
  writeSourceCopies();

  const sourceByRole = {
    inhale: decodeToMonoFloat32(BOWLS_FILES.inhale),
    hold: decodeToMonoFloat32(BOWLS_FILES.hold),
    exhale: decodeToMonoFloat32(BOWLS_FILES.exhale),
  };

  for (const equalSeconds of EQUAL_SECONDS) {
    const phaseSpec = createEqualPhaseSpec(equalSeconds);
    for (const durationMin of DURATIONS_MIN) {
      renderTrack(`even-${equalSeconds}${equalSeconds}-${durationMin}m`, durationMin, phaseSpec, sourceByRole);
    }
  }

  const boxPhaseSpec = createBoxPhaseSpec();
  const relaxPhaseSpec = createRelaxPhaseSpec();

  for (const durationMin of DURATIONS_MIN) {
    renderTrack(`box-4444-${durationMin}m`, durationMin, boxPhaseSpec, sourceByRole);
    renderTrack(`relax-478-${durationMin}m`, durationMin, relaxPhaseSpec, sourceByRole);
  }

  rmSync(tempDir, { recursive: true, force: true });
  console.log('Audio generation completed');
}

generate();
