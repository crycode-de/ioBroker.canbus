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
                if (err instanceof Error && typeof err.stack === 'string') {
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
                if (err instanceof Error && typeof err.stack === 'string') {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BhcnNlcnMvY3VzdG9tLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZCQUE2QjtBQUc3QixpQ0FBb0M7QUFFcEM7OztHQUdHO0FBQ0gsTUFBYSxZQUFhLFNBQVEsaUJBQVU7SUFXMUMsWUFBWSxPQUFzQixFQUFFLFlBQWlEO1FBQ25GLEtBQUssQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFKdkIsZUFBVSxHQUFrRCxJQUFJLENBQUM7UUFDakUsZ0JBQVcsR0FBaUUsSUFBSSxDQUFDO1FBS3ZGLHlDQUF5QztRQUN6QyxJQUFJLFlBQVksQ0FBQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzVCLFlBQVksQ0FBQyxFQUFFLEdBQUcsSUFBSSxZQUFNLENBQUM7Z0JBQzNCLE9BQU8sRUFBRTtvQkFDUCxhQUFhLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0I7b0JBQ2hELGNBQWMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQjtvQkFDbEQsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRztpQkFDdEI7YUFDRixDQUFDLENBQUM7U0FDSjtRQUVELHNCQUFzQjtRQUN0QixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUU7WUFDN0IsSUFBSTtnQkFDRixJQUFJLENBQUMsVUFBVSxHQUFHLFlBQVksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDOzs7Y0FHaEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0I7OztTQUc5QixDQUFDLENBQUM7YUFDSjtZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUNaLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQywrQ0FBK0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDNUYsSUFBSSxHQUFHLFlBQVksS0FB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