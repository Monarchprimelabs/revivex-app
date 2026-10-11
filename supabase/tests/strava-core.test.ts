import { check, checkTrue, report, suite } from '@revivex/test-utils';
import {
  authorizeUrl,
  buildGpx,
  describeWorkout,
  hasWriteScope,
  hybridPayload,
  isAllowedReturnTo,
  isDuplicateUploadError,
  needsRefresh,
  runPayload,
  workoutPayload,
} from '../functions/_shared/strava-core.ts';

suite('strava core: payloads');
const workout = workoutPayload({
  title: 'Push Day',
  performed_at: '2026-10-10T17:00:00.000Z',
  duration_seconds: 3600,
  exercises: [{ exerciseName: 'Bench Press', sets: [{ weight: 185, reps: 8, completed: true }, { weight: 185, reps: 8, completed: false }] }, { exerciseName: 'Push-Up', sets: [{ weight: 0, reps: 20 }] }],
});
check('workout maps to WeightTraining', [workout.sport_type, workout.elapsed_time, workout.start_date_local], ['WeightTraining', 3600, '2026-10-10T17:00:00Z']);
checkTrue('description lists completed sets only', workout.description.includes('Bench Press: 185×8') && !workout.description.includes('185×8, 185×8'));
checkTrue('bodyweight sets show reps', workout.description.includes('Push-Up: 20 reps'));
checkTrue('description credits the app', workout.description.endsWith('Logged with Revive X'));

const run = runPayload({ title: 'Easy 5K', performed_at: '2026-10-09T12:00:00.000Z', duration_seconds: 1680, distance_m: 4988.97, run_type: 'Easy Run' });
check('outdoor run is a Run with meters', [run.sport_type, run.distance, run.trainer], ['Run', 4989, 0]);
const treadmill = runPayload({ title: 'Mill', performed_at: '2026-10-09T12:00:00.000Z', duration_seconds: 600, distance_m: 1600, run_type: 'Treadmill' });
check('treadmill run is a VirtualRun on a trainer', [treadmill.sport_type, treadmill.trainer], ['VirtualRun', 1]);

const hybrid = hybridPayload({ title: 'Benchmark', performed_at: '2026-10-08T12:00:00.000Z', total_duration_seconds: 2400, session_type: 'Hybrid Benchmark', segments: [{ name: 'Run', durationSeconds: 300 }, { name: 'Wall Balls', durationSeconds: 240 }] });
check('hybrid maps to Workout', [hybrid.sport_type, hybrid.elapsed_time], ['Workout', 2400]);
checkTrue('hybrid description numbers the segments', hybrid.description.includes('1. Run 5:00') && hybrid.description.includes('2. Wall Balls 4:00'));

check('long descriptions are clamped', describeWorkout({ title: 'x', performed_at: '2026-10-10T17:00:00.000Z', duration_seconds: 1, exercises: Array.from({ length: 200 }, () => ({ exerciseName: 'Very Long Exercise Name', sets: [{ weight: 100, reps: 10 }] })) }).length <= 1000, true);

suite('strava core: gpx');
const gpx = buildGpx('Morning <run> & more', [
  { lat: 40.7128, lng: -74.006, t: 1760000002000 },
  { lat: 40.7127, lng: -74.0061, t: 1760000000000 },
]);
checkTrue('gpx escapes the name', gpx.includes('<name>Morning &lt;run&gt; &amp; more</name>'));
checkTrue('gpx points are time ordered', gpx.indexOf('40.712700') < gpx.indexOf('40.712800'));
checkTrue('gpx carries ISO times', gpx.includes('<time>2025-10-09T08:53:20.000Z</time>'));
let threw = false;
try {
  buildGpx('x', [{ lat: 1, lng: 1, t: 1 }]);
} catch {
  threw = true;
}
check('gpx needs two points', threw, true);

suite('strava core: tokens, scopes, links');
check('refresh when within five minutes of expiry', needsRefresh(new Date(Date.now() + 4 * 60 * 1000).toISOString()), true);
check('no refresh when an hour remains', needsRefresh(new Date(Date.now() + 60 * 60 * 1000).toISOString()), false);
check('write scope detected', [hasWriteScope('read,activity:write'), hasWriteScope('read,activity:read'), hasWriteScope(null)], [true, false, false]);
check('allowed return links', [isAllowedReturnTo('revivex://profile/strava'), isAllowedReturnTo('exp://192.168.1.2:8081/--/profile/strava'), isAllowedReturnTo('https://evil.example/steal'), isAllowedReturnTo('revivex-daily://x')], [true, true, false, true]);
const url = authorizeUrl('123', 'https://ref.supabase.co/functions/v1/strava-callback', 'state-1');
checkTrue('authorize url carries scope and state', url.includes('scope=read%2Cactivity%3Awrite') && url.includes('state=state-1') && url.startsWith('https://www.strava.com/oauth/authorize?'));
check('duplicate detection', [isDuplicateUploadError('activity.gpx duplicate of activity 21234316'), isDuplicateUploadError('bad file')], [true, false]);

process.exit(report());
