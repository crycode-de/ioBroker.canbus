import type { CanBusAdapter } from '../main';

/**
 * Abstract base class for all parsers.
 * Each parser must extend this base class, implement the `read()` and `write()`
 * methods and set its `handledDataTypes`.
 */
export abstract class ParserBase {

  /**
   * Array of data types this parser can handle.
   */
  protected static readonly handledDataTypes: string[] = [];

  /**
   * The config of this parser.
   */
  protected readonly cfg: Readonly<ioBroker.AdapterConfigMessageParser>;

  /**
   * Instance of the adapter.
   */
  protected readonly adapter: CanBusAdapter;

  constructor (adapter: CanBusAdapter, parserConfig: ioBroker.AdapterConfigMessageParser) {
    this.cfg = parserConfig;
    this.adapter = adapter;
  }

  /**
   * Read the value from the buffer.
   * @param buf The buffer to read from.
   * @return The value or an `Error` if the value could not be read.
   */
  public abstract read (buf: Buffer): Promise<boolean | number | string | null | Error>;

  /**
   * Write a value to the buffer.
   * @param buf The buffer to write to.
   * @param val The value to write.
   * @return The new/modified buffer if the value has been written, `false` if the parser decided to cancel write or an `Error` if the value could not be written.
   */
  public abstract write (buf: Buffer, val: unknown): Promise<Buffer | false | Error>;

  /**
   * Check if this parser can handle a data type.
   * @param dataType The data type to check for.
   * @return `true` if this parser can handle the data type.
   */
  public static canHandle (dataType: ioBroker.AdapterConfigDataType): boolean {
    return this.handledDataTypes.includes(dataType);
  }
}
