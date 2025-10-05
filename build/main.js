"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var main_exports = {};
__export(main_exports, {
  CanBusAdapter: () => CanBusAdapter
});
module.exports = __toCommonJS(main_exports);
var utils = __toESM(require("@iobroker/adapter-core"));
var import_autobind_decorator = require("autobind-decorator");
var import_can_interface_socketcan = require("./can-interface-socketcan");
var import_can_interface_waveshare_can2eth = require("./can-interface-waveshare-can2eth");
var import_helpers = require("./helpers");
var import_parsers = require("./parsers");
var import_consts = require("./consts");
class CanBusAdapter extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "canbus"
    });
    this.canInterface = null;
    /**
     * Mapping of CAN hex message IDs to the message configs.
     * The IDs must be hex strings (3 or 8 chars) to differentiate between
     * standard frame and extended frame messages.
     */
    this.canId2Message = {};
    /**
     * Set of intervals that needs to be cleared on adapter unload.
     */
    this.intervals = /* @__PURE__ */ new Set();
    this.on("ready", this.onReady);
    this.on("stateChange", this.onStateChange);
    this.on("unload", this.onUnload);
  }
  async onReady() {
    await this.setState("info.connection", false, true);
    await this.setupObjects();
    if (this.config.interfaceType === "socketcan") {
      this.canInterface = new import_can_interface_socketcan.CanInterfaceSocketcan(this);
    } else {
      this.canInterface = new import_can_interface_waveshare_can2eth.CanInterfaceWaveshareCan2eth(this);
    }
    this.canInterface.on("started", () => {
      this.log.debug("can interface started");
      void this.setState("info.connection", false, true);
    });
    this.canInterface.on("stopped", () => {
      this.log.debug("can interface stopped");
      void this.setState("info.connection", false, true);
    });
    this.canInterface.on("message", this.handleCanMsg);
    await this.canInterface.start();
    await this.subscribeStatesAsync("*");
  }
  async onUnload(callback) {
    try {
      if (this.canInterface) {
        await this.canInterface.stop();
      }
      for (const interv of this.intervals) {
        clearInterval(interv);
      }
      this.log.debug("cleaned everything up...");
      callback();
    } catch (_e) {
      callback();
    }
  }
  async onStateChange(id, state) {
    var _a, _b, _c, _d;
    if (state) {
      this.log.silly(`state ${id} changed: ${JSON.stringify(state)}`);
      if (state.ack) return;
      if (this.config.useRawStates && id === `${this.namespace}.raw.send`) {
        let canMsg;
        try {
          canMsg = JSON.parse(state.val);
        } catch (_e) {
          this.log.warn(`Invalid JSON in '${this.namespace}.raw.send' state cannot be send!`);
          return;
        }
        if (canMsg && Array.isArray(canMsg.data)) {
          canMsg.data = Buffer.from(canMsg.data);
        }
        if (!canMsg || typeof canMsg.id !== "number" || !Buffer.isBuffer(canMsg.data)) {
          this.log.warn(`Invalid message data in '${this.namespace}.raw.send' state cannot be send!`);
          return;
        }
        this.log.debug(`sendig data from raw.send state`);
        if (this.sendCanMsg(canMsg.id, (_a = canMsg.ext) != null ? _a : false, canMsg.data, (_b = canMsg.rtr) != null ? _b : false)) {
          if (!state.ack) {
            await this.setState(id, {
              ...state,
              ack: true
            });
          }
        }
        return;
      }
      const [, , msgId, stateId] = id.split(".");
      if (!msgId || !stateId || !msgId.match(import_consts.MESSAGE_ID_REGEXP_WITH_DLC)) return;
      const msgCfg = this.canId2Message[msgId];
      if (!(msgCfg == null ? void 0 : msgCfg.send)) return;
      switch (stateId) {
        case "send":
          if (state.val !== true) return;
          void ((_c = msgCfg.actionQueue) == null ? void 0 : _c.enqueue(async () => {
            if (await this.sendMessageJsonData(msgCfg)) {
              await this.setState(`${msgCfg.idWithDlc}.send`, {
                ...state,
                ack: true
              });
            }
          }));
          break;
        case "json":
          await this.processParsers(this.getBufferFromJsonState(state, msgCfg.idWithDlc), msgCfg);
          if (msgCfg.autosend) {
            await this.sendMessageJsonData(msgCfg, state);
          }
          break;
        case "rtr":
          break;
        default:
          if (!stateId.match(import_consts.PARSER_ID_REGEXP)) return;
          for (const parserUuid in msgCfg.parsers) {
            if (msgCfg.parsers[parserUuid].id !== stateId) continue;
            const parser = msgCfg.parsers[parserUuid];
            await ((_d = msgCfg.actionQueue) == null ? void 0 : _d.enqueue(async () => {
              if (!parser.instance) {
                return;
              }
              const jsonState = await this.getStateAsync(`${msgCfg.idWithDlc}.json`);
              let data = this.getBufferFromJsonState(jsonState, msgCfg.idWithDlc);
              data != null ? data : data = Buffer.alloc(msgCfg.dlc >= 0 ? msgCfg.dlc : 8);
              data = await parser.instance.write(data, state.val);
              if (data === false) {
                this.log.debug(`Parser writing data for message ID ${msgCfg.idWithDlc} parser ID ${parser.id} decided to cancel write`);
                return;
              }
              if (data instanceof Error) {
                this.log.warn(`Parser writing data for message ID ${msgCfg.idWithDlc} parser ID ${parser.id} failed: ${data}`);
                return;
              }
              if (!(data instanceof Buffer)) {
                this.log.warn(`Parser writing data for message ID ${msgCfg.idWithDlc} parser ID ${parser.id} failed: Did not return a buffer`);
                return;
              }
              await this.setState(`${msgCfg.idWithDlc}.json`, JSON.stringify([...data]), false);
              await this.setState(`${msgCfg.idWithDlc}.${parser.id}`, {
                ...state,
                ack: true
              });
            }));
            break;
          }
      }
    } else {
      this.log.silly(`state ${id} deleted`);
    }
  }
  /**
   * Get a buffer from a `.json` state.
   * The JSON string of the state will be parsed and checked to be an array.
   * @param state The state to get the data from.
   * @param msgId The message ID for logging in case of errors.
   */
  getBufferFromJsonState(state, msgId) {
    if (!state) {
      this.log.warn(`Failed parsing JSON from ${this.namespace}.${msgId}.json: No state found`);
      return null;
    }
    let parsedJson;
    try {
      parsedJson = JSON.parse(state.val);
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
  async sendMessageJsonData(msgCfg, state) {
    var _a;
    if (!state) {
      state = await this.getStateAsync(`${msgCfg.idWithDlc}.json`);
      if (!state) {
        this.log.warn(`No state found to send for ${this.namespace}.${msgCfg.idWithDlc}.json`);
        return false;
      }
    }
    const data = this.getBufferFromJsonState(state, msgCfg.idWithDlc);
    if (data === null) {
      return false;
    }
    const rtrState = this.config.useRtrFlag && await this.getStateAsync(`${msgCfg.idWithDlc}.rtr`);
    const rtr = (_a = rtrState && !!rtrState.val) != null ? _a : false;
    if (this.sendCanMsg(msgCfg.idNum, msgCfg.ext, data, rtr)) {
      if (!state.ack) {
        await this.setState(`${msgCfg.idWithDlc}.json`, {
          ...state,
          ack: true
        });
      }
      if (rtrState && !rtrState.ack) {
        await this.setState(`${msgCfg.idWithDlc}.rtr`, {
          ...rtrState,
          ack: true
        });
      }
      if (this.config.useRawStates) {
        const canMsg = {
          id: msgCfg.idNum,
          ext: msgCfg.ext,
          data
        };
        if (this.config.useRtrFlag) {
          canMsg.rtr = rtr;
        }
        void this.setState("raw.send", {
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
  async setupObjects() {
    var _a, _b;
    for (const msgUuid in this.config.messages) {
      const msg = this.config.messages[msgUuid];
      if (!msg.id.match(import_consts.MESSAGE_ID_REGEXP)) {
        this.log.warn(`Message-ID ${msg.id} is invalid. This message will be ignored.`);
        continue;
      }
      const msgCfg = {
        ...msg,
        idNum: parseInt(msg.id, 16),
        idWithDlc: msg.dlc >= 0 ? `${msg.id}-${msg.dlc}` : msg.id,
        ext: msg.id.length > 3,
        uuid: msgUuid
      };
      await this.setupMessage(msgUuid, msgCfg);
    }
    if (this.config.deleteUnconfiguredMessages) {
      const objList = await this.getObjectListAsync({
        startkey: `${this.namespace}.`,
        endkey: `${this.namespace}.\u9999`
      });
      for (const obj of objList.rows) {
        if (obj.value.type !== "channel") continue;
        const idParts = obj.id.split(".");
        if (idParts.length !== 3) continue;
        if (!idParts[2].match(import_consts.MESSAGE_ID_REGEXP_WITH_DLC)) continue;
        const [id, dlcStr] = idParts[2].split("-");
        const dlc = dlcStr === void 0 ? -1 : parseInt(dlcStr, 10);
        if (((_b = (_a = this.config.messages) == null ? void 0 : _a[obj.value.native.uuid]) == null ? void 0 : _b.id) === id && this.config.messages[obj.value.native.uuid].dlc === dlc) continue;
        this.log.debug(`delete unconfigured message ${obj.id}`);
        await this.delForeignObjectAsync(obj.id, { recursive: true });
      }
    }
    if (this.config.useRawStates) {
      await this.extendObject("raw", {
        type: "channel",
        common: {
          name: "Raw message data"
        },
        native: {}
      });
      await this.extendObject("raw.received", {
        type: "state",
        common: {
          role: "json",
          type: "string",
          name: "Last received message",
          read: true,
          write: false
        },
        native: {}
      });
      await this.extendObject("raw.send", {
        type: "state",
        common: {
          role: "json",
          type: "string",
          name: "Last send message or message to send",
          read: true,
          write: true
        },
        native: {}
      });
    } else {
      const chan = await this.getObjectAsync("raw");
      if (chan) {
        this.log.debug(`delete raw objects/states`);
        await this.delObjectAsync("raw", { recursive: true });
      }
    }
  }
  /**
   * Translate a configured data type to the corresponding ioBroker common type.
   * @param dataType Data type from the config.
   * @return The ioBroker common type.
   */
  getCommonTypeFromParser(parser, msgIdWithDlc) {
    if (parser.dataType === "custom") {
      if (parser.customDataType && ["string", "number", "boolean", "mixed"].includes(parser.customDataType)) {
        return parser.customDataType;
      }
      this.log.warn(`Custom parser ${parser.id} of message ${msgIdWithDlc} has no data type set. Please update your configuration.`);
    }
    switch (parser.dataType) {
      case "int8":
      case "uint8":
      case "int16_be":
      case "uint16_be":
      case "int16_le":
      case "uint16_le":
      case "int32_be":
      case "uint32_be":
      case "int32_le":
      case "uint32_le":
      case "float32_be":
      case "float32_le":
      case "double64_be":
      case "double64_le":
        return "number";
      case "boolean":
        return "boolean";
      case "string":
        return "string";
      default:
        return "mixed";
    }
  }
  async handleCanMsg(msg) {
    const msgIdHex = (0, import_helpers.getHexId)(msg.id, !!msg.ext);
    let handled = false;
    if (this.config.useRawStates) {
      void this.setState("raw.received", {
        val: JSON.stringify({
          ...msg,
          data: [...msg.data]
        }),
        ack: true
      });
    }
    if (this.canId2Message[msgIdHex]) {
      await this.processReceivedCanMsg(msg, this.canId2Message[msgIdHex]);
      handled = true;
    }
    if (this.canId2Message[`${msgIdHex}-${msg.data.length}`]) {
      await this.processReceivedCanMsg(msg, this.canId2Message[`${msgIdHex}-${msg.data.length}`]);
      handled = true;
    }
    if (handled) {
      return;
    }
    if (this.config.autoAddSeenMessages) {
      this.log.debug(`auto adding new message ${msg.id}`);
      const msgCfg = {
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
      void this.setState(`${msgCfg.id}.json`, JSON.stringify([...msg.data]), true);
      if (this.config.useRtrFlag) {
        void this.setState(`${msgCfg.id}.rtr`, !!msg.rtr, true);
      }
    } else {
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
  sendCanMsg(id, ext, data, rtr) {
    var _a;
    if (!((_a = this.canInterface) == null ? void 0 : _a.isReady())) {
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
  async processReceivedCanMsg(msg, msgCfg) {
    if (!msgCfg.receive) return;
    await this.setState(`${msgCfg.idWithDlc}.json`, JSON.stringify([...msg.data]), true);
    if (this.config.useRtrFlag) {
      void this.setState(`${msgCfg.idWithDlc}.rtr`, !!msg.rtr, true);
    }
    void this.processParsers(msg.data, msgCfg);
  }
  /**
   * Process all parsers configured for a message to read the values from a buffer.
   * @param buf The buffer containing the data to read from.
   * @param msgCfg The message config to use.
   */
  async processParsers(buf, msgCfg) {
    if (!buf) return;
    for (const parserUuid in msgCfg.parsers) {
      const parser = msgCfg.parsers[parserUuid];
      if (parser.instance) {
        const readResult = await parser.instance.read(buf);
        if (readResult instanceof Error) {
          this.log.warn(`Parser ${parser.id} for ${msgCfg.idWithDlc} failed reading from received data: ${readResult}`);
          continue;
        }
        if (readResult === void 0) {
          this.log.debug(`read parser ${parser.id} for ${msgCfg.idWithDlc} returned undefined`);
          continue;
        }
        void this.setState(`${msgCfg.idWithDlc}.${parser.id}`, readResult, true);
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
  async setupMessage(msgUuid, msgCfg) {
    var _a;
    this.log.debug(`create/update message id: ${msgCfg.idWithDlc}, uuid: ${msgUuid}`);
    if (this.canId2Message[msgCfg.idWithDlc]) {
      this.log.warn(`Cannot setup message with ID ${msgCfg.idWithDlc} because it's already set up! Maybe this message is configured twice?`);
      return;
    }
    await this.extendObject(msgCfg.idWithDlc, {
      type: "channel",
      common: {
        name: msgCfg.name || `CAN-Message 0x${msgCfg.id}${msgCfg.dlc >= 0 ? ` DLC ${msgCfg.dlc}` : ""}`
      },
      native: {
        uuid: msgUuid
      }
    });
    await this.extendObject(`${msgCfg.idWithDlc}.json`, {
      type: "state",
      common: {
        name: `JSON data`,
        role: "json",
        type: "string",
        read: true,
        write: msgCfg.send
        // allow write only if the message is configured for sending
      },
      native: {}
    });
    if (this.config.useRtrFlag) {
      await this.extendObject(`${msgCfg.idWithDlc}.rtr`, {
        type: "state",
        common: {
          name: `Remote Transmission Request`,
          role: "indicator",
          type: "boolean",
          read: true,
          write: msgCfg.send
          // allow write only if the message is configured for sending
        },
        native: {}
      });
    } else {
      const obj = await this.getObjectAsync(`${msgCfg.idWithDlc}.rtr`);
      if (obj) {
        await this.delObjectAsync(`${msgCfg.idWithDlc}.rtr`);
      }
    }
    if (msgCfg.send) {
      await this.extendObject(`${msgCfg.idWithDlc}.send`, {
        type: "state",
        common: {
          name: msgCfg.autosend ? "Manually send current data" : "Send current data",
          role: "button",
          type: "boolean",
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
    const parserIdsSetUp = /* @__PURE__ */ new Set();
    for (const parserUuid in msgCfg.parsers) {
      const parser = msgCfg.parsers[parserUuid];
      if (import_consts.PARSER_ID_RESERVED.includes(parser.id)) {
        this.log.warn(`Parser ID ${parser.id} of message ID ${msgCfg.idWithDlc} is reserved and not allowed. This parser will be ignored.`);
        continue;
      }
      if (!parser.id.match(import_consts.PARSER_ID_REGEXP)) {
        this.log.warn(`Parser ID ${parser.id} of message ID ${msgCfg.idWithDlc} is invalid. This parser will be ignored.`);
        continue;
      }
      if (parserIdsSetUp.has(parser.id)) {
        this.log.warn(`Cannot setup parser with ID ${parser.id} of message with ID ${msgCfg.idWithDlc} because it's already set up! Maybe this parser is configured twice for this message?`);
        continue;
      }
      parserIdsSetUp.add(parser.id);
      this.log.debug(`create/update parser ${msgCfg.idWithDlc}.${parser.id}`);
      let commonStates;
      if (parser.commonStates) {
        if (typeof parser.commonStates === "string" && parser.commonStates.match(import_consts.PARSER_COMMON_STATES_REGEXP)) {
          commonStates = {};
          const list = parser.commonStates.split(",");
          for (const l of list) {
            const [key, val] = l.split("=");
            commonStates[key] = val;
          }
        } else {
          this.log.warn(`Parser ID ${parser.id} of message ID ${msgCfg.idWithDlc} has an invalid list of possible states.`);
        }
      }
      const obj = {
        type: "state",
        common: {
          name: parser.name || `Parser ${parser.id}`,
          type: this.getCommonTypeFromParser(parser, msgCfg.idWithDlc),
          unit: parser.dataUnit,
          read: true,
          write: msgCfg.send,
          // allow write only if the message is configured for sending
          states: commonStates
        },
        native: {
          uuid: parserUuid
        }
      };
      if (parser.commonRole) {
        obj.common.role = parser.commonRole;
      }
      await this.extendObject(`${msgCfg.idWithDlc}.${parser.id}`, obj);
    }
    const objList = await this.getObjectListAsync({
      startkey: `${this.namespace}.${msgCfg.idWithDlc}.`,
      endkey: `${this.namespace}.${msgCfg.idWithDlc}.\u9999`
    });
    for (const obj of objList.rows) {
      if (obj.value.type !== "state") continue;
      const idParts = obj.id.split(".");
      if (idParts.length !== 4) continue;
      if (import_consts.PARSER_ID_RESERVED.includes(idParts[3])) continue;
      if (((_a = msgCfg.parsers[obj.value.native.uuid]) == null ? void 0 : _a.id) === idParts[3]) continue;
      this.log.debug(`delete unconfigured parser ${obj.id}`);
      await this.delForeignObjectAsync(obj.id);
    }
    msgCfg.actionQueue = new import_helpers.PromiseQueue();
    this.canId2Message[msgCfg.idWithDlc] = msgCfg;
    for (const parserUuid in msgCfg.parsers) {
      for (const Parser of import_parsers.knownParsers) {
        if (Parser.canHandle(msgCfg.parsers[parserUuid].dataType)) {
          msgCfg.parsers[parserUuid].instance = new Parser(this, msgCfg.parsers[parserUuid]);
          break;
        }
      }
      if (!msgCfg.parsers[parserUuid].instance) {
        this.log.warn(`No matching parser found for message ID ${msgCfg.idWithDlc} parser ID ${msgCfg.parsers[parserUuid].id} data type ${msgCfg.parsers[parserUuid].dataType}`);
        continue;
      }
      if (typeof msgCfg.parsers[parserUuid].autoSetInterval === "number") {
        let val = msgCfg.parsers[parserUuid].autoSetValue;
        if (val === void 0) {
          switch (msgCfg.parsers[parserUuid].dataType) {
            case "boolean":
              val = false;
              break;
            case "string":
              val = "";
              break;
            case "custom":
              switch (msgCfg.parsers[parserUuid].customDataType) {
                case "boolean":
                  val = false;
                  break;
                case "string":
                  val = "";
                  break;
                case "number":
                  val = 0;
                  break;
              }
              break;
            default:
              val = 0;
          }
        }
        this.log.debug(`setup interval for automatic value set for ${msgCfg.idWithDlc}.${msgCfg.parsers[parserUuid].id} to ${val} every ${msgCfg.parsers[parserUuid].autoSetInterval}ms`);
        this.intervals.add(
          // add the interval to the set of running intervals to clear it on adapter unload
          setInterval(async () => {
            await this.setState(`${msgCfg.idWithDlc}.${msgCfg.parsers[parserUuid].id}`, val);
            if (msgCfg.parsers[parserUuid].autoSetTriggerSend && !msgCfg.autosend) {
              await this.setState(`${msgCfg.idWithDlc}.send`, true, false);
            }
          }, msgCfg.parsers[parserUuid].autoSetInterval)
        );
      }
    }
  }
}
__decorateClass([
  import_autobind_decorator.boundMethod
], CanBusAdapter.prototype, "onReady", 1);
__decorateClass([
  import_autobind_decorator.boundMethod
], CanBusAdapter.prototype, "onUnload", 1);
__decorateClass([
  import_autobind_decorator.boundMethod
], CanBusAdapter.prototype, "onStateChange", 1);
__decorateClass([
  import_autobind_decorator.boundMethod
], CanBusAdapter.prototype, "handleCanMsg", 1);
if (require.main !== module) {
  module.exports = (options) => new CanBusAdapter(options);
} else {
  (() => new CanBusAdapter())();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CanBusAdapter
});
//# sourceMappingURL=main.js.map
