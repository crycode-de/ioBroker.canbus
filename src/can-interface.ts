import * as socketcan from 'socketcan';
import { autobind } from 'core-decorators';
import { EventEmitter } from 'events';
import type { CanBusAdapter } from './main';

interface CanInterfaceEvents {
  message: [msg: socketcan.CanMessage];
  stopped: [];
}

/**
 * Interface to the CAN bus using socketcan.
 */
export class CanInterface extends EventEmitter<CanInterfaceEvents> {
  private adapter: CanBusAdapter;
  private channel: socketcan.RawChannel | null = null;
  private started: boolean = false;

  constructor (adapter: CanBusAdapter) {
    super();

    this.adapter = adapter;
  }

  /**
   * Create and start the channel of the CAN interface.
   * Need to be called before we can send/receive any messages.
   * @return `true` if the channel is started, `false` in case of an error.
   */
  public start (): boolean {
    try {
      this.channel = socketcan.createRawChannel(this.adapter.config.interface, false);
      this.channel.addListener('onMessage', this.handleCanMsg);
      this.channel.addListener('onStopped', this.handleStopped);
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
  public stop (): void {
    if (this.channel) {
      this.channel.stop();
      this.started = false;
    }
  }

  /**
   * Check if the interface is ready to send/receive data.
   * @return `true` if ready.
   */
  public isReady (): boolean {
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
  public send (id: number, ext: boolean, data: Buffer, rtr?: boolean): boolean {
    if (!this.channel) {
      this.adapter.log.warn(`Could not send data because channel is not initialized.`);
      return false;
    }

    const msg: socketcan.CanMessage = {
      id: id,
      ext: ext,
      rtr: !!rtr,
      data: data,
    };
    this.adapter.log.debug(`sending can message: ${JSON.stringify(msg)}`);

    this.channel.send(msg);

    return true;
  }

  @autobind
  private handleCanMsg (msg: socketcan.CanMessage): void {
    this.adapter.log.debug(`received can message: ${JSON.stringify(msg)}`);

    this.emit('message', msg);
  }

  @autobind
  private handleStopped (): void {
    this.started = false;
    this.emit('stopped');
  }
}
