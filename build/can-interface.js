"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
            this.channel = socketcan.createRawChannel(this.adapter.config.interface, false);
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
            id: id,
            ext: ext,
            rtr: !!rtr,
            data: data
        };
        this.adapter.log.debug(`sending can message: ${JSON.stringify(msg)}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FuLWludGVyZmFjZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jYW4taW50ZXJmYWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEscURBQXVDO0FBQ3ZDLHFEQUEyQztBQUUzQyxtQ0FBc0M7QUFpQnRDOztHQUVHO0FBQ0gsTUFBYSxZQUFhLFNBQVEscUJBQVk7SUFLNUMsWUFBYSxPQUFzQjtRQUNqQyxLQUFLLEVBQUUsQ0FBQztRQUpGLFlBQU8sR0FBZ0MsSUFBSSxDQUFDO1FBQzVDLFlBQU8sR0FBWSxLQUFLLENBQUM7UUFLL0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7SUFDekIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSxLQUFLO1FBQ1YsSUFBSTtZQUNGLElBQUksQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNoRixJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3pELElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDMUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUN0QjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQy9ELE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFFRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNwQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ksSUFBSTtRQUNULElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1NBQ3RCO0lBQ0gsQ0FBQztJQUVEOzs7T0FHRztJQUNJLE9BQU87UUFDWixPQUFPLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxJQUFJLENBQUM7SUFDL0MsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSSxJQUFJLENBQUUsRUFBVSxFQUFFLEdBQVksRUFBRSxJQUFZLEVBQUUsR0FBYTtRQUNoRSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNqQixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMseURBQXlELENBQUMsQ0FBQztZQUNqRixPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsTUFBTSxHQUFHLEdBQXlCO1lBQ2hDLEVBQUUsRUFBRSxFQUFFO1lBQ04sR0FBRyxFQUFFLEdBQUc7WUFDUixHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUc7WUFDVixJQUFJLEVBQUUsSUFBSTtTQUNYLENBQUM7UUFDRixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsd0JBQXdCLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXRFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXZCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUdPLFlBQVksQ0FBRSxHQUF5QjtRQUM3QyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMseUJBQXlCLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXZFLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFHTyxhQUFhO1FBQ25CLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdkIsQ0FBQztDQUNGO0FBWEM7SUFEQywwQkFBUTtnREFLUjtBQUdEO0lBREMsMEJBQVE7aURBSVI7QUF6Rkgsb0NBMEZDIn0=