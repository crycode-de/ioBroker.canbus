import * as utils from '@iobroker/adapter-core';
import { autobind } from 'core-decorators';
import { CanMessage } from 'socketcan';

import { CanInterface } from './can-interface';
import { getHexId, PromiseQueue } from './helpers';

import { knownParsers } from './parsers'

import {
  MESSAGE_ID_REGEXP,
  MESSAGE_ID_REGEXP_WITH_DLC,
  PARSER_ID_REGEXP,
  PARSER_ID_RESERVED
} from './consts';

export class CanBusAdapter extends utils.Adapter {

  private canInterface: CanInterface | null = null;

  /**
   * Mapping of CAN hex message IDs to the message configs.
   * The IDs must be hex strings (3 or 8 chars) to differentiate between
   * stanard frame and extended frame messages.
   */
  private canId2Message: Record<string, MessageConfig> = {};

  constructor(options: Partial<utils.AdapterOptions> = {}) {
    super({
      ...options,
      name: 'canbus',
    });

    this.on('ready', this.onReady);
    this.on('stateChange', this.onStateChange);
    this.on('unload', this.onUnload);
  }

  /**
   * Is called when databases are connected and adapter received configuration.
   */
  @autobind
  private async onReady(): Promise<void> {
    // Reset the connection indicator during startup
    this.setState('info.connection', false, true);

    await this.setupObjects();

    this.canInterface = new CanInterface(this);
    this.canInterface.on('stopped', () => {
      this.setState('info.connection', false, true);
    });
    this.canInterface.on('message', this.handleCanMsg);

    if (this.canInterface.start()) {
      this.setState('info.connection', true, true);
    }

    this.subscribeStatesAsync('*');
  }

  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   */
  @autobind
  private onUnload(callback: () => void): void {
    try {
      if (this.canInterface) {
        this.canInterface.stop();
      }

      this.log.debug('cleaned everything up...');
      callback();
    } catch (e) {
      callback();
    }
  }

