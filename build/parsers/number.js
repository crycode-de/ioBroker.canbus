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
var number_exports = {};
__export(number_exports, {
  ParserNumber: () => ParserNumber
});
module.exports = __toCommonJS(number_exports);
var import_base = require("./base");
class ParserNumber extends import_base.ParserBase {
  constructor(adapter, parserConfig) {
    super(adapter, parserConfig);
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async read(buf) {
    try {
      switch (this.cfg.dataType) {
        case "int8":
          return buf.readInt8(this.cfg.dataOffset);
        case "uint8":
          return buf.readUInt8(this.cfg.dataOffset);
        case "int16_be":
          return buf.readInt16BE(this.cfg.dataOffset);
        case "int16_le":
          return buf.readInt16LE(this.cfg.dataOffset);
        case "uint16_be":
          return buf.readUInt16BE(this.cfg.dataOffset);
        case "uint16_le":
          return buf.readUInt16LE(this.cfg.dataOffset);
        case "int32_be":
          return buf.readInt32BE(this.cfg.dataOffset);
        case "int32_le":
          return buf.readInt32LE(this.cfg.dataOffset);
        case "uint32_be":
          return buf.readUInt32BE(this.cfg.dataOffset);
        case "uint32_le":
          return buf.readUInt32LE(this.cfg.dataOffset);
        case "float32_be":
          return buf.readFloatBE(this.cfg.dataOffset);
        case "float32_le":
          return buf.readFloatLE(this.cfg.dataOffset);
        case "double64_be":
          return buf.readDoubleBE(this.cfg.dataOffset);
        case "double64_le":
          return buf.readDoubleLE(this.cfg.dataOffset);
        default:
          return new Error(`This parser can't handle the type ${this.cfg.dataType}`);
      }
    } catch (err) {
      return err;
    }
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async write(buf, val) {
    try {
      switch (this.cfg.dataType) {
        case "int8":
          buf.writeInt8(val, this.cfg.dataOffset);
          break;
        case "uint8":
          buf.writeUInt8(val, this.cfg.dataOffset);
          break;
        case "int16_be":
          buf.writeInt16BE(val, this.cfg.dataOffset);
          break;
        case "int16_le":
          buf.writeInt16LE(val, this.cfg.dataOffset);
          break;
        case "uint16_be":
          buf.writeUInt16BE(val, this.cfg.dataOffset);
          break;
        case "uint16_le":
          buf.writeUInt16LE(val, this.cfg.dataOffset);
          break;
        case "int32_be":
          buf.writeInt32BE(val, this.cfg.dataOffset);
          break;
        case "int32_le":
          buf.writeInt32LE(val, this.cfg.dataOffset);
          break;
        case "uint32_be":
          buf.writeUInt32BE(val, this.cfg.dataOffset);
          break;
        case "uint32_le":
          buf.writeUInt32LE(val, this.cfg.dataOffset);
          break;
        case "float32_be":
          buf.writeFloatBE(val, this.cfg.dataOffset);
          break;
        case "float32_le":
          buf.writeFloatLE(val, this.cfg.dataOffset);
          break;
        case "double64_be":
          buf.writeDoubleBE(val, this.cfg.dataOffset);
          break;
        case "double64_le":
          buf.writeDoubleLE(val, this.cfg.dataOffset);
          break;
        default:
          return new Error(`This parser can't handle the type ${this.cfg.dataType}`);
      }
    } catch (err) {
      return err;
    }
    return buf;
  }
}
ParserNumber.handledDataTypes = [
  "int8",
  "uint8",
  "int16_be",
  "int16_le",
  "uint16_be",
  "uint16_le",
  "int32_be",
  "int32_le",
  "uint32_be",
  "uint32_le",
  "float32_be",
  "float32_le",
  "double64_be",
  "double64_le"
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ParserNumber
});
//# sourceMappingURL=number.js.map
