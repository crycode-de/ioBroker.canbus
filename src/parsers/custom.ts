import ScopedEval from 'scoped-eval';
import type { AdapterClass } from '@iobroker/types/build/types';
import type { CanBusAdapter } from '../main';
import { ParserBase } from './base';

interface ScopedEvalScope {
  getStateAsync: (id: string, options?: unknown) => ioBroker.GetStatePromise;
  getForeignStateAsync: (id: string, options?: unknown) => ioBroker.GetStatePromise;
  getObjectAsync: (id: string, options?: unknown) => ioBroker.GetObjectPromise;
  getForeignObjectAsync: (id: string, options?: unknown) => ioBroker.GetObjectPromise;
  log: AdapterClass['log'];
  sharedData: Record<string, unknown>;
}

type ScriptRead = (scope: ScopedEvalScope & { buffer: Buffer }) => Promise<boolean | number | string | null>;
type ScriptWrite = (scope: ScopedEvalScope & { buffer: Buffer, value: boolean | number | string | null }) => Promise<Buffer>;

/**
 * Parser for handling of custom values using user defined scripts.
 * The user defined scripts will always run in a vm2 instance.
 */
export class ParserCustom extends ParserBase {

  protected static readonly handledDataTypes: ioBroker.AdapterConfigDataType[] = [
    'custom',
  ];

  private static scopedEval: ScopedEval | null = null;
  private static scopedEvalScope: ScopedEvalScope | null = null;

  private scriptRead: ScriptRead | null = null;
  private scriptWrite: ScriptWrite | null = null;

  constructor (adapter: CanBusAdapter, parserConfig: ioBroker.AdapterConfigMessageParser) {
    super(adapter, parserConfig);

    // setup static ScopedEval instance on first call
    if (ParserCustom.scopedEval === null) {
      ParserCustom.scopedEval = new ScopedEval();
      ParserCustom.scopedEval.allowGlobals([
        'Buffer',
        'Promise',
      ]);
      ParserCustom.scopedEvalScope = {
        getStateAsync: this.adapter.getStateAsync,
        getForeignStateAsync: this.adapter.getForeignStateAsync,
        getObjectAsync: this.adapter.getObjectAsync,
        getForeignObjectAsync: this.adapter.getForeignObjectAsync,
        log: this.adapter.log,
        sharedData: {}, // object to share some data between all custom parsers of this adapter instance
      };
    }

    // prepare read script
    if (this.cfg.customScriptRead) {
      try {
        // buffer will be provided in scope
        this.scriptRead = ParserCustom.scopedEval.build(`(
          async () => {
            let value = undefined;
            ${this.cfg.customScriptRead}
            return value;
          }
        )()`, false).bind({}); // bind `this` to an empty object to prevent access to the parser instance
      } catch (err) {
        this.adapter.log.warn(`Error loading custom read script for parser ${this.cfg.id}! ${err}`);
      }
    } else {
      this.adapter.log.warn(`No read script defined for parser ${this.cfg.id}! Data cannot be read.`);
    }

    // prepare write script
    if (this.cfg.customScriptWrite) {
      try {
        // buffer and value will be provided in scope
        this.scriptWrite = ParserCustom.scopedEval.build(`(
          async () => {
            ${this.cfg.customScriptWrite}
            return buffer;
          }
        )()`, false).bind({}); // bind `this` to an empty object to prevent access to the parser instance
      } catch (err) {
        this.adapter.log.warn(`Error loading custom write script for parser ${this.cfg.id}! ${err}`);
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
      const value = await this.scriptRead({
        ...ParserCustom.scopedEvalScope!,
        buffer: Buffer.from(buf), // pass a new buffer to prevent changes to the original one
      });

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

  public async write (buf: Buffer, val: boolean | number | string | null): Promise <Buffer | false | Error> {
    if (!this.scriptWrite) {
      return new Error('No write script defined');
    }
    try {
      return await this.scriptWrite({
        ...ParserCustom.scopedEvalScope!,
        buffer: Buffer.from(buf), // pass a new buffer to prevent changes to the original one
        value: val,
      });
    } catch (err) {
      return err as Error;
    }
  }
}
