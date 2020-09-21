import * as socketcan from 'socketcan';
import { autobind } from 'core-decorators';
import { CanBusAdapter } from './main';
import { EventEmitter } from 'events';

interface CanInterfaceEvents {
  'message': (msg: socketcan.CanMessage) => void;
  'stopped': () => void;
}

export declare interface CanInterface {
  on<U extends keyof CanInterfaceEvents>(
    event: U, listener: CanInterfaceEvents[U]
  ): this;

  emit<U extends keyof CanInterfaceEvents>(
    event: U, ...args: Parameters<CanInterfaceEvents[U]>
  ): boolean;
}

export class CanInterface extends EventEmitter {
  private adapter: CanBusAdapter;
  private channel: socketcan.RawChannel | null = null;

  constructor (adapter: CanBusAdapter) {
    super();

    this.adapter = adapter;
  }

  public start (): boolean {
    try {
      this.channel = socketcan.createRawChannel(this.adapter.config.interface, false); // TODO: do we need timestamps?
      this.channel.addListener('onMessage', this.handleCanMsg);
      this.channel.addListener('onStopped', this.handleStopped);
      this.channel.start();

      return true;

    } catch (err) {
      this.adapter.log.error(`Error starting can interface: ` + err);

      return false;
    }
  }

  public stop (): void {
    if (this.channel) {
      this.channel.stop();
    }
  }

  @autobind
  private handleCanMsg (msg: socketcan.CanMessage): void {
    this.adapter.log.debug(`received can message: ${JSON.stringify(msg)}`);

    this.emit('message', msg);
  }

  @autobind
  private handleStopped (): void {
    this.emit('stopped');
  }
}