  /**
   * Is called if a subscribed state changes.
   *
   * This will trigger the sending of messages and conversion from parser states
   * into message json states if configured.
   */
  @autobind
  private async onStateChange(id: string, state: ioBroker.State | null | undefined): Promise<void> {
    if (state) {
      // The state was changed
      this.log.silly(`state ${id} changed: ${JSON.stringify(state)}`);

      // don't do anything if the state is acked
      if (state.ack) return;

      // raw.send state?
      if (this.config.useRawStates && id === `${this.namespace}.raw.send`) {
        // load and check message data
        let canMsg: CanMessage;
        try {
          canMsg = JSON.parse(state.val as string)
        } catch (e) {
          this.log.warn(`Invalid JSON in '${this.namespace}.raw.send' state cannot be send!`);
          return;
        }
        if (canMsg && Array.isArray(canMsg.data)) {
          canMsg.data = Buffer.from(canMsg.data);
        }
        if (!canMsg || typeof canMsg.id !== 'number' || !Buffer.isBuffer(canMsg.data)) {
          this.log.warn(`Invalid message data in '${this.namespace}.raw.send' state cannot be send!`);
          return;
        }

        // send the message
        this.log.debug(`sendig data from raw.send state`);
        if (this.sendCanMsg(canMsg.id, canMsg.ext || false, canMsg.data, canMsg.rtr || false)) {
          // set ack flag if the message was send and not already acked
          if (!state.ack) {
            await this.setStateAsync(id, {
              ...state,
              ack: true
            });
          }
        }
        return;
      }

      // get msg und state ID
      const [,, msgId, stateId] = id.split('.');

      // we only want states of a message objects
      if (!msgId || !stateId || !msgId.match(MESSAGE_ID_REGEXP_WITH_DLC)) return;

      const msgCfg = this.canId2Message[msgId];

      // we need a message and the message must be configured for sending
      if (!msgCfg || !msgCfg.send) return;

      switch (stateId) {
        case 'send':
          if (state.val !== true) return;

          // use the message action queue to make sure the parsers are done before sending
          msgCfg.actionQueue?.enqueue(async () => {
            // send the current json data
            if (await this.sendMessageJsonData(msgCfg)) {
              // set ack flag on the send state if the message was sent
              await this.setStateAsync(`${msgCfg.idWithDlc}.send`, {
                ...state,
                ack: true
              });
            }
          });

          break;

        case 'json':
          // let the parsers read the data from json to keep the parsers data in sync with the json data
          this.processParsers(this.getBufferFromJsonState(state, msgCfg.idWithDlc), msgCfg);

          // send current json data
          if (msgCfg.autosend) {
            this.sendMessageJsonData(msgCfg, state);
          }
          break;

        case 'rtr':
          // nothing to do here
          break;

        default:
          // it may be a parser...
          if (!stateId.match(PARSER_ID_REGEXP)) return;

          // find and run the configured parser
          for (const parserUuid in msgCfg.parsers) {
            if (msgCfg.parsers[parserUuid].id !== stateId) continue;

            // check if the parser is initialized
            const parser = msgCfg.parsers[ parserUuid ];

            // use the message action queue to make sure the parsers (and a possible followed send) run in correct order
            msgCfg.actionQueue?.enqueue(async () => {
              if (!parser.instance) {
                return;
              }

              // load the current json from state
              const jsonState = await this.getStateAsync(`${msgCfg.idWithDlc}.json`);
              let data: Buffer | Error | null = this.getBufferFromJsonState(jsonState, msgCfg.idWithDlc);
              if (data === null) {
                // state not found or invalid json in state... create default buffer for the parser
                data = Buffer.alloc(msgCfg.dlc >= 0 ? msgCfg.dlc : 8);
              }

              // write to data using the parser
              data = await parser.instance.write(data, state.val);

              // check the write result
              if (data instanceof Error) {
                this.log.warn(`Parser writing data for message ID ${msgCfg.idWithDlc} parser ID ${parser.id} failed: ${data}`);
                return;
              }
              if (!(data instanceof Buffer)) {
                this.log.warn(`Parser writing data for message ID ${msgCfg.idWithDlc} parser ID ${parser.id} failed: Did not return a buffer`);
                return;
              }

              // set the new json state with ack=false
              await this.setStateAsync(`${msgCfg.idWithDlc}.json`, JSON.stringify([...data]), false);

              // set ack flag on the parser state
              await this.setStateAsync(`${msgCfg.idWithDlc}.${parser.id}`, {
                ...state,
                ack: true
              });
            });

            break;
          }
      }

    } else {
      // The state was deleted
      this.log.silly(`state ${id} deleted`);
    }
  }

  /**
   * Get a buffer from a `.json` state.
   * The JSON string of the state will be parsed and checked to be an array.
   * @param state The state to get the data from.
   * @param msgId The message ID for logging in case of errors.
   */
  private getBufferFromJsonState (state: ioBroker.State | null | undefined, msgId: string): Buffer | null {
    if (!state) {
      this.log.warn(`Failed parsing JSON from ${this.namespace}.${msgId}.json: No state found`);
      return null;
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(state.val as string);
    } catch (err) {
      this.log.warn(`Failed parsing JSON from ${this.namespace}.${msgId}.json: ${err}`);
      return null;
    }

    if (!Array.isArray(parsedJson)) {
      this.log.warn(`JSON data in ${this.namespace}.${msgId}.json is not an array!`);
      return null;
    }
    if (parsedJson.length > 8) {
      this.log.warn(`Array length of JSON data in ${this.namespace}.${msgId}.json is greater than 8. Only up to 8 data bytes are supported!`);
      return null;
    }

    return Buffer.from(parsedJson);
  }

