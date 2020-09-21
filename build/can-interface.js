"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanInterface = void 0;
const socketcan = require("socketcan");
const core_decorators_1 = require("core-decorators");
const events_1 = require("events");
class CanInterface extends events_1.EventEmitter {
    constructor(adapter) {
        super();
        this.channel = null;
        this.adapter = adapter;
    }
    start() {
        try {
            this.channel = socketcan.createRawChannel(this.adapter.config.interface, false); // TODO: do we need timestamps?
            this.channel.addListener('onMessage', this.handleCanMsg);
            this.channel.addListener('onStopped', this.handleStopped);
            this.channel.start();
            return true;
        }
        catch (err) {
            this.adapter.log.error(`Error starting can interface: ` + err);
            return false;
        }
    }
    stop() {
        if (this.channel) {
            this.channel.stop();
        }
    }
    handleCanMsg(msg) {
        this.adapter.log.debug(`received can message: ${JSON.stringify(msg)}`);
        this.emit('message', msg);
    }
    handleStopped() {
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
