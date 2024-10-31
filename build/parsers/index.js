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
var parsers_exports = {};
__export(parsers_exports, {
  knownParsers: () => knownParsers
});
module.exports = __toCommonJS(parsers_exports);
var import_boolean = require("./boolean");
var import_custom = require("./custom");
var import_number = require("./number");
var import_string = require("./string");
const knownParsers = [
  import_boolean.ParserBoolean,
  import_number.ParserNumber,
  import_string.ParserString,
  import_custom.ParserCustom
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  knownParsers
});
//# sourceMappingURL=index.js.map