  /**
   * Send the data of a message present in it's json state.
   * For the json and rtr states of the message the ack flag will be set if the message is sent.
   * @param msgCfg The `MessageConfig` of the message for which we should send the data.
   * @param state Optional state to use for sending. If not set, the current state of the object will be read.
   * @return `true` if the message was sent.
   */
  private async sendMessageJsonData (msgCfg: MessageConfig, state?: ioBroker.State | null | undefined): Promise<boolean> {
    // read the state if not given by argument
    if (!state) {
      state = await this.getStateAsync(`${msgCfg.idWithDlc}.json`);
      if (!state) {
        this.log.warn(`No state found to send for ${this.namespace}.${msgCfg.idWithDlc}.json`);
        return false;
      }
    }

    // parse and check the json data
    const data = this.getBufferFromJsonState(state, msgCfg.idWithDlc);
    if (data === null) {
      return false;
    }

    // get rtr flag from state
    const rtrState = this.config.useRtrFlag && await this.getStateAsync(`${msgCfg.idWithDlc}.rtr`);
    const rtr = rtrState && !!rtrState.val || false;

    // send the message
    if (this.sendCanMsg(msgCfg.idNum, msgCfg.ext, data, rtr)) {
      // set ack flag on json if the message was send and not already acked
      if (!state.ack) {
        await this.setStateAsync(`${msgCfg.idWithDlc}.json`, {
          ...state,
          ack: true
        });
      }

      // set ack on rtr if not already acked
      if (rtrState && !rtrState.ack) {
        await this.setStateAsync(`${msgCfg.idWithDlc}.rtr`, {
          ...rtrState,
          ack: true
        });
      }

      // set raw state if enabled
      if (this.config.useRawStates) {
        const canMsg: CanMessage = {
          id: msgCfg.idNum,
          ext: msgCfg.ext,
          data
        }
        if (this.config.useRtrFlag) {
          canMsg.rtr = rtr;
        }
        this.setStateAsync('raw.send', {
          val: JSON.stringify({
            ...canMsg,
            data: [...data]
          }),
          ack: true
        });
      }

      return true;
    } else {
      this.log.warn(`Sending data message for ${msgCfg.idWithDlc} failed!`);
      return false;
    }
  }

  /**
   * Setup the object tree for the messages and parsers.
   */
  private async setupObjects (): Promise<void> {
    // loop over configured messages
    for (const msgUuid in this.config.messages) {
      const msg = this.config.messages[msgUuid];
      if (!msg.id.match(MESSAGE_ID_REGEXP)) {
        this.log.warn(`Message-ID ${msg.id} is invalid. This message will be ignored.`);
        continue;
      }

      const msgCfg: MessageConfig = {
        ...msg,
        idNum: parseInt(msg.id, 16),
        idWithDlc: (msg.dlc >= 0) ? `${msg.id}-${msg.dlc}` : msg.id,
        ext: msg.id.length > 3,
        uuid: msgUuid,
      };

      await this.setupMessage(msgUuid, msgCfg);
    }

    // delete unconfigured message objects
    if (this.config.deleteUnconfiguredMessages) {
      const objList = await this.getObjectListAsync({
        startkey: `${this.namespace}.`,
        endkey: `${this.namespace}.\u9999`
      });

      // loop over all objects in the namespace of the adapter and check them
      for (const obj of objList.rows) {
        // check if obj is a channel (all message objects are created as channel)
        if (obj.value.type !== 'channel') continue;

        // obj id must have three parts
        const idParts = obj.id.split('.');
        if (idParts.length !== 3) continue;

        // obj id part 2 (msgId) must match the message id regexp
        if (!idParts[2].match(MESSAGE_ID_REGEXP_WITH_DLC)) continue;

        const [id, dlcStr] = idParts[2].split('-');
        const dlc = (dlcStr === undefined) ? -1 : parseInt(dlcStr, 10);

        // is a message with this native.uuid configured with this id?
        if (this.config.messages && this.config.messages[obj.value.native.uuid] && this.config.messages[obj.value.native.uuid].id === id && this.config.messages[obj.value.native.uuid].dlc === dlc) continue;

        // not configured... delete it recursively
        this.log.debug(`delete unconfigured message ${obj.id}`);
        await this.delForeignObjectAsync(obj.id, { recursive: true });
      }
    }

    // create or remove raw states
    if (this.config.useRawStates) {
      // raw states are enabled
      await this.extendObjectAsync('raw', {
        type: 'channel',
        common: {
          name: 'Raw message data'
        },
        native: {}
      });
      await this.extendObjectAsync('raw.received', {
        type: 'state',
        common: {
          role: 'json',
          type: 'string',
          name: 'Last received message',
          read: true,
          write: false
        },
        native: {}
      });
      await this.extendObjectAsync('raw.send', {
        type: 'state',
        common: {
          role: 'json',
          type: 'string',
          name: 'Last send message or message to send',
          read: true,
          write: true
        },
        native: {}
      });
    } else {
      // raw states are disabled... delete them if exists
      const chan = await this.getObjectAsync('raw');
      if (chan) {
        this.log.debug(`delete raw objects/states`);
        await this.delObjectAsync('raw', { recursive: true });
      }
    }
  }

