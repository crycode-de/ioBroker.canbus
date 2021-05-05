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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FuLWludGVyZmFjZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jYW4taW50ZXJmYWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxxREFBdUM7QUFDdkMscURBQTJDO0FBRTNDLG1DQUFzQztBQWlCdEM7O0dBRUc7QUFDSCxNQUFhLFlBQWEsU0FBUSxxQkFBWTtJQUs1QyxZQUFhLE9BQXNCO1FBQ2pDLEtBQUssRUFBRSxDQUFDO1FBSkYsWUFBTyxHQUFnQyxJQUFJLENBQUM7UUFDNUMsWUFBTyxHQUFZLEtBQUssQ0FBQztRQUsvQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztJQUN6QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLEtBQUs7UUFDVixJQUFJO1lBQ0YsSUFBSSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2hGLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDekQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUMxRCxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ3RCO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDL0QsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUVELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSxJQUFJO1FBQ1QsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2hCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDcEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7U0FDdEI7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0ksT0FBTztRQUNaLE9BQU8sSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLElBQUksQ0FBQztJQUMvQyxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNJLElBQUksQ0FBRSxFQUFVLEVBQUUsR0FBWSxFQUFFLElBQVksRUFBRSxHQUFhO1FBQ2hFLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2pCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyx5REFBeUQsQ0FBQyxDQUFDO1lBQ2pGLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFFRCxNQUFNLEdBQUcsR0FBeUI7WUFDaEMsRUFBRSxFQUFFLEVBQUU7WUFDTixHQUFHLEVBQUUsR0FBRztZQUNSLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRztZQUNWLElBQUksRUFBRSxJQUFJO1NBQ1gsQ0FBQztRQUNGLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFdEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFdkIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBR08sWUFBWSxDQUFFLEdBQXlCO1FBQzdDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFdkUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUdPLGFBQWE7UUFDbkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDckIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN2QixDQUFDO0NBQ0Y7QUFYQztJQURDLDBCQUFRO2dEQUtSO0FBR0Q7SUFEQywwQkFBUTtpREFJUjtBQXpGSCxvQ0EwRkMifQ==