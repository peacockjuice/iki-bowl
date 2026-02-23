import { existsSync, mkdirSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

import { DURATIONS_MIN, EQUAL_SECONDS } from './audio-spec.mjs';

const SAMPLE_RATE = 22050;
const TARGET_PEAK = 0.89;

const projectRoot = process.cwd();
const audioDir = join(projectRoot, 'public', 'audio');
const sourceDir = join(audioDir, 'source');
const tempDir = join(projectRoot, '.tmp-audio');

function ensureDirs() {
  [audioDir, sourceDir, tempDir].forEach((dir) => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });
}

function clearGeneratedTracks() {
  for (const file of readdirSync(audioDir)) {
    const filePath = join(audioDir, file);
    if (file.endsWith('.mp3')) {
      unlinkSync(filePath);
    }
  }
}

function tone({
  durationSec,
  baseFreq,
  harmonics = [1, 0.3],
  attackSec = 0.01,
  decaySec = 0.25,
  gain = 0.6,
}) {
  const length = Math.max(1, Math.floor(durationSec * SAMPLE_RATE));
  const out = new Float32Array(length);

  for (let i = 0; i < length; i += 1) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / attackSec);
    const decay = Math.exp(-Math.max(0, t - attackSec) / Math.max(0.001, decaySec));
    const env = attack * decay;

    let value = 0;
    for (let h = 0; h < harmonics.length; h += 1) {
      value += harmonics[h] * Math.sin(2 * Math.PI * baseFreq * (h + 1) * t);
    }
    out[i] = value * env * gain;
  }

  return out;
}

function normalizeBuffer(buffer) {
  let peak = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    const abs = Math.abs(buffer[i]);
    if (abs > peak) {
      peak = abs;
    }
  }
  if (peak <= 0) {
    return buffer;
  }
  const scale = peak > TARGET_PEAK ? TARGET_PEAK / peak : 1;
  for (let i = 0; i < buffer.length; i += 1) {
    const value = buffer[i] * scale;
    buffer[i] = Math.max(-1, Math.min(1, value));
  }
  return buffer;
}

function mixSound(target, sound, startSec, gain = 1) {
  const startIndex = Math.floor(startSec * SAMPLE_RATE);
  if (startIndex >= target.length) {
    return;
  }

  for (let i = 0; i < sound.length; i += 1) {
    const idx = startIndex + i;
    if (idx >= target.length) {
      break;
    }
    target[idx] += sound[i] * gain;
  }
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
      '40k',
      outputMp3Path,
    ],
    { stdio: 'inherit' },
  );

  if (result.status !== 0) {
    throw new Error(`ffmpeg failed for ${outputMp3Path}`);
  }
}

function scheduleModeEvents(modeType, durationSec, sounds, equalSeconds = 4) {
  const out = new Float32Array(Math.floor(durationSec * SAMPLE_RATE));

  if (modeType === 'equal') {
    const cycleSec = equalSeconds * 2;
    for (let cycleStart = 0; cycleStart < durationSec; cycleStart += cycleSec) {
      mixSound(out, sounds.inhale, cycleStart, 1);
      mixSound(out, sounds.exhale, cycleStart + equalSeconds, 1);
    }
    return out;
  }

  if (modeType === 'box4444') {
    for (let cycleStart = 0; cycleStart < durationSec; cycleStart += 16) {
      mixSound(out, sounds.inhale, cycleStart, 1);
      for (let sec = 0; sec < 4; sec += 1) {
        mixSound(out, sounds.tick, cycleStart + 4 + sec, 1);
      }
      mixSound(out, sounds.exhale, cycleStart + 8, 1);
      for (let sec = 0; sec < 4; sec += 1) {
        mixSound(out, sounds.tick, cycleStart + 12 + sec, 1);
      }
    }
    return out;
  }

  for (let cycleStart = 0; cycleStart < durationSec; cycleStart += 19) {
    mixSound(out, sounds.inhale, cycleStart, 1);
    for (let sec = 0; sec < 7; sec += 1) {
      mixSound(out, sounds.tick, cycleStart + 4 + sec, 1);
    }
    mixSound(out, sounds.exhale, cycleStart + 11, 1);
  }
  return out;
}

function generate() {
  ensureDirs();
  clearGeneratedTracks();

  const sourceSounds = {
    inhale: tone({ durationSec: 0.32, baseFreq: 540, harmonics: [1, 0.35, 0.12], attackSec: 0.005, decaySec: 0.22, gain: 0.45 }),
    exhale: tone({ durationSec: 0.34, baseFreq: 330, harmonics: [1, 0.28, 0.09], attackSec: 0.005, decaySec: 0.24, gain: 0.42 }),
    tick: tone({ durationSec: 0.075, baseFreq: 1300, harmonics: [1], attackSec: 0.002, decaySec: 0.05, gain: 0.19 }),
  };

  const sourceNames = {
    inhale: 'gong_inhale',
    exhale: 'gong_exhale',
    tick: 'tick_soft',
  };

  Object.entries(sourceSounds).forEach(([key, value]) => {
    normalizeBuffer(value);
    const wavPath = join(tempDir, `${sourceNames[key]}.wav`);
    const mp3Path = join(sourceDir, `${sourceNames[key]}.mp3`);
    encodeWav(value, wavPath);
    toMp3(wavPath, mp3Path);
  });

  for (const equalSeconds of EQUAL_SECONDS) {
    for (const durationMin of DURATIONS_MIN) {
      const durationSec = durationMin * 60;
      const mixed = scheduleModeEvents('equal', durationSec, sourceSounds, equalSeconds);
      normalizeBuffer(mixed);

      const filename = `even-${equalSeconds}${equalSeconds}-${durationMin}m.mp3`;
      const wavPath = join(tempDir, `even-${equalSeconds}${equalSeconds}-${durationMin}m.wav`);
      const mp3Path = join(audioDir, filename);
      encodeWav(mixed, wavPath);
      toMp3(wavPath, mp3Path);
      console.log(`Generated ${filename}`);
    }
  }

  for (const modeType of ['box4444', 'relax478']) {
    for (const durationMin of DURATIONS_MIN) {
      const durationSec = durationMin * 60;
      const mixed = scheduleModeEvents(modeType, durationSec, sourceSounds);
      normalizeBuffer(mixed);

      const prefix = modeType === 'box4444' ? 'box-4444' : 'relax-478';
      const filename = `${prefix}-${durationMin}m.mp3`;
      const wavPath = join(tempDir, `${prefix}-${durationMin}m.wav`);
      const mp3Path = join(audioDir, filename);
      encodeWav(mixed, wavPath);
      toMp3(wavPath, mp3Path);
      console.log(`Generated ${filename}`);
    }
  }

  rmSync(tempDir, { recursive: true, force: true });
  console.log('Audio generation completed');
}

generate();
