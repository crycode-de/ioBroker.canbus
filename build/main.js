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
        const msgIdHex = helpers_1.getHexId(msg.id, !!msg.ext);
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