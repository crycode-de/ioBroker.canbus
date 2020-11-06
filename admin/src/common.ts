import Connection from '@iobroker/adapter-react/Connection';

export interface AppContext {
  socket: Connection;
  instance: number;
  adapterName: string;
}