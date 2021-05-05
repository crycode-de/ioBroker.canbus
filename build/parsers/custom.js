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
                    getStateAsync: this.adapter.getForeignStateAsync,
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
            // check if the correct data type is returned and log a warning if not
            // ... but not if undefined is returned because this may be expected
            if (value !== undefined && this.cfg.customDataType && this.cfg.customDataType !== 'mixed' && typeof value !== this.cfg.customDataType) {
                this.adapter.log.warn(`Parser ${this.cfg.id} returned wrong data type ${typeof value}. (expected ${this.cfg.customDataType})`);
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BhcnNlcnMvY3VzdG9tLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZCQUE2QjtBQUc3QixpQ0FBb0M7QUFFcEM7OztHQUdHO0FBQ0gsTUFBYSxZQUFhLFNBQVEsaUJBQVU7SUFXMUMsWUFBWSxPQUFzQixFQUFFLFlBQWlEO1FBQ25GLEtBQUssQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFKdkIsZUFBVSxHQUFrRCxJQUFJLENBQUM7UUFDakUsZ0JBQVcsR0FBaUUsSUFBSSxDQUFDO1FBS3ZGLHlDQUF5QztRQUN6QyxJQUFJLFlBQVksQ0FBQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzVCLFlBQVksQ0FBQyxFQUFFLEdBQUcsSUFBSSxZQUFNLENBQUM7Z0JBQzNCLE9BQU8sRUFBRTtvQkFDUCxhQUFhLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0I7b0JBQ2hELGNBQWMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQjtvQkFDbEQsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRztpQkFDdEI7YUFDRixDQUFDLENBQUM7U0FDSjtRQUVELHNCQUFzQjtRQUN0QixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUU7WUFDN0IsSUFBSTtnQkFDRixJQUFJLENBQUMsVUFBVSxHQUFHLFlBQVksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDOzs7Y0FHaEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0I7OztTQUc5QixDQUFDLENBQUM7YUFDSjtZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUNaLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQywrQ0FBK0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDNUYsSUFBSSxPQUFPLEdBQUcsQ0FB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