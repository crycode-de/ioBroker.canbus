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
const can_interface_1 = require("./can-interface");
const helpers_1 = require("./helpers");
const consts_1 = require("./consts");
const core_decorators_1 = require("core-decorators");
class CanBusAdapter extends utils.Adapter {
    constructor(options = {}) {
        super(Object.assign(Object.assign({}, options), { name: 'canbus' }));
        //private readonly namespace: string;
        this.canInterface = null;
        this.canId2Message = {};
        this.on('ready', this.onReady.bind(this));
        this.on('objectChange', this.onObjectChange.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }
    /**
       * Is called when databases are connected and adapter received configuration.
       */
    async onReady() {
        // Initialize your adapter here
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
       * Is called if a subscribed state changes
       */
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        }
        else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
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
            const msgCfg = Object.assign(Object.assign({}, msg), { idNum: parseInt(msg.id, 16), uuid: msgUuid });
            this.createMessageObjects(msgUuid, msgCfg);
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
    getObjectTypeFromDataType(dataType) {
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
            default: // should never be reached
                return 'mixed';
        }
    }
    async handleCanMsg(msg) {
        if (this.canId2Message[msg.id]) {
            // it's a known can message
            const msgCfg = this.canId2Message[msg.id];
            this.setStateAsync(`${msgCfg.id}.json`, JSON.stringify([...msg.data]), true);
            this.setStateAsync(`${msgCfg.id}.rtr`, !!msg.rtr, true);
            // TODO: parsers
        }
        else if (this.config.autoAddSeenMessages) {
            // it's not known but we should add it
            this.log.debug(`auto adding new message`);
            const idHex = helpers_1.getHexId(msg.id, !!msg.ext);
            const msgCfg = {
                id: idHex,
                idNum: msg.id,
                uuid: null,
                name: `CAN-Message 0x${idHex}`,
                autosend: false,
                send: false,
                receive: true,
                parsers: {}
            };
            await this.createMessageObjects(null, msgCfg);
            this.setStateAsync(`${msgCfg.id}.json`, JSON.stringify([...msg.data]), true);
            this.setStateAsync(`${msgCfg.id}.rtr`, !!msg.rtr, true);
        }
        else {
            // known message... just ignore
            this.log.debug(`ignoring message ${msg.id}`);
        }
    }
    async createMessageObjects(msgUuid, msgCfg) {
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
        // create/update or delete "send" state depending on "autosend" option
        if (msgCfg.send && !msgCfg.autosend) {
            await this.extendObjectAsync(`${msgCfg.id}.send`, {
                type: 'state',
                common: {
                    name: `Send current data`,
                    role: 'button',
                    type: 'boolean',
                    read: false,
                    write: msgCfg.send // allow write only if the message is configured for sending
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
        // setup parser opbjects
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
                    type: this.getObjectTypeFromDataType(parser.dataType),
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
        this.canId2Message[msgCfg.idNum] = msgCfg;
    }
}
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
