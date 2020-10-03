import { CanBusAdapter } from '../main';
import { ParserBase } from './base';

/**
 * Parser for handling of boolean values.
 */
export class ParserBoolean extends ParserBase {

  protected static readonly handledDataTypes: ioBroker.AdapterConfigDataType[] = [
    'boolean'
  ];

  constructor(adapter: CanBusAdapter, parserConfig: ioBroker.AdapterConfigMessageParser) {
    super(adapter, parserConfig);
  }

  public async read(buf: Buffer): Promise<boolean | Error> {
    if (this.cfg.dataOffset >= buf.length) {
      return new Error('Data is too short for given offset');
    }

    const val = buf[this.cfg.dataOffset];
    let ret: boolean;
    if (this.cfg.booleanMask === 0) {
      // any value greater than 0 will be true
      ret = (val > 0);
    } else {
      // check the bitmask
      ret = ((val & this.cfg.booleanMask) === this.cfg.booleanMask);
    }

    // invert?
    if (this.cfg.booleanInvert) {
      ret = !ret;
    }

    return ret;
  }

  public async write(buf: Buffer, val: boolean): Promise<Buffer | Error> {
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
      } else {
        buf[this.cfg.dataOffset] = 0x00;
      }
    } else {
      // set/clear the bits defined in the bitmask and keep the other bits untouched
      if (val) {
        buf[this.cfg.dataOffset] = (buf[this.cfg.dataOffset] | this.cfg.booleanMask);
      } else {
        buf[this.cfg.dataOffset] = (buf[this.cfg.dataOffset] & ~(this.cfg.booleanMask));
      }
    }

    return buf;
  }
}