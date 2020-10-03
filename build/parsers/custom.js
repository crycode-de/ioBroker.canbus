"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserCustom = void 0;
const vm2_1 = require("vm2");
const base_1 = require("./base");
/**
 * Parser for handling of custom values using user defined scripts.
 * The user defined scripts will always run in a vm2 instance.
 */
class ParserCustom extends base_1.ParserBase {
    constructor(adapter, parserConfig) {
        super(adapter, parserConfig);
        this.scriptRead = null;
        this.scriptWrite = null;
        // setup static VM instance on first call
        if (ParserCustom.vm === null) {
            ParserCustom.vm = new vm2_1.NodeVM({
                sandbox: {
                    getStateAsync: this.adapter.getStateAsync,
                    getObjectAsync: this.adapter.getForeignObjectAsync,
                    log: this.adapter.log
                }
            });
        }
        // prepare read script
        if (this.cfg.customScriptRead) {
            try {
                this.scriptRead = ParserCustom.vm.run(`
          module.exports = async (buffer) => {
            let value = undefined;
            ${this.cfg.customScriptRead}
            return value;
          }
        `);
            }
            catch (err) {
                this.adapter.log.warn(`Error loading custom read script for parser ${this.cfg.id}! ${err}`);
                if (typeof err.stack === 'string') {
                    this.adapter.log.warn(err.stack.replace(/^\s*vm\.js:\d+.*$(\n)/im, '').replace(/^\s*at new Script[^]*$/im, ''));
                }
            }
        }
        else {
            this.adapter.log.warn(`No read script defined for parser ${this.cfg.id}! Data cannot be read.`);
        }
        // prepare write script
        if (this.cfg.customScriptWrite) {
            try {
                this.scriptWrite = ParserCustom.vm.run(`
          module.exports = async (buffer, value) => {
            ${this.cfg.customScriptWrite}
            return buffer;
          }
        `);
            }
            catch (err) {
                this.adapter.log.warn(`Error loading custom write script for parser ${this.cfg.id}! ${err}`);
                if (typeof err.stack === 'string') {
                    this.adapter.log.warn(err.stack.replace(/^\s*vm\.js:\d+.*$(\n)/im, '').replace(/^\s*at new Script[^]*$/im, ''));
                }
            }
        }
        else {
            this.adapter.log.warn(`No write script defined for parser ${this.cfg.id}! Data cannot be written.`);
        }
    }
    async read(buf) {
        if (!this.scriptRead) {
            return new Error('No read script defined');
        }
        try {
            const value = await this.scriptRead(buf);
            return value;
        }
        catch (err) {
            return err;
        }
    }
    async write(buf, val) {
        if (!this.scriptWrite) {
            return new Error('No write script defined');
        }
        try {
            return await this.scriptWrite(buf, val);
        }
        catch (err) {
            return err;
        }
    }
}
exports.ParserCustom = ParserCustom;
ParserCustom.handledDataTypes = [
    'custom'
];
ParserCustom.vm = null;
