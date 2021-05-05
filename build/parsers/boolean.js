"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserBoolean = void 0;
const base_1 = require("./base");
/**
 * Parser for handling of boolean values.
 */
class ParserBoolean extends base_1.ParserBase {
    constructor(adapter, parserConfig) {
        super(adapter, parserConfig);
    }
    async read(buf) {
        if (this.cfg.dataOffset >= buf.length) {
            return new Error('Data is too short for given offset');
        }
        const val = buf[this.cfg.dataOffset];
        let ret;
        if (this.cfg.booleanMask === 0) {
            // any value greater than 0 will be true
            ret = (val > 0);
        }
        else {
            // check the bitmask
            ret = ((val & this.cfg.booleanMask) === this.cfg.booleanMask);
        }
        // invert?
        if (this.cfg.booleanInvert) {
            ret = !ret;
        }
        return ret;
    }
    async write(buf, val) {
        if (this.cfg.dataOffset >= buf.length) {
            return new Error('Data is too short for given offset');
        }
        // invert?
        if (this.cfg.booleanInvert) {
            val = !val;
        }
        if (this.cfg.booleanMask === 0) {
            // set the byte to 0xff or 0x00 if no bitmask is set
            if (val) {
                buf[this.cfg.dataOffset] = 0xff;
            }
            else {
                buf[this.cfg.dataOffset] = 0x00;
            }
        }
        else {
            // set/clear the bits defined in the bitmask and keep the other bits untouched
            if (val) {
                buf[this.cfg.dataOffset] = (buf[this.cfg.dataOffset] | this.cfg.booleanMask);
            }
            else {
                buf[this.cfg.dataOffset] = (buf[this.cfg.dataOffset] & ~(this.cfg.booleanMask));
            }
        }
        return buf;
    }
}
exports.ParserBoolean = ParserBoolean;
ParserBoolean.handledDataTypes = [
    'boolean'
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm9vbGVhbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wYXJzZXJzL2Jvb2xlYW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsaUNBQW9DO0FBRXBDOztHQUVHO0FBQ0gsTUFBYSxhQUFjLFNBQVEsaUJBQVU7SUFNM0MsWUFBWSxPQUFzQixFQUFFLFlBQWlEO1FBQ25GLEtBQUssQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVNLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBVztRQUMzQixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUU7WUFDckMsT0FBTyxJQUFJLEtBQUssQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1NBQ3hEO1FBRUQsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDckMsSUFBSSxHQUFZLENBQUM7UUFDakIsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsS0FBSyxDQUFDLEVBQUU7WUFDOUIsd0NBQXdDO1lBQ3hDLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUNqQjthQUFNO1lBQ0wsb0JBQW9CO1lBQ3BCLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUMvRDtRQUVELFVBQVU7UUFDVixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFO1lBQzFCLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQztTQUNaO1FBRUQsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0lBRU0sS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFXLEVBQUUsR0FBWTtRQUMxQyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUU7WUFDckMsT0FBTyxJQUFJLEtBQUssQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1NBQ3hEO1FBRUQsVUFBVTtRQUNWLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUU7WUFDMUIsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDO1NBQ1o7UUFFRCxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxLQUFLLENBQUMsRUFBRTtZQUM5QixvREFBb0Q7WUFDcEQsSUFBSSxHQUFHLEVBQUU7Z0JBQ1AsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsSUFBSSxDQUFDO2FBQ2pDO2lCQUFNO2dCQUNMLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQzthQUNqQztTQUNGO2FBQU07WUFDTCw4RUFBOEU7WUFDOUUsSUFBSSxHQUFHLEVBQUU7Z0JBQ1AsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2FBQzlFO2lCQUFNO2dCQUNMLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQzthQUNqRjtTQUNGO1FBRUQsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDOztBQTVESCxzQ0E2REM7QUEzRDJCLDhCQUFnQixHQUFxQztJQUM3RSxTQUFTO0NBQ1YsQ0FBQyJ9