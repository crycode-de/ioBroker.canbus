"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.knownParsers = void 0;
const number_1 = require("./number");
/**
 * Array of all known parsers.
 */ /*
* Each parser which may be used must be listed here!
* The parsers will be loaded dynamically based on this list in `main.ts`.
* No need to add new parsers somewhere else than here.
*/
exports.knownParsers = [
    number_1.ParserNumber
];
