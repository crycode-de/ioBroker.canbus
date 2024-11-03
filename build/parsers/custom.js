"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var custom_exports = {};
__export(custom_exports, {
  ParserCustom: () => ParserCustom
});
module.exports = __toCommonJS(custom_exports);
var import_scoped_eval = __toESM(require("scoped-eval"));
var import_base = require("./base");
const _ParserCustom = class _ParserCustom extends import_base.ParserBase {
  constructor(adapter, parserConfig) {
    super(adapter, parserConfig);
    this.scriptRead = null;
    this.scriptWrite = null;
    if (_ParserCustom.scopedEval === null) {
      _ParserCustom.scopedEval = new import_scoped_eval.default();
      _ParserCustom.scopedEval.allowGlobals([
        "Buffer",
        "Promise"
      ]);
      _ParserCustom.scopedEvalScope = {
        getStateAsync: this.adapter.getStateAsync,
        getForeignStateAsync: this.adapter.getForeignStateAsync,
        getObjectAsync: this.adapter.getObjectAsync,
        getForeignObjectAsync: this.adapter.getForeignObjectAsync,
        setStateAsync: this.adapter.setState,
        setForeignStateAsync: this.adapter.setForeignStateAsync,
        setTimeout: this.adapter.setTimeout,
        clearTimeout: this.adapter.clearTimeout,
        wait: (ms) => new Promise((resolve) => this.adapter.setTimeout(resolve, ms)),
        log: this.adapter.log,
        sharedData: {}
        // object to share some data between all custom parsers of this adapter instance
      };
    }
    if (this.cfg.customScriptRead) {
      try {
        this.scriptRead = _ParserCustom.scopedEval.build(`(
          async () => {
            let value = undefined;
            ${this.cfg.customScriptRead}
            return value;
          }
        )()`, false).bind({});
      } catch (err) {
        this.adapter.log.warn(`Error loading custom read script for parser ${this.cfg.id}! ${err}`);
      }
    } else {
      this.adapter.log.warn(`No read script defined for parser ${this.cfg.id}! Data cannot be read.`);
    }
    if (this.cfg.customScriptWrite) {
      try {
        this.scriptWrite = _ParserCustom.scopedEval.build(`(
          async () => {
            ${this.cfg.customScriptWrite}
            return buffer;
          }
        )()`, false).bind({});
      } catch (err) {
        this.adapter.log.warn(`Error loading custom write script for parser ${this.cfg.id}! ${err}`);
      }
    } else {
      this.adapter.log.warn(`No write script defined for parser ${this.cfg.id}! Data cannot be written.`);
    }
  }
  async read(buf) {
    if (!this.scriptRead) {
      return new Error("No read script defined");
    }
    try {
      const value = await this.scriptRead({
        ..._ParserCustom.scopedEvalScope,
        buffer: Buffer.from(buf)
        // pass a new buffer to prevent changes to the original one
      });
      if (value !== void 0 && this.cfg.customDataType && this.cfg.customDataType !== "mixed" && typeof value !== this.cfg.customDataType) {
        this.adapter.log.warn(`Parser ${this.cfg.id} returned wrong data type ${typeof value}. (expected ${this.cfg.customDataType})`);
      }
      return value;
    } catch (err) {
      return err;
    }
  }
  async write(buf, val) {
    if (!this.scriptWrite) {
      return new Error("No write script defined");
    }
    try {
      return await this.scriptWrite({
        ..._ParserCustom.scopedEvalScope,
        buffer: Buffer.from(buf),
        // pass a new buffer to prevent changes to the original one
        value: val
      });
    } catch (err) {
      return err;
    }
  }
};
_ParserCustom.handledDataTypes = [
  "custom"
];
_ParserCustom.scopedEval = null;
_ParserCustom.scopedEvalScope = null;
let ParserCustom = _ParserCustom;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ParserCustom
});
//# sourceMappingURL=custom.js.map
