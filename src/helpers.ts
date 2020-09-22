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

export function getHexId(id: number, ext: boolean = false): string {
  let str = id.toString(16).toUpperCase();
  str = str.padStart(ext ? 8 : 3, '0');
  return str;
}