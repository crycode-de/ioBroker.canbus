/* eslint-disable @typescript-eslint/no-unused-vars */

//import { native } from '../../io-package.json';
export {};
//type _AdapterConfig = Partial<typeof native>;

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
  namespace ioBroker {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface,@typescript-eslint/no-unused-vars
    interface AdapterConfig extends AdapterConfigMainSettings /*_AdapterConfig*/ {
      messages?: AdapterConfigMessages;
    }

    interface AdapterConfigMainSettings {
      interface: string;
      autoAddSeenMessages: boolean;
      deleteUnconfiguredMessages: boolean;
    }

    interface AdapterConfigMessage {
      /**
       * The ID of the message a hex string.
       */
      id: string;
      name: string;
      receive: boolean;
      send: boolean;
      autosend: boolean;
      parsers: AdapterConfigMessageParsers;
    }

    type AdapterConfigMessages = {
      [uuid: string]: AdapterConfigMessage;
    };

    interface AdapterConfigMessageParser {
      id: string;
      name: string;
      dataType: AdapterConfigDataType;
      dataOffset: number;
      dataLength: number;
      dataEncoding: AdapterConfigDataEncoding;
      dataUnit: string;
      booleanMask: number;
      booleanInvert: boolean;
    }

    type AdapterConfigMessageParsers = {
      [uuid: string]: AdapterConfigMessageParser;
    };

    type AdapterConfigDataType = 'int8' | 'uint8' | 'int16_be' | 'int16_le' | 'uint16_be' | 'uint16_le' | 'int32_be' | 'int32_le' | 'uint32_be' | 'uint32_le' | 'float32_be' | 'float32_le' | 'double64_be' | 'double64_le' | 'boolean' | 'string';
    type AdapterConfigDataEncoding = 'latin1' | 'ascii' | 'utf8' | 'utf16le' | 'base64' | 'hex';
  }
}