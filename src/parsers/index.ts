import { ParserBoolean } from './boolean';
import { ParserCustom } from './custom';
import { ParserNumber } from './number';
import { ParserString } from './string';

/**
 * Array of all known parsers.
 *
 * Each parser which may be used must be listed here!
 * The parsers will be loaded dynamically based on this list in `main.ts`.
 * No need to add new parsers somewhere else than here.
 */
export const knownParsers = [
  ParserBoolean,
  ParserNumber,
  ParserString,
  ParserCustom,
];
