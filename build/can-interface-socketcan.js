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
var can_interface_socketcan_exports = {};
__export(can_interface_socketcan_exports, {
  CanInterfaceSocketcan: () => CanInterfaceSocketcan
});
module.exports = __toCommonJS(can_interface_socketcan_exports);
var import_autobind_decorator = require("autobind-decorator");
var socketcan = __toESM(require("socketcan"));
var import_can_interface = require("./can-interface");
class CanInterfaceSocketcan extends import_can_interface.CanInterface {
  constructor(adapter) {
    super(adapter);
    this.channel = null;
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async start() {
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
    this.emit("started");
    return true;
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async stop() {
    if (this.channel) {
      this.channel.stop();
      this.started = false;
    }
  }
  isReady() {
    return this.started && this.channel !== null;
  }
  send(id, ext, data, rtr = false) {
    if (!this.channel) {
      this.adapter.log.warn(`Could not send data because channel is not initialized.`);
      return false;
    }
    if (ext) {
      if (id < 0 || id > 536870911) {
        this.adapter.log.error(`Extended CAN ID out of range: 0x${id.toString(16)}`);
        return false;
      }
    } else {
      if (id < 0 || id > 2047) {
        this.adapter.log.error(`Standard CAN ID out of range: 0x${id.toString(16)}`);
        return false;
      }
    }
    let dlc = data.length;
    if (dlc > 8) {
      this.adapter.log.warn(`Truncating data from ${dlc} to 8 bytes`);
      dlc = 8;
    }
    if (dlc < 0) dlc = 0;
    const msg = {
      id,
      ext,
      rtr,
      data: data.subarray(0, dlc)
    };
    this.adapter.log.debug(`sending can message: ${JSON.stringify(msg)}`);
    this.channel.send(msg);
    return true;
  }
  handleCanMsg(msg) {
    this.adapter.log.debug(`Received can message: ${JSON.stringify(msg)}`);
    this.emit("message", msg);
  }
  handleStopped() {
    this.started = false;
    this.emit("stopped");
  }
}
__decorateClass([
  import_autobind_decorator.boundMethod
], CanInterfaceSocketcan.prototype, "handleCanMsg", 1);
__decorateClass([
  import_autobind_decorator.boundMethod
], CanInterfaceSocketcan.prototype, "handleStopped", 1);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CanInterfaceSocketcan
});
//# sourceMappingURL=can-interface-socketcan.js.map
