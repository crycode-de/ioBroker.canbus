/*
 * CAN interface for socketcan (Linux native CAN support)
 */
import { boundMethod } from 'autobind-decorator';
import * as socketcan from 'socketcan';
import type { CanBusAdapter } from './main';
import { CanInterface } from './can-interface';

/**
 * Interface to the CAN bus using socketcan.
 */
export class CanInterfaceSocketcan extends CanInterface {
  private channel: socketcan.RawChannel | null = null;

  constructor (adapter: CanBusAdapter) {
    super(adapter);

  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async start (): Promise<boolean> {
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
    this.emit('started');
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async stop (): Promise<void> {
    if (this.channel) {
      this.channel.stop();
      this.started = false;
    }
  }

  public isReady (): boolean {
    return this.started && this.channel !== null;
  }

  public send (id: number, ext: boolean, data: Buffer, rtr: boolean = false): boolean {
    if (!this.channel) {
      this.adapter.log.warn(`Could not send data because channel is not initialized.`);
      return false;
    }

    // ID validation
    if (ext) {
      if (id < 0 || id > 0x1FFFFFFF) {
        this.adapter.log.error(`Extended CAN ID out of range: 0x${id.toString(16)}`);
        return false;
      }
    } else {
      if (id < 0 || id > 0x7FF) {
        this.adapter.log.error(`Standard CAN ID out of range: 0x${id.toString(16)}`);
        return false;
      }
    }

    // Data length / DLC
    let dlc = data.length;
    if (dlc > 8) {
      this.adapter.log.warn(`Truncating data from ${dlc} to 8 bytes`);
      dlc = 8;
    }
    if (dlc < 0) dlc = 0; // defensive

    const msg: socketcan.CanMessage = {
      id,
      ext,
      rtr,
      data: data.subarray(0, dlc),
    };
    this.adapter.log.debug(`sending can message: ${JSON.stringify(msg)}`);

    this.channel.send(msg);

    return true;
  }

  @boundMethod
  private handleCanMsg (msg: socketcan.CanMessage): void {
    this.adapter.log.debug(`Received can message: ${JSON.stringify(msg)}`);

    this.emit('message', msg);
  }

  @boundMethod
  private handleStopped (): void {
    this.started = false;
    this.emit('stopped');
  }
}