  /**
   * Translate a configured data type to the corresponding ioBroker common type.
   * @param dataType Data type from the config.
   * @return The ioBroker common type.
   */
  private getCommonTypeFromParser(parser: ioBroker.AdapterConfigMessageParser, msgIdWithDlc: string): ioBroker.CommonType {
    // custom data type for custom parsers
    if (parser.dataType === 'custom') {
      if (parser.customDataType && ['string', 'number', 'boolean', 'mixed'].includes(parser.customDataType)) {
        return parser.customDataType;
      }
      this.log.warn(`Custom parser ${parser.id} of message ${msgIdWithDlc} has no data type set. Please update your configuration.`);
    }

    // generic data types
    switch (parser.dataType) {
      case 'int8':
      case 'uint8':
      case 'int16_be':
      case 'uint16_le':
      case 'int16_be':
      case 'uint16_le':
      case 'int32_be':
      case 'uint32_le':
      case 'int32_be':
      case 'uint32_le':
      case 'float32_be':
      case 'float32_le':
      case 'double64_be':
      case 'double64_le':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'string':
        return 'string';
      default: // e.g. for custom
        return 'mixed';
    }
  }

  /**
   * Handler for received CAN messages.
   * @param msg The received CAN message.
   */
  @autobind
  private async handleCanMsg (msg: CanMessage): Promise<void> {
    // TODO: maybe need to check the numeric ID against a Set of known IDs for
    //       a better performance on systems with very high message load?

    const msgIdHex = getHexId(msg.id, !!msg.ext);
    let handled = false;

    // save to raw state if enabled
    if (this.config.useRawStates) {
      this.setStateAsync('raw.received', {
        val: JSON.stringify({
          ...msg,
          data: [...msg.data]
        }),
        ack: true
      });
    }

    if (this.canId2Message[msgIdHex]) {
      // it's a known message without DLC
      await this.processReceivedCanMsg(msg, this.canId2Message[msgIdHex]);
      handled = true;
    }
    if (this.canId2Message[`${msgIdHex}-${msg.data.length}`]) {
      // it's a known message with defined DLC
      await this.processReceivedCanMsg(msg, this.canId2Message[`${msgIdHex}-${msg.data.length}`]);
      handled = true;
    }

    // just end here if the message was handled by at least one config
    if (handled) {
      return;
    }

    if (this.config.autoAddSeenMessages) {
      // it's not known but we should add it
      this.log.debug(`auto adding new message ${msg.id}`);
      const msgCfg: MessageConfig = {
        id: msgIdHex,
        idNum: msg.id,
        idWithDlc: msgIdHex,
        ext: msgIdHex.length > 3,
        uuid: null,
        name: `CAN-Message 0x${msgIdHex}`,
        dlc: -1,
        autosend: false,
        send: false,
        receive: true,
        parsers: {}
      };
      await this.setupMessage(null, msgCfg);

      this.setStateAsync(`${msgCfg.id}.json`, JSON.stringify([...msg.data]), true);
      if (this.config.useRtrFlag) {
        this.setStateAsync(`${msgCfg.id}.rtr`, !!msg.rtr, true);
      }
    } else {
      // known message... just ignore
      this.log.debug(`ignoring message ${msg.id}`);
    }
  }

