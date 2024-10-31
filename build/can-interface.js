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
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
var can_interface_exports = {};
__export(can_interface_exports, {
  CanInterface: () => CanInterface
});
module.exports = __toCommonJS(can_interface_exports);
var socketcan = __toESM(require("socketcan"));
var import_core_decorators = require("core-decorators");
var import_events = require("events");
class CanInterface extends import_events.EventEmitter {
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
      this.channel = socketcan.createRawChannel(this.adapter.config.interface, false);
      this.channel.addListener("onMessage", this.handleCanMsg);
      this.channel.addListener("onStopped", this.handleStopped);
      this.channel.start();
    } catch (err) {
      this.adapter.log.error(`Error starting can interface: ${err}`);
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
   * @param id The numeric ID of the CAN message.
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
      id,
      ext,
      rtr: !!rtr,
      data
    };
    this.adapter.log.debug(`sending can message: ${JSON.stringify(msg)}`);
    this.channel.send(msg);
    return true;
  }
  handleCanMsg(msg) {
    this.adapter.log.debug(`received can message: ${JSON.stringify(msg)}`);
    this.emit("message", msg);
  }
  handleStopped() {
    this.started = false;
    this.emit("stopped");
  }
}
__decorateClass([
  import_core_decorators.autobind
], CanInterface.prototype, "handleCanMsg", 1);
__decorateClass([
  import_core_decorators.autobind
], CanInterface.prototype, "handleStopped", 1);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CanInterface
});
//# sourceMappingURL=can-interface.js.map
