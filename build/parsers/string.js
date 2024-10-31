"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var string_exports = {};
__export(string_exports, {
  ParserString: () => ParserString
});
module.exports = __toCommonJS(string_exports);
var import_base = require("./base");
class ParserString extends import_base.ParserBase {
  constructor(adapter, parserConfig) {
    super(adapter, parserConfig);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async read(buf) {
    try {
      return buf.toString(this.cfg.dataEncoding, this.cfg.dataOffset, this.cfg.dataOffset + this.cfg.dataLength);
    } catch (err) {
      return err;
    }
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async write(buf, val) {
    const len = Math.min(Buffer.byteLength(val, this.cfg.dataEncoding), this.cfg.dataLength);
    try {
      buf.write(val, this.cfg.dataOffset, len, this.cfg.dataEncoding);
    } catch (err) {
      return err;
    }
    return buf;
  }
}
ParserString.handledDataTypes = [
  "string"
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ParserString
});
//# sourceMappingURL=string.js.map