  /**
   * Send a CAN message with the given properties.
   * @param id The numeric ID of the CAN message.
   * @param ext `true` if the message should be send in extended frame format.
   * @param data The data of the message. 0 to 8 bytes buffer.
   * @param rtr Remote transmission request flag.
   */
  private sendCanMsg (id: number, ext: boolean, data: Buffer, rtr: boolean): boolean {
    if (!this.canInterface || !this.canInterface.isReady()) {
      this.log.warn(`Could not send data because CAN interface is not ready.`);
      return false;
    }

    return this.canInterface.send(id, ext, data, rtr);
  }

  /**
   * Process a received CAN message using the given message config.
   * @param msg The received CAN message.
   * @param msgCfg The config for the Message.
   */
  private async processReceivedCanMsg (msg: CanMessage, msgCfg: MessageConfig): Promise<void> {
    // do nothing if the message isn't configured for receiving
    if (!msgCfg.receive) return;

    // set raw states
    this.setStateAsync(`${msgCfg.idWithDlc}.json`, JSON.stringify([...msg.data]), true);
    if (this.config.useRtrFlag) {
      this.setStateAsync(`${msgCfg.idWithDlc}.rtr`, !!msg.rtr, true);
    }

    // run the configured parsers
    this.processParsers(msg.data, msgCfg);
  }

  /**
   * Process all parsers configured for a message to read the values from a buffer.
   * @param buf The buffer containing the data to read from.
   * @param msgCfg The message config to use.
   */
  private async processParsers (buf: Buffer | null, msgCfg: MessageConfig): Promise<void> {
    if (!buf) return;

    for (const parserUuid in msgCfg.parsers) {
      // check if the parser is initialized
      const parser = msgCfg.parsers[parserUuid];
      if (parser.instance) {
        const readResult = await parser.instance.read(buf);
        // check if the parser has read a value (null indicates an error)
        if (readResult instanceof Error) {
          this.log.warn(`Parser ${parser.id} for ${msgCfg.idWithDlc} failed reading from received data: ${readResult}`);
          continue;
        }
        if (readResult === undefined) {
          this.log.debug(`read parser ${parser.id} for ${msgCfg.idWithDlc} returned undefined`);
          continue;
        }

        this.setStateAsync(`${msgCfg.idWithDlc}.${parser.id}`, readResult as any, true);
      }
    }
  }

