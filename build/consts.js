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
var consts_exports = {};
__export(consts_exports, {
  INTERFACE_REGEXP: () => INTERFACE_REGEXP,
  MESSAGE_ID_REGEXP: () => MESSAGE_ID_REGEXP,
  MESSAGE_ID_REGEXP_WITH_DLC: () => MESSAGE_ID_REGEXP_WITH_DLC,
  PARSER_COMMON_STATES_REGEXP: () => PARSER_COMMON_STATES_REGEXP,
  PARSER_ID_REGEXP: () => PARSER_ID_REGEXP,
  PARSER_ID_RESERVED: () => PARSER_ID_RESERVED
});
module.exports = __toCommonJS(consts_exports);
const INTERFACE_REGEXP = /^[\w-/]{1,}$/;
const MESSAGE_ID_REGEXP = /^([0-7][0-9A-F]{2}|[01][0-9A-F]{7})$/;
const MESSAGE_ID_REGEXP_WITH_DLC = /^([0-7][0-9A-F]{2}|[01][0-9A-F]{7})(-[0-8])?$/;
const PARSER_ID_REGEXP = /^[0-9a-z-_]{1,64}$/;
const PARSER_ID_RESERVED = ["rtr", "raw", "json", "send"];
const PARSER_COMMON_STATES_REGEXP = /^([^=]+=[^,]+,)*([^=]+=[^,]+)$/;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  INTERFACE_REGEXP,
  MESSAGE_ID_REGEXP,
  MESSAGE_ID_REGEXP_WITH_DLC,
  PARSER_COMMON_STATES_REGEXP,
  PARSER_ID_REGEXP,
  PARSER_ID_RESERVED
});
//# sourceMappingURL=consts.js.map
