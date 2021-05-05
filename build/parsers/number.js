"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserNumber = void 0;
const base_1 = require("./base");
/**
 * Parser for handling of well known number values.
 */
class ParserNumber extends base_1.ParserBase {
    constructor(adapter, parserConfig) {
        super(adapter, parserConfig);
    }
    async read(buf) {
        try {
            switch (this.cfg.dataType) {
                case 'int8': return buf.readInt8(this.cfg.dataOffset);
                case 'uint8': return buf.readUInt8(this.cfg.dataOffset);
                case 'int16_be': return buf.readInt16BE(this.cfg.dataOffset);
                case 'int16_le': return buf.readInt16LE(this.cfg.dataOffset);
                case 'uint16_be': return buf.readUInt16BE(this.cfg.dataOffset);
                case 'uint16_le': return buf.readUInt16LE(this.cfg.dataOffset);
                case 'int32_be': return buf.readInt32BE(this.cfg.dataOffset);
                case 'int32_le': return buf.readInt32LE(this.cfg.dataOffset);
                case 'uint32_be': return buf.readUInt32BE(this.cfg.dataOffset);
                case 'uint32_le': return buf.readUInt32LE(this.cfg.dataOffset);
                case 'float32_be': return buf.readFloatBE(this.cfg.dataOffset);
                case 'float32_le': return buf.readFloatLE(this.cfg.dataOffset);
                case 'double64_be': return buf.readDoubleBE(this.cfg.dataOffset);
                case 'double64_le': return buf.readDoubleLE(this.cfg.dataOffset);
                default: return new Error(`This parser can't handle the type ${this.cfg.dataType}`);
            }
        }
        catch (err) {
            return err;
        }
    }
    async write(buf, val) {
        try {
            switch (this.cfg.dataType) {
                case 'int8':
                    buf.writeInt8(val, this.cfg.dataOffset);
                    break;
                case 'uint8':
                    buf.writeUInt8(val, this.cfg.dataOffset);
                    break;
                case 'int16_be':
                    buf.writeInt16BE(val, this.cfg.dataOffset);
                    break;
                case 'int16_le':
                    buf.writeInt16LE(val, this.cfg.dataOffset);
                    break;
                case 'uint16_be':
                    buf.writeUInt16BE(val, this.cfg.dataOffset);
                    break;
                case 'uint16_le':
                    buf.writeUInt16LE(val, this.cfg.dataOffset);
                    break;
                case 'int32_be':
                    buf.writeInt32BE(val, this.cfg.dataOffset);
                    break;
                case 'int32_le':
                    buf.writeInt32LE(val, this.cfg.dataOffset);
                    break;
                case 'uint32_be':
                    buf.writeUInt32BE(val, this.cfg.dataOffset);
                    break;
                case 'uint32_le':
                    buf.writeUInt32LE(val, this.cfg.dataOffset);
                    break;
                case 'float32_be':
                    buf.writeFloatBE(val, this.cfg.dataOffset);
                    break;
                case 'float32_le':
                    buf.writeFloatLE(val, this.cfg.dataOffset);
                    break;
                case 'double64_be':
                    buf.writeDoubleBE(val, this.cfg.dataOffset);
                    break;
                case 'double64_le':
                    buf.writeDoubleLE(val, this.cfg.dataOffset);
                    break;
                default: return new Error(`This parser can't handle the type ${this.cfg.dataType}`);
            }
        }
        catch (err) {
            return err;
        }
        return buf;
    }
}
exports.ParserNumber = ParserNumber;
ParserNumber.handledDataTypes = [
    'int8',
    'uint8',
    'int16_be',
    'int16_le',
    'uint16_be',
    'uint16_le',
    'int32_be',
    'int32_le',
    'uint32_be',
    'uint32_le',
    'float32_be',
    'float32_le',
    'double64_be',
    'double64_le'
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVtYmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BhcnNlcnMvbnVtYmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLGlDQUFvQztBQUVwQzs7R0FFRztBQUNILE1BQWEsWUFBYSxTQUFRLGlCQUFVO0lBbUIxQyxZQUFZLE9BQXNCLEVBQUUsWUFBaUQ7UUFDbkYsS0FBSyxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRU0sS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFXO1FBQzNCLElBQUk7WUFDRixRQUFRLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFO2dCQUN6QixLQUFLLE1BQU0sQ0FBQyxDQUFRLE9BQU8sR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUM3RCxLQUFLLE9BQU8sQ0FBQyxDQUFPLE9BQU8sR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUM5RCxLQUFLLFVBQVUsQ0FBQyxDQUFJLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRSxLQUFLLFVBQVUsQ0FBQyxDQUFJLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRSxLQUFLLFdBQVcsQ0FBQyxDQUFHLE9BQU8sR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNqRSxLQUFLLFdBQVcsQ0FBQyxDQUFHLE9BQU8sR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNqRSxLQUFLLFVBQVUsQ0FBQyxDQUFJLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRSxLQUFLLFVBQVUsQ0FBQyxDQUFJLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRSxLQUFLLFdBQVcsQ0FBQyxDQUFHLE9BQU8sR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNqRSxLQUFLLFdBQVcsQ0FBQyxDQUFHLE9BQU8sR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNqRSxLQUFLLFlBQVksQ0FBQyxDQUFFLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRSxLQUFLLFlBQVksQ0FBQyxDQUFFLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRSxLQUFLLGFBQWEsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNqRSxLQUFLLGFBQWEsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNqRSxPQUFPLENBQUMsQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLHFDQUFxQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7YUFDckY7U0FDRjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxHQUFHLENBQUM7U0FDWjtJQUNILENBQUM7SUFFTSxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQVcsRUFBRSxHQUFXO1FBQ3pDLElBQUk7WUFDRixRQUFRLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFO2dCQUN6QixLQUFLLE1BQU07b0JBQVMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUNuRSxLQUFLLE9BQU87b0JBQVEsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUNwRSxLQUFLLFVBQVU7b0JBQUssR0FBRyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUN0RSxLQUFLLFVBQVU7b0JBQUssR0FBRyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUN0RSxLQUFLLFdBQVc7b0JBQUksR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUN2RSxLQUFLLFdBQVc7b0JBQUksR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUN2RSxLQUFLLFVBQVU7b0JBQUssR0FBRyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUN0RSxLQUFLLFVBQVU7b0JBQUssR0FBRyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUN0RSxLQUFLLFdBQVc7b0JBQUksR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUN2RSxLQUFLLFdBQVc7b0JBQUksR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUN2RSxLQUFLLFlBQVk7b0JBQUcsR0FBRyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUN0RSxLQUFLLFlBQVk7b0JBQUcsR0FBRyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUN0RSxLQUFLLGFBQWE7b0JBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUN2RSxLQUFLLGFBQWE7b0JBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFBQyxNQUFNO2dCQUN2RSxPQUFPLENBQUMsQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLHFDQUFxQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7YUFDckY7U0FDRjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxHQUFHLENBQUM7U0FDWjtRQUNELE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQzs7QUF0RUgsb0NBdUVDO0FBckUyQiw2QkFBZ0IsR0FBcUM7SUFDN0UsTUFBTTtJQUNOLE9BQU87SUFDUCxVQUFVO0lBQ1YsVUFBVTtJQUNWLFdBQVc7SUFDWCxXQUFXO0lBQ1gsVUFBVTtJQUNWLFVBQVU7SUFDVixXQUFXO0lBQ1gsV0FBVztJQUNYLFlBQVk7SUFDWixZQUFZO0lBQ1osYUFBYTtJQUNiLGFBQWE7Q0FDZCxDQUFDIn0=