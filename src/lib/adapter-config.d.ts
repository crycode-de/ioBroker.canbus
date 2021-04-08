/* eslint-disable @typescript-eslint/no-unused-vars */

export {};

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
  namespace ioBroker {
    interface AdapterConfig extends AdapterConfigMainSettings {
      messages?: AdapterConfigMessages;
    }

    interface AdapterConfigMainSettings {
      interface: string;
      autoAddSeenMessages: boolean;
      deleteUnconfiguredMessages: boolean;
      useRawStates: boolean;
      useRtrFlag: boolean;
    }

    interface AdapterConfigMessage<T extends AdapterConfigMessageParser = AdapterConfigMessageParser> {
      /**
       * The ID of the message a hex string.
       */
      id: string;
      name: string;
      dlc: number;
      receive: boolean;
      send: boolean;
      autosend: boolean;
      parsers: AdapterConfigMessageParsers<T>;
    }

    type AdapterConfigMessages<T extends AdapterConfigMessage = AdapterConfigMessage> = {
      [uuid: string]: T;
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
      customDataType: ioBroker.CommonType;
      customScriptRead: string;
      customScriptWrite: string;

      /**
       * The role of the ioBroker state.
       */
      commonRole: string;

      /**
       * Common states (for common.states) for predefined values or `undefined` if not used.
       */
      commonStates: string | undefined;
    }

    type AdapterConfigMessageParsers<T extends AdapterConfigMessageParser = AdapterConfigMessageParser> = {
      [uuid: string]: T;
    };

    type AdapterConfigDataType = 'int8' | 'uint8' | 'int16_be' | 'int16_le' | 'uint16_be' | 'uint16_le' | 'int32_be' | 'int32_le' | 'uint32_be' | 'uint32_le' | 'float32_be' | 'float32_le' | 'double64_be' | 'double64_le' | 'boolean' | 'string' | 'custom';
    type AdapterConfigDataEncoding = 'latin1' | 'ascii' | 'utf8' | 'utf16le' | 'base64' | 'hex';

    /**
     * AdapterConfigMessageParser with optional `nameLang` attribute to be used in
     * imports from predefined configurations from GitHub.
     */
    interface AdapterConfigMessageParserLang extends ioBroker.AdapterConfigMessageParser {
      nameLang?: Partial<Record<ioBroker.Languages, string>>;
    }

    /**
     * AdapterConfigMessage with optional `nameLang` attribute to be used in
     * imports from predefined configurations from GitHub.
     */
    interface AdapterConfigMessageLang extends ioBroker.AdapterConfigMessage<AdapterConfigMessageParserLang> {
      nameLang?: Partial<Record<ioBroker.Languages, string>>;
    }

    /**
     * AdapterConfigMessages with optional `nameLang` attributes to be used in
     * imports from predefined configurations from GitHub.
     */
    type AdapterConfigMessagesLang = ioBroker.AdapterConfigMessages<ioBroker.AdapterConfigMessageLang>;

    /**
     * A Release in the well known messages index.
     */
    interface WellKnownMessagesIndexEntryRelease {
      /**
       * The version number of this release (semver)
       */
      version: string;

      /**
       * File name of this configuration in `well-known-messages/configs/`
       */
      file: string;
    }

    /**
     * An entry in the well known messages index.
     */
    interface WellKnownMessagesIndexEntry {
      /**
       * Name
       */
      name: string;

      /**
       * Optional localized names
       */
      nameLang?: Partial<Record<ioBroker.Languages, string>>;

      /**
       * Description, optionally formated with markdown
       */
      description: string;

      /**
       * Optional localized descriptions, optionally formated with markdown
       */
      descriptionLang?: Partial<Record<ioBroker.Languages, string>>;

      /**
       * Array of authors, optionally formated with markdown
       */
      authors: string[];

      /**
       * Array of the releases in descending order
       */
      releases: WellKnownMessagesIndexEntryRelease[];
    }

    /**
     * The well known messages index.
     */
    interface WellKnownMessagesIndex {
      [id: string]: WellKnownMessagesIndexEntry;
    }
  }
}
