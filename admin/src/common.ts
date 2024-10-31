import Connection from '@iobroker/adapter-react/Connection';

/**
 * App context to be passed through the components.
 */
export interface AppContext {
  /**
   * The socket to communicate with the backend.
   */
  socket: Connection;

  /**
   * Adapter instance number.
   */
  instance: number;

  /**
   * Adapter name.
   */
  adapterName: string;
}

export type CommonObj = (ioBroker.StateCommon & Record<string, unknown>) | (ioBroker.ChannelCommon & Record<string, unknown>) | (ioBroker.DeviceCommon & Record<string, unknown>) | (ioBroker.OtherCommon & Record<string, unknown>) | (ioBroker.EnumCommon & Record<string, unknown>);
