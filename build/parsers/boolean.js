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
var boolean_exports = {};
__export(boolean_exports, {
  ParserBoolean: () => ParserBoolean
});
module.exports = __toCommonJS(boolean_exports);
var import_base = require("./base");
class ParserBoolean extends import_base.ParserBase {
  constructor(adapter, parserConfig) {
    super(adapter, parserConfig);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async read(buf) {
    if (this.cfg.dataOffset >= buf.length) {
      return new Error("Data is too short for given offset");
    }
    const val = buf[this.cfg.dataOffset];
    let ret;
    if (this.cfg.booleanMask === 0) {
      ret = val > 0;
    } else {
      ret = (val & this.cfg.booleanMask) === this.cfg.booleanMask;
    }
    if (this.cfg.booleanInvert) {
      ret = !ret;
    }
    return ret;
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async write(buf, val) {
    if (this.cfg.dataOffset >= buf.length) {
      return new Error("Data is too short for given offset");
    }
    if (this.cfg.booleanInvert) {
      val = !val;
    }
    if (this.cfg.booleanMask === 0) {
      if (val) {
        buf[this.cfg.dataOffset] = 255;
      } else {
        buf[this.cfg.dataOffset] = 0;
      }
    } else {
      if (val) {
        buf[this.cfg.dataOffset] = buf[this.cfg.dataOffset] | this.cfg.booleanMask;
      } else {
        buf[this.cfg.dataOffset] = buf[this.cfg.dataOffset] & ~this.cfg.booleanMask;
      }
    }
    return buf;
  }
}
ParserBoolean.handledDataTypes = [
  "boolean"
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ParserBoolean
});
//# sourceMappingURL=boolean.js.map
