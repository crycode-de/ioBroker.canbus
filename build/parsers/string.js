"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserString = void 0;
const base_1 = require("./base");
/**
 * Parser for handling of string values.
 */
class ParserString extends base_1.ParserBase {
    constructor(parserConfig) {
        super(parserConfig);
    }
    read(buf) {
        try {
            return buf.toString(this.cfg.dataEncoding, this.cfg.dataOffset, this.cfg.dataLength);
        }
        catch (err) {
            return err;
        }
    }
    write(buf, val) {
        try {
            buf.write(val, this.cfg.dataOffset, val.length, this.cfg.dataEncoding);
        }
        catch (err) {
            return err;
        }
        return true;
    }
}
exports.ParserString = ParserString;
ParserString.handledDataTypes = [
    'string'
];
