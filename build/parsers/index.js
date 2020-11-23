"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.knownParsers = void 0;
const boolean_1 = require("./boolean");
const custom_1 = require("./custom");
const number_1 = require("./number");
const string_1 = require("./string");
/**
 * Array of all known parsers.
 */ /*
* Each parser which may be used must be listed here!
* The parsers will be loaded dynamically based on this list in `main.ts`.
* No need to add new parsers somewhere else than here.
*/
exports.knownParsers = [
    boolean_1.ParserBoolean,
    number_1.ParserNumber,
    string_1.ParserString,
    custom_1.ParserCustom
];
//# sourceMappingURL=index.js.map