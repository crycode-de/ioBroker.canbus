"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanBusAdapter = void 0;
const utils = __importStar(require("@iobroker/adapter-core"));
const core_decorators_1 = require("core-decorators");
const can_interface_1 = require("./can-interface");
const helpers_1 = require("./helpers");
const parsers_1 = require("./parsers");
const consts_1 = require("./consts");
class CanBusAdapter extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: 'canbus',
        });
        this.canInterface = null;
        /**
         * Mapping of CAN hex message IDs to the message configs.
         * The IDs must be hex strings (3 or 8 chars) to differentiate between
         * stanard frame and extended frame messages.
         */
        this.canId2Message = {};
        /**
         * Set of intervals that needs to be cleared on adapter unload.
         */
        this.intervals = new Set();
        this.on('ready', this.onReady);
        this.on('stateChange', this.onStateChange);
        this.on('unload', this.onUnload);
    }
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Reset the connection indicator during startup
        this.setState('info.connection', false, true);
        await this.setupObjects();
        this.canInterface = new can_interface_1.CanInterface(this);
        this.canInterface.on('stopped', () => {
            this.setState('info.connection', false, true);
        });
        this.canInterface.on('message', this.handleCanMsg);
        if (this.canInterface.start()) {
            this.log.debug('can interface started');
            this.setState('info.connection', true, true);
        }
        this.subscribeStatesAsync('*');
    }
    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    onUnload(callback) {
        try {
            if (this.canInterface) {
                this.canInterface.stop();
            }
            // stop intervals
            for (const interv of this.intervals) {
                clearInterval(interv);
            }
            this.log.debug('cleaned everything up...');
            callback();
        }
        catch (e) {
            callback();
        }
    }
    /**
     * Is called if a subscribed state changes.
     *
     * This will trigger the sending of messages and conversion from parser states
     * into message json states if configured.
     */
    async onStateChange(id, state) {
        var _a, _b;
        if (state) {
            // The state was changed
            this.log.silly(`state ${id} changed: ${JSON.stringify(state)}`);
            // don't do anything if the state is acked
            if (state.ack)
                return;
            // raw.send state?
            if (this.config.useRawStates && id === `${this.namespace}.raw.send`) {
                // load and check message data
                let canMsg;
                try {
                    canMsg = JSON.parse(state.val);
                }
                catch (e) {
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
            const [, , msgId, stateId] = id.split('.');
            // we only want states of a message objects
            if (!msgId || !stateId || !msgId.match(consts_1.MESSAGE_ID_REGEXP_WITH_DLC))
                return;
            const msgCfg = this.canId2Message[msgId];
            // we need a message and the message must be configured for sending
            if (!msgCfg || !msgCfg.send)
                return;
            switch (stateId) {
                case 'send':
                    if (state.val !== true)
                        return;
                    // use the message action queue to make sure the parsers are done before sending
                    (_a = msgCfg.actionQueue) === null || _a === void 0 ? void 0 : _a.enqueue(async () => {
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
                    if (!stateId.match(consts_1.PARSER_ID_REGEXP))
                        return;
                    // find and run the configured parser
                    for (const parserUuid in msgCfg.parsers) {
                        if (msgCfg.parsers[parserUuid].id !== stateId)
                            continue;
                        // check if the parser is initialized
                        const parser = msgCfg.parsers[parserUuid];
                        // use the message action queue to make sure the parsers (and a possible followed send) run in correct order
                        (_b = msgCfg.actionQueue) === null || _b === void 0 ? void 0 : _b.enqueue(async () => {
                            if (!parser.instance) {
                                return;
                            }
                            // load the current json from state
                            const jsonState = await this.getStateAsync(`${msgCfg.idWithDlc}.json`);
                            let data = this.getBufferFromJsonState(jsonState, msgCfg.idWithDlc);
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
        }
        else {
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
    getBufferFromJsonState(state, msgId) {
        if (!state) {
            this.log.warn(`Failed parsing JSON from ${this.namespace}.${msgId}.json: No state found`);
            return null;
        }
        let parsedJson;
        try {
            parsedJson = JSON.parse(state.val);
        }
        catch (err) {
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
                const canMsg = {
                    id: msgCfg.idNum,
                    ext: msgCfg.ext,
                    data
                };
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
        }
        else {
            this.log.warn(`Sending data message for ${msgCfg.idWithDlc} failed!`);
            return false;
        }
    }
    /**
     * Setup the object tree for the messages and parsers.
     */
    async setupObjects() {
        // loop over configured messages
        for (const msgUuid in this.config.messages) {
            const msg = this.config.messages[msgUuid];
            if (!msg.id.match(consts_1.MESSAGE_ID_REGEXP)) {
                this.log.warn(`Message-ID ${msg.id} is invalid. This message will be ignored.`);
                continue;
            }
            const msgCfg = {
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
                if (obj.value.type !== 'channel')
                    continue;
                // obj id must have three parts
                const idParts = obj.id.split('.');
                if (idParts.length !== 3)
                    continue;
                // obj id part 2 (msgId) must match the message id regexp
                if (!idParts[2].match(consts_1.MESSAGE_ID_REGEXP_WITH_DLC))
                    continue;
                const [id, dlcStr] = idParts[2].split('-');
                const dlc = (dlcStr === undefined) ? -1 : parseInt(dlcStr, 10);
                // is a message with this native.uuid configured with this id?
                if (this.config.messages && this.config.messages[obj.value.native.uuid] && this.config.messages[obj.value.native.uuid].id === id && this.config.messages[obj.value.native.uuid].dlc === dlc)
                    continue;
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
        }
        else {
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
    getCommonTypeFromParser(parser, msgIdWithDlc) {
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
    async handleCanMsg(msg) {
        // TODO: maybe need to check the numeric ID against a Set of known IDs for
        //       a better performance on systems with very high message load?
        const msgIdHex = (0, helpers_1.getHexId)(msg.id, !!msg.ext);
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
            this.setStateAsync(`${msgCfg.id}.json`, JSON.stringify([...msg.data]), true);
            if (this.config.useRtrFlag) {
                this.setStateAsync(`${msgCfg.id}.rtr`, !!msg.rtr, true);
            }
        }
        else {
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
    sendCanMsg(id, ext, data, rtr) {
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
    async processReceivedCanMsg(msg, msgCfg) {
        // do nothing if the message isn't configured for receiving
        if (!msgCfg.receive)
            return;
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
    async processParsers(buf, msgCfg) {
        if (!buf)
            return;
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
                this.setStateAsync(`${msgCfg.idWithDlc}.${parser.id}`, readResult, true);
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
        this.log.debug(`create/update message id: ${msgCfg.idWithDlc}, uuid: ${msgUuid}`);
        // check if this message is already set up
        if (this.canId2Message[msgCfg.idWithDlc]) {
            this.log.warn(`Cannot setup message with ID ${msgCfg.idWithDlc} because it's already set up! Maybe this message is configured twice?`);
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
        }
        else {
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
        }
        else {
            const obj = await this.getObjectAsync(`${msgCfg.idWithDlc}.send`);
            if (obj) {
                await this.delObjectAsync(`${msgCfg.idWithDlc}.send`);
            }
        }
        // setup parser objects
        const parserIdsSetUp = new Set();
        for (const parserUuid in msgCfg.parsers) {
            const parser = msgCfg.parsers[parserUuid];
            if (consts_1.PARSER_ID_RESERVED.includes(parser.id)) {
                this.log.warn(`Parser ID ${parser.id} of message ID ${msgCfg.idWithDlc} is reserved and not allowed. This parser will be ignored.`);
                continue;
            }
            if (!parser.id.match(consts_1.PARSER_ID_REGEXP)) {
                this.log.warn(`Parser ID ${parser.id} of message ID ${msgCfg.idWithDlc} is invalid. This parser will be ignored.`);
                continue;
            }
            // check if this parser is already set up
            if (parserIdsSetUp.has(parser.id)) {
                this.log.warn(`Cannot setup parser with ID ${parser.id} of message with ID ${msgCfg.idWithDlc} because it's already set up! Maybe this parser is configured twice for this message?`);
                continue;
            }
            parserIdsSetUp.add(parser.id);
            this.log.debug(`create/update parser ${msgCfg.idWithDlc}.${parser.id}`);
            let commonStates = undefined;
            if (parser.commonStates) {
                if (typeof parser.commonStates === 'string' && parser.commonStates.match(consts_1.PARSER_COMMON_STATES_REGEXP)) {
                    commonStates = {};
                    const list = parser.commonStates.split(',');
                    for (const l of list) {
                        const [key, val] = l.split('=');
                        commonStates[key] = val;
                    }
                }
                else {
                    this.log.warn(`Parser ID ${parser.id} of message ID ${msgCfg.idWithDlc} has an invalid list of possible states.`);
                }
            }
            // prepare state object
            const obj = {
                type: 'state',
                common: {
                    name: parser.name || `Parser ${parser.id}`,
                    type: this.getCommonTypeFromParser(parser, msgCfg.idWithDlc),
                    unit: parser.dataUnit,
                    read: true,
                    write: msgCfg.send,
                    states: commonStates,
                },
                native: {
                    uuid: parserUuid
                }
            };
            // set parser role if defined in the config... if not defined, the user may set this manually in the state object
            if (parser.commonRole) {
                // @ts-expect-error Typescript thinks obj.common may be undefined, but by defining the object above it's always defined
                obj.common.role = parser.commonRole;
            }
            // update/set the ioBroker state
            await this.extendObjectAsync(`${msgCfg.idWithDlc}.${parser.id}`, obj);
        }
        // remove unconfigured parsers
        const objList = await this.getObjectListAsync({
            startkey: `${this.namespace}.${msgCfg.idWithDlc}.`,
            endkey: `${this.namespace}.${msgCfg.idWithDlc}.\u9999`
        });
        for (const obj of objList.rows) {
            // check if obj is a state (all parser objects are created as state)
            if (obj.value.type !== 'state')
                continue;
            // obj id must have four parts
            const idParts = obj.id.split('.');
            if (idParts.length !== 4)
                continue;
            // obj id part 3 (parserId) must not be in the reserved ids
            if (consts_1.PARSER_ID_RESERVED.includes(idParts[3]))
                continue;
            // is a parser with this native.uuid configured with this id?
            if (msgCfg.parsers[obj.value.native.uuid] && msgCfg.parsers[obj.value.native.uuid].id === idParts[3])
                continue;
            // not configured... delete it with all it's child objects
            this.log.debug(`delete unconfigured parser ${obj.id}`);
            await this.delForeignObjectAsync(obj.id);
        }
        // create action queue
        msgCfg.actionQueue = new helpers_1.PromiseQueue();
        // save to our canId->msg mapping
        this.canId2Message[msgCfg.idWithDlc] = msgCfg;
        // setup the parser instances
        for (const parserUuid in msgCfg.parsers) {
            for (const Parser of parsers_1.knownParsers) {
                if (Parser.canHandle(msgCfg.parsers[parserUuid].dataType)) {
                    msgCfg.parsers[parserUuid].instance = new Parser(this, msgCfg.parsers[parserUuid]);
                    break;
                }
            }
            // check if an instance is created
            if (!msgCfg.parsers[parserUuid].instance) {
                this.log.warn(`No matching parser found for message ID ${msgCfg.idWithDlc} parser ID ${msgCfg.parsers[parserUuid].id} data type ${msgCfg.parsers[parserUuid].dataType}`);
                continue;
            }
            // set a defined state value in a certain interval if configured
            if (typeof msgCfg.parsers[parserUuid].autoSetInterval === 'number') {
                let val = msgCfg.parsers[parserUuid].autoSetValue;
                // use defaults if autoSetValue is undefined
                if (val === undefined) {
                    switch (msgCfg.parsers[parserUuid].dataType) {
                        case 'boolean':
                            val = false;
                            break;
                        case 'string':
                            val = '';
                            break;
                        case 'custom':
                            switch (msgCfg.parsers[parserUuid].customDataType) {
                                case 'boolean':
                                    val = false;
                                    break;
                                case 'string':
                                    val = '';
                                    break;
                                case 'number':
                                    val = 0;
                                    break;
                                // case 'mixed': - mixed can be undefined
                            }
                            break;
                        default: // any number
                            val = 0;
                    }
                }
                this.log.debug(`setup interval for automatic value set for ${msgCfg.idWithDlc}.${msgCfg.parsers[parserUuid].id} to ${val} every ${msgCfg.parsers[parserUuid].autoSetInterval}ms`);
                this.intervals.add(// add the interval to the set of running intervals to clear it on adapter unload
                setInterval(async () => {
                    // set the state
                    await this.setStateAsync(`${msgCfg.idWithDlc}.${msgCfg.parsers[parserUuid].id}`, val);
                    // trigger send if enabled and autosend is disables
                    if (msgCfg.parsers[parserUuid].autoSetTriggerSend && !msgCfg.autosend) {
                        await this.setStateAsync(`${msgCfg.idWithDlc}.send`, true, false);
                    }
                }, msgCfg.parsers[parserUuid].autoSetInterval));
            }
        }
    }
}
__decorate([
    core_decorators_1.autobind
], CanBusAdapter.prototype, "onReady", null);
__decorate([
    core_decorators_1.autobind
], CanBusAdapter.prototype, "onUnload", null);
__decorate([
    core_decorators_1.autobind
], CanBusAdapter.prototype, "onStateChange", null);
__decorate([
    core_decorators_1.autobind
], CanBusAdapter.prototype, "handleCanMsg", null);
exports.CanBusAdapter = CanBusAdapter;
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options) => new CanBusAdapter(options);
}
else {
    // otherwise start the instance directly
    (() => new CanBusAdapter())();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsOERBQWdEO0FBQ2hELHFEQUEyQztBQUczQyxtREFBK0M7QUFDL0MsdUNBQW1EO0FBRW5ELHVDQUF3QztBQUV4QyxxQ0FNa0I7QUFFbEIsTUFBYSxhQUFjLFNBQVEsS0FBSyxDQUFDLE9BQU87SUFnQjlDLFlBQVksVUFBeUMsRUFBRTtRQUNyRCxLQUFLLENBQUM7WUFDSixHQUFHLE9BQU87WUFDVixJQUFJLEVBQUUsUUFBUTtTQUNmLENBQUMsQ0FBQztRQWxCRyxpQkFBWSxHQUF3QixJQUFJLENBQUM7UUFFakQ7Ozs7V0FJRztRQUNLLGtCQUFhLEdBQWtDLEVBQUUsQ0FBQztRQUUxRDs7V0FFRztRQUNLLGNBQVMsR0FBd0IsSUFBSSxHQUFHLEVBQWtCLENBQUM7UUFRakUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVEOztPQUVHO0lBRUssS0FBSyxDQUFDLE9BQU87UUFDbkIsZ0RBQWdEO1FBQ2hELElBQUksQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTlDLE1BQU0sSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1FBRTFCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSw0QkFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNDLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7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