import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const recordsDistDir = join(process.cwd(), 'dist', 'audio', 'records');

if (existsSync(recordsDistDir)) {
  rmSync(recordsDistDir, { recursive: true, force: true });
  console.log('Removed dist/audio/records from deploy artifact');
} else {
  console.log('No dist/audio/records directory found');
}
