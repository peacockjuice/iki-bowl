export const DURATIONS_MIN = [5, 10, 20];
export const EQUAL_SECONDS = [4, 5, 6, 7];

export function getExpectedTrackFilenames() {
  const tracks = [];

  for (const equalSeconds of EQUAL_SECONDS) {
    for (const durationMin of DURATIONS_MIN) {
      tracks.push(`even-${equalSeconds}${equalSeconds}-${durationMin}m.mp3`);
    }
  }

  for (const durationMin of DURATIONS_MIN) {
    tracks.push(`box-4444-${durationMin}m.mp3`);
    tracks.push(`relax-478-${durationMin}m.mp3`);
  }

  return tracks;
}
