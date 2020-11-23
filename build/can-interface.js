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
exports.CanInterface = void 0;
const socketcan = __importStar(require("socketcan"));
const core_decorators_1 = require("core-decorators");
const events_1 = require("events");
/**
 * Interface to the CAN bus using socketcan.
 */
class CanInterface extends events_1.EventEmitter {
    constructor(adapter) {
        super();
        this.channel = null;
        this.started = false;
        this.adapter = adapter;
    }
    /**
     * Create and start the channel of the CAN interface.
     * Need to be called before we can send/receive any messages.
     * @return `true` if the channel is started, `false` in case of an error.
     */
    start() {
        try {
            this.channel = socketcan.createRawChannel(this.adapter.config.interface, false); // TODO: do we need timestamps?
            this.channel.addListener('onMessage', this.handleCanMsg);
            this.channel.addListener('onStopped', this.handleStopped);
            this.channel.start();
        }
        catch (err) {
            this.adapter.log.error(`Error starting can interface: ` + err);
            return false;
        }
        this.started = true;
        return true;
    }
    /**
     * Stop the channel of the CAN interface.
     * If stopped no more messages will be received but it may be possible to send
     * messages anyways.
     */
    stop() {
        if (this.channel) {
            this.channel.stop();
            this.started = false;
        }
    }
    /**
     * Check if the interface is ready to send/receive data.
     * @return `true` if ready.
     */
    isReady() {
        return this.started && this.channel !== null;
    }
    /**
     * Send a can message with the given properties.
     * @param id The nummeric ID of the CAN message.
     * @param ext `true` if the message should be send in extended frame format.
     * @param data The data of the message. 0 to 8 bytes buffer.
     * @param rtr Remote transmission request flag.
     * @return `true` if the message is sent.
     */
    send(id, ext, data, rtr) {
        if (!this.channel) {
            this.adapter.log.warn(`Could not send data because channel is not initialized.`);
            return false;
        }
        const msg = {
            id: id,
            ext: ext,
            rtr: !!rtr,
            data: data
        };
        this.adapter.log.debug(`sending can message: ${JSON.stringify(msg)}`);
        // TODO: test if we need try/catch?
        this.channel.send(msg);
        return true;
    }
    handleCanMsg(msg) {
        this.adapter.log.debug(`received can message: ${JSON.stringify(msg)}`);
        this.emit('message', msg);
    }
    handleStopped() {
        this.started = false;
        this.emit('stopped');
    }
}
__decorate([
    core_decorators_1.autobind
], CanInterface.prototype, "handleCanMsg", null);
__decorate([
    core_decorators_1.autobind
], CanInterface.prototype, "handleStopped", null);
exports.CanInterface = CanInterface;
//# sourceMappingURL=can-interface.js.map