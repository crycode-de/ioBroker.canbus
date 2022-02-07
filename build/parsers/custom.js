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
                    log: this.adapter.log,
                    sharedData: {}, // object to share some data between custom parsers
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BhcnNlcnMvY3VzdG9tLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZCQUE2QjtBQUc3QixpQ0FBb0M7QUFFcEM7OztHQUdHO0FBQ0gsTUFBYSxZQUFhLFNBQVEsaUJBQVU7SUFXMUMsWUFBWSxPQUFzQixFQUFFLFlBQWlEO1FBQ25GLEtBQUssQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFKdkIsZUFBVSxHQUFrRCxJQUFJLENBQUM7UUFDakUsZ0JBQVcsR0FBaUUsSUFBSSxDQUFDO1FBS3ZGLHlDQUF5QztRQUN6QyxJQUFJLFlBQVksQ0FBQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzVCLFlBQVksQ0FBQyxFQUFFLEdBQUcsSUFBSSxZQUFNLENBQUM7Z0JBQzNCLE9BQU8sRUFBRTtvQkFDUCxhQUFhLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0I7b0JBQ2hELGNBQWMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQjtvQkFDbEQsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRztvQkFDckIsVUFBVSxFQUFFLEVBQUUsRUFBRSxtREFBbUQ7aUJBQ3BFO2FBQ0YsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxzQkFBc0I7UUFDdEIsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFO1lBQzdCLElBQUk7Z0JBQ0YsSUFBSSxDQUFDLFVBQVUsR0FBRyxZQUFZLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQzs7O2NBR2hDLElBQUksQ0FBQyxHQUFHLENBQUMsZ0JBQWdCOzs7U0FHOUIsQ0FBQyxDQUFDO2FBQ0o7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsK0NBQStDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsRUFBRSxD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