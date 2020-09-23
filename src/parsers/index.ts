import { ParserBase } from './base';
import { ParserNumber } from './number';

/**
 * Type of `ParserBase` class, needed to create the `ParserLike` interface.
 */
type ParserBaseClass = typeof ParserBase;

/**
 * Interface which represents any possible subclasses of `ParserBase`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ParserLike extends ParserBaseClass { }

/**
 * Array of all known parsers.
 *//*
 * Each parser which may be used must be listed here!
 * The parsers will be loaded dynamically based on this list in `main.ts`.
 * No need to add new parsers somewhere else than here.
 */
export const knownParsers: ParserLike[] = [
  ParserNumber
];
