"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserBase = void 0;
/**
 * Abstract base class for all parsers.
 * Each parser must extend this base class, implement the `read()` and `write()`
 * methods and set its `handledDataTypes`.
 */
class ParserBase {
    constructor(adapter, parserConfig) {
        this.cfg = parserConfig;
        this.adapter = adapter;
    }
    /**
     * Check if this parser can handle a data type.
     * @param dataType The data type to check for.
     * @return `true` if this parser can handle the data type.
     */
    static canHandle(dataType) {
        return this.handledDataTypes.includes(dataType);
    }
}
exports.ParserBase = ParserBase;
/**
 * Array of data types this parser can handle.
 */
ParserBase.handledDataTypes = [];
