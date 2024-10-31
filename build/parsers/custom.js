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
var custom_exports = {};
__export(custom_exports, {
  ParserCustom: () => ParserCustom
});
module.exports = __toCommonJS(custom_exports);
var import_vm2 = require("vm2");
var import_base = require("./base");
const _ParserCustom = class _ParserCustom extends import_base.ParserBase {
  constructor(adapter, parserConfig) {
    super(adapter, parserConfig);
    this.scriptRead = null;
    this.scriptWrite = null;
    if (_ParserCustom.vm === null) {
      _ParserCustom.vm = new import_vm2.NodeVM({
        sandbox: {
          getStateAsync: this.adapter.getForeignStateAsync,
          getObjectAsync: this.adapter.getForeignObjectAsync,
          log: this.adapter.log,
          sharedData: {}
          // object to share some data between custom parsers
        }
      });
    }
    if (this.cfg.customScriptRead) {
      try {
        this.scriptRead = _ParserCustom.vm.run(`
          module.exports = async (buffer) => {
            let value = undefined;
            ${this.cfg.customScriptRead}
            return value;
          }
        `);
      } catch (err) {
        this.adapter.log.warn(`Error loading custom read script for parser ${this.cfg.id}! ${err}`);
        if (err instanceof Error && typeof err.stack === "string") {
          this.adapter.log.warn(err.stack.replace(/^\s*vm\.js:\d+.*$(\n)/im, "").replace(/^\s*at new Script[^]*$/im, ""));
        }
      }
    } else {
      this.adapter.log.warn(`No read script defined for parser ${this.cfg.id}! Data cannot be read.`);
    }
    if (this.cfg.customScriptWrite) {
      try {
        this.scriptWrite = _ParserCustom.vm.run(`
          module.exports = async (buffer, value) => {
            ${this.cfg.customScriptWrite}
            return buffer;
          }
        `);
      } catch (err) {
        this.adapter.log.warn(`Error loading custom write script for parser ${this.cfg.id}! ${err}`);
        if (err instanceof Error && typeof err.stack === "string") {
          this.adapter.log.warn(err.stack.replace(/^\s*vm\.js:\d+.*$(\n)/im, "").replace(/^\s*at new Script[^]*$/im, ""));
        }
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
      const value = await this.scriptRead(buf);
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
      return await this.scriptWrite(buf, val);
    } catch (err) {
      return err;
    }
  }
};
_ParserCustom.handledDataTypes = [
  "custom"
];
_ParserCustom.vm = null;
let ParserCustom = _ParserCustom;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ParserCustom
});
//# sourceMappingURL=custom.js.map
