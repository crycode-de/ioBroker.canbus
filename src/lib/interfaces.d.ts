import { PromiseQueue } from '../helpers';
import { ParserBase } from '../parsers/base';

declare global {
  interface MessageConfig extends ioBroker.AdapterConfigMessage {
    /**
     * The ID of the message as number.
     */
    idNum: number;

    /**
     * The ID of the message with optionally DLC appended if set.
     */
    idWithDlc: string;

    /**
     * If the ID is in extended frame format.
     */
    ext: boolean;

    /**
     * The uuid of this message if it is configured.
     * `null` if this message is automatically added.
     */
    uuid: string | null;

    /**
     * Config of the parsers including an instance of the parser.
     */
    parsers: ParserConfigs;

    /**
     * Promise queue for parser and send actions.
     */
    actionQueue?: PromiseQueue;
  }

  interface ParserConfig extends ioBroker.AdapterConfigMessageParser {
    instance?: ParserBase;
  }

  type ParserConfigs = {
    [uuid: string]: ParserConfig;
  };
}