import * as socketcan from 'socketcan';
import { EventEmitter } from 'events';
import type { CanBusAdapter } from './main';

interface CanInterfaceEvents {
  message: [msg: socketcan.CanMessage];
  started: [];
  stopped: [];
}

/**
 * Interface to the CAN bus using socketcan.
 */
export abstract class CanInterface extends EventEmitter<CanInterfaceEvents> {
  protected adapter: CanBusAdapter;
  protected started: boolean = false;

  constructor (adapter: CanBusAdapter) {
    super();

    this.adapter = adapter;
  }

  /**
   * Create and start the channel of the CAN interface.
   * Need to be called before we can send/receive any messages.
   * @return `true` if the channel is started, `false` in case of an error.
   */
  public abstract start (): Promise<boolean>;

  /**
   * Stop the channel of the CAN interface.
   * If stopped no more messages will be received but it may be possible to send
   * messages anyways.
   */
  public abstract stop (): Promise<void>;

  /**
   * Check if the interface is ready to send/receive data.
   * @return `true` if ready.
   */
  public abstract isReady (): boolean;

  /**
   * Send a can message with the given properties.
   * @param id The numeric ID of the CAN message.
   * @param ext `true` if the message should be send in extended frame format.
   * @param data The data of the message. 0 to 8 bytes buffer.
   * @param rtr Remote transmission request flag.
   * @return `true` if the message is sent.
   */
  public abstract send (id: number, ext: boolean, data: Buffer, rtr?: boolean): boolean;
}
