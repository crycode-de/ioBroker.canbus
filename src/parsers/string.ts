import { CanBusAdapter } from '../main';
import { ParserBase } from './base';

/**
 * Parser for handling of string values.
 */
export class ParserString extends ParserBase {

  protected static readonly handledDataTypes: ioBroker.AdapterConfigDataType[] = [
    'string'
  ];

  constructor(adapter: CanBusAdapter, parserConfig: ioBroker.AdapterConfigMessageParser) {
    super(adapter, parserConfig);
  }

  public async read(buf: Buffer): Promise<string | Error> {
    try {
      return buf.toString(this.cfg.dataEncoding, this.cfg.dataOffset, this.cfg.dataOffset + this.cfg.dataLength);
    } catch (err: any) {
      return err;
    }
  }

  public async write(buf: Buffer, val: string): Promise<Buffer | Error> {
    const len = Math.min(Buffer.byteLength(val, this.cfg.dataEncoding), this.cfg.dataLength);
    try {
      buf.write(val, this.cfg.dataOffset, len, this.cfg.dataEncoding);
    } catch (err: any) {
      return err;
    }
    return buf;
  }
}