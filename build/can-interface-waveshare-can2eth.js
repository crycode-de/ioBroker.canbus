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
var can_interface_waveshare_can2eth_exports = {};
__export(can_interface_waveshare_can2eth_exports, {
  CanInterfaceWaveshareCan2eth: () => CanInterfaceWaveshareCan2eth
});
module.exports = __toCommonJS(can_interface_waveshare_can2eth_exports);
var import_node_net = __toESM(require("node:net"));
var import_autobind_decorator = require("autobind-decorator");
var import_can_interface = require("./can-interface");
const _CanInterfaceWaveshareCan2eth = class _CanInterfaceWaveshareCan2eth extends import_can_interface.CanInterface {
  constructor(adapter) {
    super(adapter);
    /**
     * The TCP socket to the CAN to Ethernet adapter.
     */
    this.socket = null;
    /**
     * Number of performed reconnect attempts (resets to 0 after a successful connection).
     */
    this.reconnectAttempts = 0;
    /**
     * Timer used for a planned reconnect attempt.
     */
    this.reconnectTimer = null;
    /**
     * Flag set when stop() was called intentionally to prevent automatic reconnects.
     */
    this.intentionalDisconnect = false;
    /**
     * Receive buffer for incoming (possibly fragmented or coalesced) TCP data.
     */
    this.receiveBuffer = Buffer.alloc(0);
  }
  async start() {
    this.intentionalDisconnect = false;
    return await this.connect();
  }
  async stop() {
    this.intentionalDisconnect = true;
    if (this.reconnectTimer !== null) {
      this.adapter.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    await this.disconnect();
  }
  isReady() {
    return this.started && this.socket !== null && !this.socket.destroyed;
  }
  send(id, ext, data, rtr = false) {
    if (!this.socket || this.socket.destroyed || !this.started) {
      this.adapter.log.warn("Cannot send CAN frame: socket not connected");
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
    const frame = Buffer.alloc(_CanInterfaceWaveshareCan2eth.FRAME_SIZE, 0);
    frame[0] = (ext ? 128 : 0) | (rtr ? 64 : 0) | dlc;
    const maskedId = ext ? id & 536870911 : id & 2047;
    frame.writeUInt32BE(maskedId, 1);
    if (!rtr && dlc > 0) {
      data.subarray(0, dlc).copy(frame, 5);
    }
    this.adapter.log.silly(`TX raw frame: ${frame.toString("hex")}`);
    this.adapter.log.debug(`Sending CAN frame id=0x${id.toString(16)}${ext ? " (ext)" : ""}${rtr ? " RTR" : ""} dlc=${dlc} data=${!rtr && dlc > 0 ? data.subarray(0, dlc).toString("hex") : ""}`);
    try {
      const ok = this.socket.write(frame);
      if (!ok) {
        this.adapter.log.silly("Socket write returned false (backpressure), data buffered internally");
      }
      return true;
    } catch (err) {
      this.adapter.log.error(`Error sending CAN frame: ${err.message}`);
      return false;
    }
  }
  /**
   * Connect to the CAN to Ethernet adapter.
   * @returns `true` if connected, `false` in case of an error.
   */
  async connect() {
    const { ip, port } = this.adapter.config;
    const connected = await new Promise((resolve) => {
      this.adapter.log.debug(`Connecting to CAN to Ethernet adapter at ${ip}:${port}...`);
      this.socket = new import_node_net.default.Socket();
      this.socket.connect(port, ip);
      const connectErrorHandler = (err) => {
        var _a;
        this.adapter.log.error(`Error connecting to CAN to Ethernet adapter at ${ip}:${port}: ${err.message}`);
        (_a = this.socket) == null ? void 0 : _a.destroy();
        this.socket = null;
        resolve(false);
      };
      this.socket.once("connect", () => {
        var _a;
        this.adapter.log.debug(`Connected to CAN to Ethernet adapter at ${ip}:${port}`);
        (_a = this.socket) == null ? void 0 : _a.removeListener("error", connectErrorHandler);
        resolve(true);
      });
      this.socket.once("error", connectErrorHandler);
    });
    if (!connected) {
      this.scheduleReconnect();
      return false;
    }
    this.reconnectAttempts = 0;
    this.socket.on("data", this.handleSocketData);
    this.socket.on("error", (err) => {
      this.adapter.log.warn(`Socket error: ${err.message}`);
    });
    this.socket.on("close", (hadError) => {
      if (this.intentionalDisconnect) {
        this.adapter.log.debug("Socket closed intentionally");
        return;
      }
      this.adapter.log.warn(`Socket closed${hadError ? " due to a transmission error" : ""}. Will attempt to reconnect.`);
      this.socket = null;
      this.started = false;
      this.emit("stopped");
      this.scheduleReconnect();
    });
    this.started = true;
    this.emit("started");
    this.adapter.log.info("CAN to Ethernet adapter connection established and ready");
    return true;
  }
  /**
   * Disconnect from the CAN to Ethernet adapter.
   */
  async disconnect() {
    if (this.socket) {
      this.adapter.log.debug("Disconnecting from CAN to Ethernet adapter...");
      const socket = this.socket;
      this.socket = null;
      await new Promise((resolve) => {
        const timeout = this.adapter.setTimeout(() => {
          if (!socket.destroyed) {
            this.adapter.log.warn("Timeout while disconnecting from CAN to Ethernet adapter");
            socket.destroy();
          }
        }, 5e3);
        socket.once("close", () => {
          this.adapter.clearTimeout(timeout);
          resolve();
        });
        socket.once("error", (err) => {
          this.adapter.log.error(`Error while disconnecting from CAN to Ethernet adapter: ${err.message}`);
          if (!socket.destroyed) socket.destroy();
        });
        socket.end();
      });
      this.started = false;
      this.emit("stopped");
      this.adapter.log.info("Disconnected from CAN to Ethernet adapter");
    }
  }
  handleSocketData(received) {
    if (received.length === 0) return;
    this.receiveBuffer = Buffer.concat([this.receiveBuffer, received]);
    this.adapter.log.silly(`RX append (${received.length}B): total=${this.receiveBuffer.length} hex=${received.toString("hex")}`);
    while (this.receiveBuffer.length >= _CanInterfaceWaveshareCan2eth.FRAME_SIZE) {
      const frame = this.receiveBuffer.subarray(0, _CanInterfaceWaveshareCan2eth.FRAME_SIZE);
      this.receiveBuffer = this.receiveBuffer.subarray(_CanInterfaceWaveshareCan2eth.FRAME_SIZE);
      const frameInfo = frame[0];
      const ext = (frameInfo & 128) !== 0;
      const rtr = (frameInfo & 64) !== 0;
      const dlc = frameInfo & 15;
      if (dlc > 8) {
        this.adapter.log.warn(`Invalid DLC (${dlc}) in frame info byte 0x${frameInfo.toString(16)} \u2013 discarding frame`);
        continue;
      }
      const rawId = frame.readUInt32BE(1);
      const id = ext ? rawId & 536870911 : rawId & 2047;
      const data = rtr ? Buffer.alloc(0) : frame.subarray(5, 5 + dlc);
      const msg = { id, ext, rtr, data };
      this.adapter.log.debug(`Received CAN frame id=0x${id.toString(16)}${ext ? " (ext)" : ""}${rtr ? " RTR" : ""} dlc=${dlc} data=${!rtr && dlc > 0 ? data.subarray(0, dlc).toString("hex") : ""}`);
      this.emit("message", msg);
    }
  }
  /**
   * Schedule a reconnect attempt with exponential backoff.
   * Backoff: 2s, 4s, 8s, ... up to max 60s.
   */
  scheduleReconnect() {
    if (this.intentionalDisconnect) return;
    if (this.reconnectTimer) return;
    const delay = Math.min(6e4, 2e3 * Math.pow(2, this.reconnectAttempts));
    this.adapter.log.debug(`Scheduling reconnect attempt #${this.reconnectAttempts + 1} in ${delay / 1e3}s`);
    const t = this.adapter.setTimeout(async () => {
      this.reconnectTimer = null;
      if (this.intentionalDisconnect) return;
      this.reconnectAttempts++;
      await this.connect();
    }, delay);
    this.reconnectTimer = t != null ? t : null;
  }
};
/** Fixed frame size defined by the protocol */
_CanInterfaceWaveshareCan2eth.FRAME_SIZE = 13;
__decorateClass([
  import_autobind_decorator.boundMethod
], _CanInterfaceWaveshareCan2eth.prototype, "handleSocketData", 1);
let CanInterfaceWaveshareCan2eth = _CanInterfaceWaveshareCan2eth;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CanInterfaceWaveshareCan2eth
});
//# sourceMappingURL=can-interface-waveshare-can2eth.js.map
