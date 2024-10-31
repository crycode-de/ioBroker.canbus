interface InternalClipboard {
  /**
   * A json string of a parser config (state).
   */
  parser: string | null;

  /**
   * A json string of a message config (state).
   */
  message: string | null;
}

/**
 * An internal clipboard.
 */
export const internalClipboard: InternalClipboard = {
  parser: null,
  message: null,
};

/**
 * UUIDv4 generator (RFC4122 compliant)
 */
export function uuidv4 (): string {
  let uuid = '';
  for (let i = 0; i < 32; i++) {
    const random = Math.random() * 16 | 0;
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      uuid += '-';
    }
    uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
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
      if ((a[key] as () => unknown).toString() !== (b[key] as () => unknown).toString()) return false;
    } else {
      if (!compareObjects(a[key], b[key])) return false;
    }
  }

  return true;
}

/**
 * Regexp to match a string value that represents a false value.
 */
const falsyRegExp = /^(?:f(?:alse)?|no?|0+)$/i;

/**
 * Convert a string to a boolean value.
 * @param val The value to convert.
 * @returns False if the value is falsy.
 */
export function strToBool (val: string): boolean {
  return !falsyRegExp.test(val) && !!val;
}

/**
 * Sort helper function to sort an array of message keys by the message contents.
 * @param msgs The messages object to get message data from.
 * @param id1 ID of the first element.
 * @param id2 ID of the second element.
 */
export function sortMessagesById (msgs: ioBroker.AdapterConfigMessages, id1: string, id2: string): -1 | 0 | 1 {
  if (!msgs[id1] && !msgs[id2]) {
    return 0;
  }
  if (!msgs[id2]) {
    return 1;
  }
  if (!msgs[id1]) {
    return -1;
  }

  if (msgs[id1].id.length > msgs[id2].id.length) {
    return 1;
  }
  if (msgs[id1].id.length < msgs[id2].id.length) {
    return -1;
  }

  if (msgs[id1].id > msgs[id2].id) {
    return 1;
  }
  if (msgs[id1].id < msgs[id2].id) {
    return -1;
  }

  if (msgs[id1].dlc > msgs[id2].dlc) {
    return 1;
  }
  if (msgs[id1].dlc < msgs[id2].dlc) {
    return -1;
  }

  return 0;
}
