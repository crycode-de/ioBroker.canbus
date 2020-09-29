import { ParserBase } from './base';

/**
 * Parser for handling of string values.
 */
export class ParserString extends ParserBase {

  protected static readonly handledDataTypes: ioBroker.AdapterConfigDataType[] = [
    'string'
  ];

  constructor(parserConfig: ioBroker.AdapterConfigMessageParser) {
    super(parserConfig);
  }

  public read(buf: Buffer): string | Error {
    try {
      return buf.toString(this.cfg.dataEncoding, this.cfg.dataOffset, this.cfg.dataOffset + this.cfg.dataLength);
    } catch (err) {
      return err;
    }
  }

  public write(buf: Buffer, val: string): true | Error {
    const len = Math.min(Buffer.byteLength(val, this.cfg.dataEncoding), this.cfg.dataLength);
    try {
      buf.write(val, this.cfg.dataOffset, len, this.cfg.dataEncoding);
    } catch (err) {
      return err;
    }
    return true;
  }
}