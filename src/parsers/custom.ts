import { NodeVM } from 'vm2';
import type { CanBusAdapter } from '../main';
import { ParserBase } from './base';

type ScriptRead = (buffer: Buffer) => Promise<boolean | number | string | null>;
type ScriptWrite = (buffer: Buffer, value: boolean | number | string | null) => Promise<Buffer>;

/**
 * Parser for handling of custom values using user defined scripts.
 * The user defined scripts will always run in a vm2 instance.
 */
export class ParserCustom extends ParserBase {

  protected static readonly handledDataTypes: ioBroker.AdapterConfigDataType[] = [
    'custom',
  ];

  private static vm: NodeVM | null = null;

  private scriptRead: ScriptRead | null = null;
  private scriptWrite: ScriptWrite | null = null;

  constructor (adapter: CanBusAdapter, parserConfig: ioBroker.AdapterConfigMessageParser) {
    super(adapter, parserConfig);

    // setup static VM instance on first call
    if (ParserCustom.vm === null) {
      ParserCustom.vm = new NodeVM({
        sandbox: {
          getStateAsync: this.adapter.getForeignStateAsync,
          getObjectAsync: this.adapter.getForeignObjectAsync,
          log: this.adapter.log,
          sharedData: {}, // object to share some data between custom parsers
        },
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
        `) as ScriptRead;
      } catch (err) {
        this.adapter.log.warn(`Error loading custom read script for parser ${this.cfg.id}! ${err}`);
        if (err instanceof Error && typeof err.stack === 'string') {
          this.adapter.log.warn(err.stack.replace(/^\s*vm\.js:\d+.*$(\n)/im, '').replace(/^\s*at new Script[^]*$/im, ''));
        }
      }
    } else {
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
        `) as ScriptWrite;
      } catch (err) {
        this.adapter.log.warn(`Error loading custom write script for parser ${this.cfg.id}! ${err}`);
        if (err instanceof Error && typeof err.stack === 'string') {
          this.adapter.log.warn(err.stack.replace(/^\s*vm\.js:\d+.*$(\n)/im, '').replace(/^\s*at new Script[^]*$/im, ''));
        }
      }
    } else {
      this.adapter.log.warn(`No write script defined for parser ${this.cfg.id}! Data cannot be written.`);
    }
  }

  public async read (buf: Buffer): Promise<boolean | number | string | null | Error> {
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
    } catch (err) {
      return err as Error;
    }
  }

  public async write (buf: Buffer, val: boolean | number | string | null): Promise <Buffer | Error> {
    if (!this.scriptWrite) {
      return new Error('No write script defined');
    }
    try {
      return await this.scriptWrite(buf, val);
    } catch (err) {
      return err as Error;
    }
  }
}
