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
        this.on('ready', this.onReady);
        this.on('stateChange', this.onStateChange);
        this.on('unload', this.onUnload);
        debugger;
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
            if (!msgCfg.parsers[parserUuid].instance) {
                this.log.warn(`No matching parser found for message ID ${msgCfg.idWithDlc} parser ID ${msgCfg.parsers[parserUuid].id} data type ${msgCfg.parsers[parserUuid].dataType}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw4REFBZ0Q7QUFDaEQscURBQTJDO0FBRzNDLG1EQUErQztBQUMvQyx1Q0FBbUQ7QUFFbkQsdUNBQXdDO0FBRXhDLHFDQU1rQjtBQUVsQixNQUFhLGFBQWMsU0FBUSxLQUFLLENBQUMsT0FBTztJQVc5QyxZQUFZLFVBQXlDLEVBQUU7UUFDckQsS0FBSyxDQUFDO1lBQ0osR0FBRyxPQUFPO1lBQ1YsSUFBSSxFQUFFLFFBQVE7U0FDZixDQUFDLENBQUM7UUFiRyxpQkFBWSxHQUF3QixJQUFJLENBQUM7UUFFakQ7Ozs7V0FJRztRQUNLLGtCQUFhLEdBQWtDLEVBQUUsQ0FBQztRQVF4RCxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzNDLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNqQyxRQUFRLENBQUM7SUFDWCxDQUFDO0lBRUQ7O09BRUc7SUFFSyxLQUFLLENBQUMsT0FBTztRQUNuQixnREFBZ0Q7UUFDaEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFOUMsTUFBTSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7UUFFMUIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLDRCQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtZQUNuQyxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLEtB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