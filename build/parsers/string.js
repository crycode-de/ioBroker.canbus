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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BhcnNlcnMvc3RyaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLGlDQUFvQztBQUVwQzs7R0FFRztBQUNILE1BQWEsWUFBYSxTQUFRLGlCQUFVO0lBTTFDLFlBQVksT0FBc0IsRUFBRSxZQUFpRDtRQUNuRixLQUFLLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFTSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQVc7UUFDM0IsSUFBSTtZQUNGLE9BQU8sR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQzVHO1FBQUMsT0FBTyxHQUFRLEVBQUU7WUFDakIsT0FBTyxHQUFHLENBQUM7U0FDWjtJQUNILENBQUM7SUFFTSxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQVcsRUFBRSxHQUFXO1FBQ3pDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3pGLElBQUk7WUFDRixHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUNqRTtRQUFDLE9BQU8sR0FBUSxFQUFFO1lBQ2pCLE9BQU8sR0FBRyxDQUFDO1NBQ1o7UUFDRCxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7O0FBMUJILG9DQTJCQztBQXpCMkIsNkJBQWdCLEdBQXFDO0lBQzdFLFFBQVE7Q0FDVCxDQUFDIn0=