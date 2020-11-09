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