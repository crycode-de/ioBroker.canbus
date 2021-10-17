"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
                this.log.debug(`setup interval for automatic value set for ${msgCfg.idWithDlc}.${msgCfg.parsers[parserUuid].id} to ${msgCfg.parsers[parserUuid].autoSetValue} every ${msgCfg.parsers[parserUuid].autoSetInterval}ms`);
                this.intervals.add(// add the interval to the set of running intervals to clear it on adapter unload
                setInterval(async () => {
                    // set the state
                    await this.setStateAsync(`${msgCfg.idWithDlc}.${msgCfg.parsers[parserUuid].id}`, msgCfg.parsers[parserUuid].autoSetValue);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw4REFBZ0Q7QUFDaEQscURBQTJDO0FBRzNDLG1EQUErQztBQUMvQyx1Q0FBbUQ7QUFFbkQsdUNBQXdDO0FBRXhDLHFDQU1rQjtBQUVsQixNQUFhLGFBQWMsU0FBUSxLQUFLLENBQUMsT0FBTztJQWdCOUMsWUFBWSxVQUF5QyxFQUFFO1FBQ3JELEtBQUssQ0FBQztZQUNKLEdBQUcsT0FBTztZQUNWLElBQUksRUFBRSxRQUFRO1NBQ2YsQ0FBQyxDQUFDO1FBbEJHLGlCQUFZLEdBQXdCLElBQUksQ0FBQztRQUVqRDs7OztXQUlHO1FBQ0ssa0JBQWEsR0FBa0MsRUFBRSxDQUFDO1FBRTFEOztXQUVHO1FBQ0ssY0FBUyxHQUF3QixJQUFJLEdBQUcsRUFBa0IsQ0FBQztRQVFqRSxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzNDLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7O09BRUc7SUFFSyxLQUFLLENBQUMsT0FBTztRQUNuQixnREFBZ0Q7UUFDaEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFOUMsTUFBTSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7UUFFMUIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLDRCQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtZQUNu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