  /**
   * Setup a message for use in this adapter.
   * This will create/update all needed/configured objects for a message.
   * This will also initialize the parsers if configured.
   * @param msgUuid UUID of the message or `null` if it is an unconfigured message.
   * @param msgCfg The message config containing the information about the message.
   */
  private async setupMessage(msgUuid: string | null, msgCfg: MessageConfig): Promise<void> {
    this.log.debug(`create/update message id: ${msgCfg.idWithDlc}, uuid: ${msgUuid}`);

    // check if this message is already set up
    if (this.canId2Message[msgCfg.idWithDlc]) {
      this.log.warn(`Cannot setup message with id ${msgCfg.idWithDlc} because it's already set up! Maybe this message is configured twice?`)
      return;
    }

    // create/update channel object for the message
    await this.extendObjectAsync(msgCfg.idWithDlc, {
      type: 'channel',
      common: {
        name: msgCfg.name || `CAN-Message 0x${msgCfg.id}${msgCfg.dlc >= 0 ? ` DLC ${msgCfg.dlc}` : ''}`
      },
      native: {
        uuid: msgUuid
      }
    });

    // create/update "raw" data state
    await this.extendObjectAsync(`${msgCfg.idWithDlc}.json`, {
      type: 'state',
      common: {
        name: `JSON data`,
        role: 'json',
        type: 'string',
        read: true,
        write: msgCfg.send // allow write only if the message is configured for sending
      },
      native: {}
    });

    // create/update or delete "rtr" state
    if (this.config.useRtrFlag) {
      await this.extendObjectAsync(`${msgCfg.idWithDlc}.rtr`, {
        type: 'state',
        common: {
          name: `Remote Transmission Request`,
          role: 'indicator',
          type: 'boolean',
          read: true,
          write: msgCfg.send // allow write only if the message is configured for sending
        },
        native: {}
      });
    } else {
      const obj = await this.getObjectAsync(`${msgCfg.idWithDlc}.rtr`);
      if (obj) {
        await this.delObjectAsync(`${msgCfg.idWithDlc}.rtr`);
      }
    }

    // create/update or delete "send" state depending on "send" option
    if (msgCfg.send) {
      await this.extendObjectAsync(`${msgCfg.idWithDlc}.send`, {
        type: 'state',
        common: {
          name: msgCfg.autosend ? 'Manually send current data' : 'Send current data',
          role: 'button',
          type: 'boolean',
          read: false,
          write: true
        },
        native: {}
      });
    } else {
      const obj = await this.getObjectAsync(`${msgCfg.idWithDlc}.send`);
      if (obj) {
        await this.delObjectAsync(`${msgCfg.idWithDlc}.send`);
      }
    }

    // setup parser objects
    for (const parserUuid in msgCfg.parsers) {
      const parser = msgCfg.parsers[parserUuid];
      if (PARSER_ID_RESERVED.includes(parser.id)) {
        this.log.warn(`Parser ID ${parser.id} of message ID ${msgCfg.idWithDlc} is reserved and not allowed. This parser will be ignored.`);
        continue;
      }
      if (!parser.id.match(PARSER_ID_REGEXP)) {
        this.log.warn(`Parser ID ${parser.id} of message ID ${msgCfg.idWithDlc} is invalid. This parser will be ignored.`);
        continue;
      }
      this.log.debug(`create/update parser ${msgCfg.idWithDlc}.${parser.id}`);
      await this.extendObjectAsync(`${msgCfg.idWithDlc}.${parser.id}`, {
        type: 'state',
        common: {
          name: parser.name || `Parser ${parser.id}`,
          //role: 'state', // don't set the role here to let the user change it in admin
          type: this.getCommonTypeFromParser(parser, msgCfg.idWithDlc),
          unit: parser.dataUnit,
          read: true,
          write: msgCfg.send // allow write only if the message is configured for sending
        },
        native: {
          uuid: parserUuid
        }
      });
    }

    // remove unconfigured parsers
    const objList = await this.getObjectListAsync({
      startkey: `${this.namespace}.${msgCfg.idWithDlc}.`,
      endkey: `${this.namespace}.${msgCfg.idWithDlc}.\u9999`
    });
    for (const obj of objList.rows) {
      // check if obj is a state (all parser objects are created as state)
      if (obj.value.type !== 'state') continue;

      // obj id must have four parts
      const idParts = obj.id.split('.');
      if (idParts.length !== 4) continue;

      // obj id part 3 (parserId) must not be in the reserved ids
      if (PARSER_ID_RESERVED.includes(idParts[3])) continue;

      // is a parser with this native.uuid configured with this id?
      if (msgCfg.parsers[obj.value.native.uuid] && msgCfg.parsers[obj.value.native.uuid].id === idParts[3]) continue;

      // not configured... delete it with all it's child objects
      this.log.debug(`delete unconfigured parser ${obj.id}`);
      await this.delForeignObjectAsync(obj.id);
    }

    // create action queue
    msgCfg.actionQueue = new PromiseQueue();

    // save to our canId->msg mapping
    this.canId2Message[msgCfg.idWithDlc] = msgCfg;

    // setup the parser instances
    for (const parserUuid in msgCfg.parsers) {
      for (const Parser of knownParsers) {
        if (Parser.canHandle(msgCfg.parsers[parserUuid].dataType)) {
          msgCfg.parsers[parserUuid].instance = new Parser(this, msgCfg.parsers[parserUuid]);
          break;
        }
      }
      if (!msgCfg.parsers[parserUuid].instance) {
        this.log.warn(`No matching parser found for message ID ${msgCfg.idWithDlc} parser ID ${msgCfg.parsers[parserUuid].id} data type ${msgCfg.parsers[parserUuid].dataType}`);
      }
    }
  }
}

if (module.parent) {
  // Export the constructor in compact mode
  module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new CanBusAdapter(options);
} else {
  // otherwise start the instance directly
  (() => new CanBusAdapter())();
}
