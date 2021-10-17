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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVtYmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BhcnNlcnMvbnVtYmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLGlDQUFvQztBQUVwQzs7R0FFRztBQUNILE1BQWEsWUFBYSxTQUFRLGlCQUFVO0lBbUIxQyxZQUFZLE9BQXNCLEVBQUUsWUFBaUQ7UUFDbkYsS0FBSyxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRU0sS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFXO1FBQzNCLElBQUk7WUFDRixRQUFRLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFO2dCQUN6QixLQUFLLE1BQU0sQ0FBQyxDQUFRLE9BQU8sR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUM3RCxLQUFLLE9BQU8sQ0FBQyxDQUFPLE9BQU8sR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUM5RCxLQUFLLFVBQVUsQ0FBQyxDQUFJLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRSxLQUFLLFVBQVUsQ0FBQyxDQUFJLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRSxLQUFLLFdBQVcsQ0FBQyxDQUFHLE9BQU8sR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNqRSxLQUFLLFdBQVcsQ0FBQyxDQUFHLE9BQU8sR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNqRSxLQUFLLFVBQVUsQ0FBQyxDQUFJLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRSxLQUFLLFVBQVUsQ0FBQyxDQUFJLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRSxLQUFLLFdBQVcsQ0FBQyxDQUFHLE9BQU8sR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNqRSxLQUFLLFdBQVcsQ0FBQyxDQUFHLE9BQU8sR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNqRSxLQUFLLFlBQVksQ0FBQyxDQUFFLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRSxLQUFLLFlBQVksQ0FBQyxDQUFFLE9BQU8sR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNoRSxLQUFLLGFBQWEsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNqRSxLQUFLLGFBQWEsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNqRSxPQUFPLENBQUMsQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLHFDQUFxQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7YUFDckY7U0FDRjtRQUFDLE9BQU8sR0FBUSxFQUFFO1lBQ2pCLE9BQU8sR0FBRyxDQUFDO1NBQ1o7SUFDSCxDQUFDO0lBRU0sS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFXLEVBQUUsR0FBVztRQUN6QyxJQUFJO1lBQ0YsUUFBUSxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRTtnQkFDekIsS0FBSyxNQUFNO29CQUFTLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQUMsTUFBTTtnQkFDbkUsS0FBSyxPQUFPO29CQUFRLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQUMsTUFBTTtnQkFDcEUsS0FBSyxVQUFVO29CQUFLLEdBQUcsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQUMsTUFBTTtnQkFDdEUsS0FBSyxVQUFVO29CQUFLLEdBQUcsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQUMsTUFBTTtnQkFDdEUsS0FBSyxXQUFXO29CQUFJLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQUMsTUFBTTtnQkFDdkUsS0FBSyxXQUFXO29CQUFJLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQUMsTUFBTTtnQkFDdkUsS0FBSyxVQUFVO29CQUFLLEdBQUcsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQUMsTUFBTTtnQkFDdEUsS0FBSyxVQUFVO29CQUFLLEdBQUcsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQUMsTUFBTTtnQkFDdEUsS0FBSyxXQUFXO29CQUFJLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQUMsTUFBTTtnQkFDdkUsS0FBSyxXQUFXO29CQUFJLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQUMsTUFBTTtnQkFDdkUsS0FBSyxZQUFZO29CQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQUMsTUFBTTtnQkFDdEUsS0FBSyxZQUFZO29CQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQUMsTUFBTTtnQkFDdEUsS0FBSyxhQUFhO29CQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQUMsTUFBTTtnQkFDdkUsS0FBSyxhQUFhO29CQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQUMsTUFBTTtnQkFDdkUsT0FBTyxDQUFDLENBQUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxxQ0FBcUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2FBQ3JGO1NBQ0Y7UUFBQyxPQUFPLEdBQVEsRUFBRTtZQUNqQixPQUFPLEdBQUcsQ0FBQztTQUNaO1FBQ0QsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDOztBQXRFSCxvQ0F1RUM7QUFyRTJCLDZCQUFnQixHQUFxQztJQUM3RSxNQUFNO0lBQ04sT0FBTztJQUNQLFVBQVU7SUFDVixVQUFVO0lBQ1YsV0FBVztJQUNYLFdBQVc7SUFDWCxVQUFVO0lBQ1YsVUFBVTtJQUNWLFdBQVc7SUFDWCxXQUFXO0lBQ1gsWUFBWTtJQUNaLFlBQVk7SUFDWixhQUFhO0lBQ2IsYUFBYTtDQUNkLENBQUMifQ==