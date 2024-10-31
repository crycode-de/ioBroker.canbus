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
var base_exports = {};
__export(base_exports, {
  ParserBase: () => ParserBase
});
module.exports = __toCommonJS(base_exports);
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
/**
 * Array of data types this parser can handle.
 */
ParserBase.handledDataTypes = [];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ParserBase
});
//# sourceMappingURL=base.js.map
