import type { CanBusAdapter } from '../main';
import { ParserBase } from './base';

/**
 * Parser for handling of well known number values.
 */
export class ParserNumber extends ParserBase {

  protected static readonly handledDataTypes: ioBroker.AdapterConfigDataType[] = [
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
    'double64_le',
  ];

  constructor (adapter: CanBusAdapter, parserConfig: ioBroker.AdapterConfigMessageParser) {
    super(adapter, parserConfig);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async read (buf: Buffer): Promise<number | Error> {
    try {
      // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
      switch (this.cfg.dataType) {
        /* eslint-disable @stylistic/no-multi-spaces */
        case 'int8':        return buf.readInt8(this.cfg.dataOffset);
        case 'uint8':       return buf.readUInt8(this.cfg.dataOffset);
        case 'int16_be':    return buf.readInt16BE(this.cfg.dataOffset);
        case 'int16_le':    return buf.readInt16LE(this.cfg.dataOffset);
        case 'uint16_be':   return buf.readUInt16BE(this.cfg.dataOffset);
        case 'uint16_le':   return buf.readUInt16LE(this.cfg.dataOffset);
        case 'int32_be':    return buf.readInt32BE(this.cfg.dataOffset);
        case 'int32_le':    return buf.readInt32LE(this.cfg.dataOffset);
        case 'uint32_be':   return buf.readUInt32BE(this.cfg.dataOffset);
        case 'uint32_le':   return buf.readUInt32LE(this.cfg.dataOffset);
        case 'float32_be':  return buf.readFloatBE(this.cfg.dataOffset);
        case 'float32_le':  return buf.readFloatLE(this.cfg.dataOffset);
        case 'double64_be': return buf.readDoubleBE(this.cfg.dataOffset);
        case 'double64_le': return buf.readDoubleLE(this.cfg.dataOffset);
        /* eslint-enable @stylistic/no-multi-spaces */
        default: return new Error(`This parser can't handle the type ${this.cfg.dataType}`);
      }
    } catch (err) {
      return err as Error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async write (buf: Buffer, val: number): Promise<Buffer | Error> {
    try {
      // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
      switch (this.cfg.dataType) {
        /* eslint-disable @stylistic/no-multi-spaces,@stylistic/max-statements-per-line */
        case 'int8':        buf.writeInt8(val, this.cfg.dataOffset); break;
        case 'uint8':       buf.writeUInt8(val, this.cfg.dataOffset); break;
        case 'int16_be':    buf.writeInt16BE(val, this.cfg.dataOffset); break;
        case 'int16_le':    buf.writeInt16LE(val, this.cfg.dataOffset); break;
        case 'uint16_be':   buf.writeUInt16BE(val, this.cfg.dataOffset); break;
        case 'uint16_le':   buf.writeUInt16LE(val, this.cfg.dataOffset); break;
        case 'int32_be':    buf.writeInt32BE(val, this.cfg.dataOffset); break;
        case 'int32_le':    buf.writeInt32LE(val, this.cfg.dataOffset); break;
        case 'uint32_be':   buf.writeUInt32BE(val, this.cfg.dataOffset); break;
        case 'uint32_le':   buf.writeUInt32LE(val, this.cfg.dataOffset); break;
        case 'float32_be':  buf.writeFloatBE(val, this.cfg.dataOffset); break;
        case 'float32_le':  buf.writeFloatLE(val, this.cfg.dataOffset); break;
        case 'double64_be': buf.writeDoubleBE(val, this.cfg.dataOffset); break;
        case 'double64_le': buf.writeDoubleLE(val, this.cfg.dataOffset); break;
        /* eslint-enable @stylistic/no-multi-spaces,@stylistic/max-statements-per-line */
        default: return new Error(`This parser can't handle the type ${this.cfg.dataType}`);
      }
    } catch (err) {
      return err as Error;
    }
    return buf;
  }
}
