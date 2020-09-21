/**
 * UUIDv4 generator (RFC4122 compliant)
 */
export function uuidv4(): string {
  let uuid = '';
  for (let i = 0; i < 32; i++) {
    const random = Math.random() * 16 | 0;
    if (i == 8 || i == 12 || i == 16 || i == 20) {
      uuid += '-';
    }
    uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
  }
  return uuid;
}

/**
 * Function to deep compare two objects.
 * @param a Object 1
 * @param b Object 2
 * @return `true` if the objects are eqaul.
 * @see https://dev.to/sanderdebr/deep-equality-checking-of-objects-in-vanilla-javascript-5592
 */
export function compareObjects (a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;

    if (typeof a[key] === 'function' || typeof b[key] === 'function') {
      if (a[key].toString() !== b[key].toString()) return false;
    } else {
      if (!compareObjects(a[key], b[key])) return false;
    }
  }

  return true;
}
