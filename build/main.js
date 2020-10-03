"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanBusAdapter = void 0;
const utils = require("@iobroker/adapter-core");
const core_decorators_1 = require("core-decorators");
const can_interface_1 = require("./can-interface");
const helpers_1 = require("./helpers");
const parsers_1 = require("./parsers");
const consts_1 = require("./consts");
class CanBusAdapter extends utils.Adapter {
    constructor(options = {}) {
        super(Object.assign(Object.assign({}, options), { name: 'canbus' }));
        //private readonly namespace: string;
        this.canInterface = null;
        /**
         * Mapping of CAN hex message IDs to the message configs.
         * The IDs must be hex strings (3 or 8 chars) to differentiate between
         * stanard frame and extended frame messages.
         */
        this.canId2Message = {};
        this.on('ready', this.onReady);
        this.on('objectChange', this.onObjectChange);
        this.on('stateChange', this.onStateChange);
        //this.on('message', this.onMessage);
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
     * Is called if a subscribed object changes
     * TODO: needed?
     */
    onObjectChange(id, obj) {
        if (obj) {
            // The object was changed
            this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
        }
        else {
            // The object was deleted
            this.log.info(`object ${id} deleted`);
        }
    }
    /**
     * Is called if a subscribed state changes.
     *
     * This will trigger the sending of messages and conversion from parser states
     * into message json states if configured.
     */
    async onStateChange(id, state) {
        if (state) {
            // The state was changed
            this.log.debug(`state ${id} changed: ${JSON.stringify(state)}`);
            // don't do anything if the state is acked
            if (state.ack)
                return;
            const [, , msgId, stateId] = id.split('.');
            // we only want states of a message objects
            if (!msgId || !stateId || !msgId.match(consts_1.MESSAGE_ID_REGEXP))
                return;
            const msgCfg = this.canId2Message[msgId];
            // we need a message and the message must be configured for sending
            if (!msgCfg || !msgCfg.send)
                return;
            switch (stateId) {
                case 'send':
                    if (state.val !== true)
                        return;
                    // send the current json data
                    if (await this.sendMessageJsonData(msgCfg)) {
                        // set ack flag on the send state if the message was sent
                        await this.setStateAsync(`${msgCfg.id}.send`, Object.assign(Object.assign({}, state), { ack: true }));
                    }
                    break;
                case 'json':
                    if (!msgCfg.autosend)
                        return;
                    // send current json data
                    this.sendMessageJsonData(msgCfg, state);
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
                        if (parser.instance) {
                            // load the current json from state
                            const jsonState = await this.getStateAsync(`${msgCfg.id}.json`);
                            let data = this.getBufferFromJsonState(jsonState, msgCfg.id);
                            if (data === null) {
                                return;
                            }
                            // write to data using the parser
                            data = await parser.instance.write(data, state.val);
                            // check the write result
                            if (data instanceof Error) {
                                this.log.warn(`Parser writing data for message ID ${msgCfg.id} parser ID ${parser.id} failed: ${data}`);
                                continue;
                            }
                            if (!(data instanceof Buffer)) {
                                this.log.warn(`Parser writing data for message ID ${msgCfg.id} parser ID ${parser.id} failed: Did not return a buffer`);
                                continue;
                            }
                            // set the new json state with ack=false
                            await this.setStateAsync(`${msgCfg.id}.json`, JSON.stringify([...data]), false);
                            // set ack flag on the parser state
                            await this.setStateAsync(`${msgCfg.id}.${parser.id}`, Object.assign(Object.assign({}, state), { ack: true }));
                        }
                        break;
                    }
            }
        }
        else {
            // The state was deleted
            this.log.debug(`state ${id} deleted`);
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
            this.log.warn(`Array length of JSON data in ${this.namespace}.${msgId}.json is greater than 8. Only up to 8 data bytes are supportet!`);
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
        if (!this.canInterface || !this.canInterface.isReady()) {
            this.log.warn(`Could not send data of ${msgCfg.id}.json because CAN interface is not ready.`);
            return false;
        }
        // read the state if not given by argument
        if (!state) {
            state = await this.getStateAsync(`${msgCfg.id}.json`);
            if (!state) {
                this.log.warn(`No state found to send for ${this.namespace}.${msgCfg.id}.json`);
                return false;
            }
        }
        // parse and check the json data
        const data = this.getBufferFromJsonState(state, msgCfg.id);
        if (data === null) {
            return false;
        }
        // get rtr flag from state
        const rtrState = await this.getStateAsync(`${msgCfg.id}.rtr`);
        const rtr = rtrState && !!rtrState.val || false;
        // send the message
        if (this.canInterface.send(msgCfg.idNum, msgCfg.ext, data, rtr)) {
            // set ack flag on json if the message was send and not already acked
            if (!state.ack) {
                await this.setStateAsync(`${msgCfg.id}.json`, Object.assign(Object.assign({}, state), { ack: true }));
            }
            // set ack on rtr if not already acked
            if (rtrState && !rtrState.ack) {
                await this.setStateAsync(`${msgCfg.id}.rtr`, Object.assign(Object.assign({}, rtrState), { ack: true }));
            }
            return true;
        }
        else {
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
            const msgCfg = Object.assign(Object.assign({}, msg), { idNum: parseInt(msg.id, 16), ext: msg.id.length > 3, uuid: msgUuid });
            this.setupMessage(msgUuid, msgCfg);
        }
        // delete unconfigured message objects
        if (this.config.deleteUnconfiguredMessages) {
            const objList = await this.getObjectListAsync({
                startkey: this.namespace,
                endkey: this.namespace + '\u9999'
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
                if (!idParts[2].match(consts_1.MESSAGE_ID_REGEXP))
                    continue;
                // is a message with this native.uuid configured whith this id?
                if (this.config.messages && this.config.messages[obj.value.native.uuid] && this.config.messages[obj.value.native.uuid].id === idParts[2])
                    continue;
                // not configured... delete it recusively
                this.log.debug(`delete unconfigured message ${obj.id}`);
                await this.delForeignObjectAsync(obj.id, { recursive: true });
            }
        }
    }
    /**
     * Translate a configured data type to the corresponding ioBroker common type.
     * @param dataType Data type from the config.
     * @return The ioBroker common type.
     */
    getCommonTypeFromDataType(dataType) {
        switch (dataType) {
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
        // TODO: maybe need to check the nummeric ID against a Set of known IDs for
        //       a better performance on systems with verry high message load?
        const msgIdHex = helpers_1.getHexId(msg.id, !!msg.ext);
        if (this.canId2Message[msgIdHex]) {
            // it's a known can message
            const msgCfg = this.canId2Message[msgIdHex];
            // do nothing if the message isn't configured for receiving
            if (!msgCfg.receive)
                return;
            // set raw states
            this.setStateAsync(`${msgCfg.id}.json`, JSON.stringify([...msg.data]), true);
            this.setStateAsync(`${msgCfg.id}.rtr`, !!msg.rtr, true);
            // run the configured parsers
            for (const parserUuid in msgCfg.parsers) {
                // check if the parser is initialized
                const parser = msgCfg.parsers[parserUuid];
                if (parser.instance) {
                    const readResult = await parser.instance.read(msg.data);
                    // check if the parser has read a value (null indecates an error)
                    if (readResult instanceof Error) {
                        this.log.warn(`Parser reading from received data for ${msgCfg.id} failed: ${readResult}`);
                        continue;
                    }
                    this.setStateAsync(`${msgCfg.id}.${parser.id}`, readResult, true);
                }
            }
        }
        else if (this.config.autoAddSeenMessages) {
            // it's not known but we should add it
            this.log.debug(`auto adding new message`);
            const msgCfg = {
                id: msgIdHex,
                idNum: msg.id,
                ext: msgIdHex.length > 3,
                uuid: null,
                name: `CAN-Message 0x${msgIdHex}`,
                autosend: false,
                send: false,
                receive: true,
                parsers: {}
            };
            await this.setupMessage(null, msgCfg);
            this.setStateAsync(`${msgCfg.id}.json`, JSON.stringify([...msg.data]), true);
            this.setStateAsync(`${msgCfg.id}.rtr`, !!msg.rtr, true);
        }
        else {
            // known message... just ignore
            this.log.debug(`ignoring message ${msg.id}`);
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
        this.log.debug(`create/update message id: ${msgCfg.id}, uuid: ${msgUuid}`);
        // create/update channel object for the message
        await this.extendObjectAsync(msgCfg.id, {
            type: 'channel',
            common: {
                name: msgCfg.name || `CAN-Message 0x${msgCfg.id}`
            },
            native: {
                uuid: msgUuid
            }
        });
        // create/update "raw" data state
        await this.extendObjectAsync(`${msgCfg.id}.json`, {
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
        // create/update "rtr" state
        await this.extendObjectAsync(`${msgCfg.id}.rtr`, {
            type: 'state',
            common: {
                name: `Remote Transmission Request`,
                role: 'indecator',
                type: 'boolean',
                read: true,
                write: msgCfg.send // allow write only if the message is configured for sending
            },
            native: {}
        });
        // create/update or delete "send" state depending on "send" option
        if (msgCfg.send) {
            await this.extendObjectAsync(`${msgCfg.id}.send`, {
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
            const obj = await this.getObjectAsync(`${msgCfg.id}.send`);
            if (obj) {
                await this.delObjectAsync(`${msgCfg.id}.send`);
            }
        }
        // setup parser objects
        for (const parserUuid in msgCfg.parsers) {
            const parser = msgCfg.parsers[parserUuid];
            if (consts_1.PARSER_ID_RESERVED.includes(parser.id)) {
                this.log.warn(`Parser ID ${parser.id} of message ID ${msgCfg.id} is reserved and not allowed. This parser will be ignored.`);
                continue;
            }
            if (!parser.id.match(consts_1.PARSER_ID_REGEXP)) {
                this.log.warn(`Parser ID ${parser.id} of message ID ${msgCfg.id} is invalid. This parser will be ignored.`);
                continue;
            }
            this.log.debug(`create/update parser ${msgCfg.id}.${parser.id}`);
            await this.extendObjectAsync(`${msgCfg.id}.${parser.id}`, {
                type: 'state',
                common: {
                    name: parser.name || `Parser ${parser.id}`,
                    //role: 'state', // don't set the role here to let the user change it in admin
                    type: this.getCommonTypeFromDataType(parser.dataType),
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
            startkey: `${this.namespace}.${msgCfg.id}`,
            endkey: `${this.namespace}.${msgCfg.id}\u9999`
        });
        for (const obj of objList.rows) {
            // check if obj is a state (all parser objects are created as state)
            if (obj.value.type !== 'state')
                continue;
            // obj id must have vour parts
            const idParts = obj.id.split('.');
            if (idParts.length !== 4)
                continue;
            // obj id part 3 (parserId) must not be in the reserved ids
            if (consts_1.PARSER_ID_RESERVED.includes(idParts[3]))
                continue;
            // is a parser with this native.uuid configured whith this id?
            if (msgCfg.parsers[obj.value.native.uuid] && msgCfg.parsers[obj.value.native.uuid].id === idParts[3])
                continue;
            // not configured... delete it with all it's child objects
            this.log.debug(`delete unconfigured parser ${obj.id}`);
            await this.delForeignObjectAsync(obj.id);
        }
        // save to our canId->msg mapping
        this.canId2Message[msgCfg.id] = msgCfg;
        // setup the parser instances
        for (const parserUuid in msgCfg.parsers) {
            for (const Parser of parsers_1.knownParsers) {
                if (Parser.canHandle(msgCfg.parsers[parserUuid].dataType)) {
                    msgCfg.parsers[parserUuid].instance = new Parser(this, msgCfg.parsers[parserUuid]);
                    break;
                }
            }
            if (!msgCfg.parsers[parserUuid].instance) {
                this.log.warn(`No matching parser found for message ID ${msgCfg.id} parser ID ${msgCfg.parsers[parserUuid].id} data type ${msgCfg.parsers[parserUuid].dataType}`);
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
], CanBusAdapter.prototype, "onObjectChange", null);
__decorate([
    core_decorators_1.autobind
], CanBusAdapter.prototype, "onStateChange", null);
__decorate([
    core_decorators_1.autobind
], CanBusAdapter.prototype, "handleCanMsg", null);
exports.CanBusAdapter = CanBusAdapter;
if (module.parent) {
    // Export the constructor in compact mode
    module.exports = (options) => new CanBusAdapter(options);
}
else {
    // otherwise start the instance directly
    (() => new CanBusAdapter())();
}
