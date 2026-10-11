/**
 * Minimal test harness for `npm test` (run via tsx — no Jest needed).
 * Each suite registers checks; run-all.ts prints totals and sets the
 * exit code.
 */

let passed = 0;
let failed = 0;
const failures: string[] = [];

export function check(label: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed += 1;
  } else {
    failed += 1;
    failures.push(`${label}\n    expected: ${e}\n    actual:   ${a}`);
  }
}

export function checkClose(label: string, actual: number, expected: number, tolerance: number): void {
  if (Math.abs(actual - expected) <= tolerance) {
    passed += 1;
  } else {
    failed += 1;
    failures.push(`${label}\n    expected: ${expected} ±${tolerance}\n    actual:   ${actual}`);
  }
}

export function checkTrue(label: string, condition: boolean): void {
  check(label, condition, true);
}

export function suite(name: string): void {
  // Marker in output so failures are easy to place.
  console.log(`\n— ${name}`);
}

export function report(): number {
  console.log(`\n${passed} passed, ${failed} failed`);
  for (const failure of failures) {
    console.log(`  FAIL: ${failure}`);
  }
  return failed === 0 ? 0 : 1;
}
