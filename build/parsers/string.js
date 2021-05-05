"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserString = void 0;
const base_1 = require("./base");
/**
 * Parser for handling of string values.
 */
class ParserString extends base_1.ParserBase {
    constructor(adapter, parserConfig) {
        super(adapter, parserConfig);
    }
    async read(buf) {
        try {
            return buf.toString(this.cfg.dataEncoding, this.cfg.dataOffset, this.cfg.dataOffset + this.cfg.dataLength);
        }
        catch (err) {
            return err;
        }
    }
    async write(buf, val) {
        const len = Math.min(Buffer.byteLength(val, this.cfg.dataEncoding), this.cfg.dataLength);
        try {
            buf.write(val, this.cfg.dataOffset, len, this.cfg.dataEncoding);
        }
        catch (err) {
            return err;
        }
        return buf;
    }
}
exports.ParserString = ParserString;
ParserString.handledDataTypes = [
    'string'
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BhcnNlcnMvc3RyaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLGlDQUFvQztBQUVwQzs7R0FFRztBQUNILE1BQWEsWUFBYSxTQUFRLGlCQUFVO0lBTTFDLFlBQVksT0FBc0IsRUFBRSxZQUFpRDtRQUNuRixLQUFLLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFTSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQVc7UUFDM0IsSUFBSTtZQUNGLE9BQU8sR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQzVHO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLEdBQUcsQ0FBQztTQUNaO0lBQ0gsQ0FBQztJQUVNLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBVyxFQUFFLEdBQVc7UUFDekMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDekYsSUFBSTtZQUNGLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQ2pFO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLEdBQUcsQ0FBQztTQUNaO1FBQ0QsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDOztBQTFCSCxvQ0EyQkM7QUF6QjJCLDZCQUFnQixHQUFxQztJQUM3RSxRQUFRO0NBQ1QsQ0FBQyJ9