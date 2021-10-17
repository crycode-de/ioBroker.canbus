import { autobind } from 'core-decorators';

import React from 'react';

import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import Cached from '@material-ui/icons/Cached';
import VerticalAlignBottom from '@material-ui/icons/VerticalAlignBottom';
import VerticalAlignTop from '@material-ui/icons/VerticalAlignTop';
import Visibility from '@material-ui/icons/Visibility';

import I18n from '@iobroker/adapter-react/i18n';

import snarkdown from 'snarkdown';

import {
  sortMessagesById,
  strToBool,
} from '../lib/helpers';

import { AppContext } from '../common';

import { InputCheckbox } from './input-checkbox';
import { InputSelect } from './input-select';

/* eslint-disable @typescript-eslint/no-var-requires */
const schemaMessages = require('../../../well-known-messages/schemas/messages.json');
const schemaIndex = require('../../../well-known-messages/schemas/index.json');
/* eslint-enable @typescript-eslint/no-var-requires */

import { validate } from 'jsonschema';

const CSV_HEADER_FIELDS = [
  'msgUuid',
  'msgId',
  'msgName',
  'msgDlc',
  'msgReceive',
  'msgSend',
  'msgAutosend',
  'parserUuid',
  'parserId',
  'parserName',
  'parserDataType',
  'parserDataLength',
  'parserDataOffset',
  'parserDataUnit',
  'parserDataEncoding',
  'parserBooleanMask',
  'parserBooleanInvert',
  'parserCustomDataType',
  'parserCustomScriptRead',
  'parserCustomScriptWrite',
  'parserCommonRole',
  'parserCommonStates',
  'parserAutoSetInterval',
  'parserAutoSetValue',
  'parserAutoSetTriggerSend',
] as const;

/**
 * Base url used for linking to well known messages.
 */
const WELL_KNOWN_MESSAGES_BASE_URL = 'https://github.com/crycode-de/ioBroker.canbus/blob/master/well-known-messages/';

/**
 * Base url used when fetching well known messages.
 */
const WELL_KNOWN_MESSAGES_RAW_BASE_URL = 'https://raw.githubusercontent.com/crycode-de/ioBroker.canbus/master/well-known-messages/';

interface ImportExportProps {
  /**
   * Show an error message.
   */
  onError: (text: string | JSX.Element) => void;

  /**
   * Set the native config.
   */
  setNative: (native: ioBroker.AdapterConfig) => void;

  /**
   * Show a toast message.
   */
  showToast: (text: string) => void;

  /**
   * The app context.
   */
  context: AppContext;

  /**
   * The native adapter config.
   */
  native: ioBroker.AdapterConfig;
}

interface ImportExportState {
  /**
   * If an import should overwrite or ignore messages with the same uuid.
   */
  importOverwrite: boolean;

  /**
   * Format for an export.
   */
  exportFormat: string;

  /**
   * Export only selected messages.
   */
  exportSelected: boolean;

  /**
   * UUIDs of messages selected for export.
   */
  exportSelectedEntries: string[];

  /**
   * The fetched index of the well known messages.
   */
  wellKnownMessagesIndex: ioBroker.WellKnownMessagesIndex;

  /**
   * If the index of the well known messages is loaded.
   */
  wellKnownMessagesIndexLoaded: boolean;

  /**
   * Selected versions of the well known message configs.
   */
  //[wellKnownMessagesSelectedVersionKey: string]: string;
  wellKnownMessagesSelectedVersions: Record<string, string>;
}

export class ImportExport extends React.Component<ImportExportProps, ImportExportState> {
  constructor (props: ImportExportProps) {
    super(props);

    this.state = {
      importOverwrite: false,
      exportFormat: 'json',
      exportSelected: false,
      exportSelectedEntries: [],
      wellKnownMessagesIndex: {},
      wellKnownMessagesIndexLoaded: false,
      wellKnownMessagesSelectedVersions: {},
    };
  }

  public render (): React.ReactNode {
    const messages = this.props.native.messages || {};
    const messagesKeys = Object.keys(messages).sort((a, b) => sortMessagesById(messages, a, b));

    return (
      <>
        <h2>{I18n.t('Import')}</h2>

        <Grid container spacing={3}>
          <Grid item>
            <Typography>
              {I18n.t('Using this import feature you are able to import message configurations to extend your existing configuration.')}
            </Typography>
            <Typography>
              {I18n.t('You may use a predefined configuration from GitHub or upload a custom file.')}
            </Typography>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <InputCheckbox
            sm={12} md={12} lg={8}
            label={I18n.t('Overwrite existing messages on import')}
            value={this.state.importOverwrite}
            onChange={(v) => this.setState({ importOverwrite: v })}
          >
            {I18n.t('If not checked, an import will just add new messages and parsers and those that have already been defined are ignored. An existing message or parser is determined by it\'s internal UUID and not the ID. If you want to reimport an exported file to update you configuration you have to set this option.')}
          </InputCheckbox>
        </Grid>

        <Grid container spacing={3}>
          <Grid item sm={12} md={6} lg={4}>
            <Button color='primary' variant='contained' fullWidth startIcon={<VerticalAlignTop />} onClick={this.importFromFile}>
              {I18n.t('Import from file')}
            </Button>
          </Grid>
        </Grid>

        {!this.state.wellKnownMessagesIndexLoaded && <Grid container spacing={3}>
          <Grid item sm={12} md={6} lg={4}>
            <Button color='primary' variant='contained' fullWidth startIcon={<Cached />} onClick={this.fetchPredefinedConfigs}>
              {I18n.t('Fetch configurations from GitHub')}
            </Button>
          </Grid>
        </Grid>}

        {this.state.wellKnownMessagesIndexLoaded && <>
          <br />
          <Typography>
            <strong><em>{I18n.t('Hint: All configurations are provided without any warranty! Depending on the connected system, sending incorrect messages may damage the system.')}</em></strong>
          </Typography>

          {Object.keys(this.state.wellKnownMessagesIndex).map((id) => (<React.Fragment key={id}>
            <h3>{this.state.wellKnownMessagesIndex[id].name}</h3>
            <Grid container spacing={3}>
              <Grid item sm={12} dangerouslySetInnerHTML={{ __html: this.renderMarkdown(this.state.wellKnownMessagesIndex[id].description) }} />
            </Grid>
            <Grid container spacing={3}>
              <Grid item sm={12} md={8}>
                <span>{I18n.t('Author')}: </span><span dangerouslySetInnerHTML={{ __html: this.state.wellKnownMessagesIndex[id].authors.map((a) => this.renderMarkdown(a)).join(', ') }} />
              </Grid>
              {this.state.wellKnownMessagesIndex[id].license && <Grid item sm={12} md={4}>
                <span>{I18n.t('License')}: </span><span><a href={`https://spdx.org/licenses/${this.state.wellKnownMessagesIndex[id].license}.html`} target='_blank' rel='external nofollow'>{this.state.wellKnownMessagesIndex[id].license}</a></span>
              </Grid>}
            </Grid>
            <Grid container spacing={3}>
              <InputSelect
                sm={6} md={2} lg={2}
                label={I18n.t('Version')}
                value={this.state.wellKnownMessagesSelectedVersions[id]}
                onChange={(v) => this.setState({ wellKnownMessagesSelectedVersions: { ...this.state.wellKnownMessagesSelectedVersions, [id]: v } })}
                options={this.state.wellKnownMessagesIndex[id].releases.map((r) => r.version)}
              />
              <Grid item sm={6} md={6} lg={4}>
                <Button
                  color='primary'
                  variant='contained'
                  fullWidth
                  startIcon={<Visibility />}
                  onClick={() => this.showPredefinedConfig(id)}
                  disabled={!this.state.wellKnownMessagesSelectedVersions[id]}
                >
                  {I18n.t('Show on GitHub')}
                </Button>
              </Grid>
              <Grid item sm={6} md={6} lg={4}>
                <Button
                  color='primary'
                  variant='contained'
                  fullWidth
                  startIcon={<VerticalAlignTop />}
                  onClick={() => this.importPredefinedConfig(id)}
                  disabled={!this.state.wellKnownMessagesSelectedVersions[id]}
                >
                  {I18n.t('Import from GitHub')}
                </Button>
              </Grid>
            </Grid>
          </React.Fragment>))}
        </>}

        <br /><Divider />
        <h2>{I18n.t('Export')}</h2>

        <Grid container spacing={3}>
          <Grid item>
            <Typography>
              {I18n.t('Using this export feature you are able to export your message configurations.')}
            </Typography>
            <Typography>
              {I18n.t('The exported files can be shared or edited externally and reimported to update your configuration.')}
            </Typography>
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <InputSelect
            sm={6} md={4} lg={2}
            label={I18n.t('Export format')}
            value={this.state.exportFormat}
            options={['json', 'csv']}
            onChange={(v) => this.setState({ exportFormat: v })}
          />
          <InputCheckbox
            sm={12} md={6}
            label={I18n.t('Select messages to export')}
            value={this.state.exportSelected}
            onChange={(v) => this.setState({ exportSelected: v })}
          >
            {I18n.t('If checked, you can select the configured messages you want to export. If not checked, all messages will be exported.')}
          </InputCheckbox>
        </Grid>
        {this.state.exportSelected && <Grid container spacing={0}>
          {messagesKeys.map((msgUuid) => (
            <InputCheckbox
              key={msgUuid}
              sm={12} md={6} lg={4}
              label={`${messages[msgUuid].id} ${messages[msgUuid].name}`}
              value={this.state.exportSelectedEntries.includes(msgUuid)}
              onChange={(v) => this.handleExportSelectMsg(msgUuid, v)}
            />
          ))}
        </Grid>}
        <Grid container spacing={3}>
          <Grid item sm={12} md={6} lg={4}>
            <Button color='primary' variant='contained' fullWidth startIcon={<VerticalAlignBottom />} onClick={this.export}>
              {I18n.t('Export to file')}
            </Button>
          </Grid>
        </Grid>
      </>
    );
  }

  /**
   * Handle the select/unselect of a message for export.
   * @param msgUuid The UUID of the message.
   * @param selected `true` if the message was selected.
   */
  @autobind
  private handleExportSelectMsg (msgUuid: string, selected: boolean): void {
    if (selected) {
      this.setState((prevState) => ({
        exportSelectedEntries: [...prevState.exportSelectedEntries, msgUuid],
      }));
    } else {
      this.setState((prevState) => ({
        exportSelectedEntries: [...prevState.exportSelectedEntries.filter((uuid) => uuid !== msgUuid)],
      }));
    }
  }

  /**
   * Fetch the well known predefined configs from GitHub using the adapter.
   */
  @autobind
  private async fetchPredefinedConfigs (): Promise<void> {
    // Get the index from remote server (GitHub)
    try {
      const wellKnownMessagesIndex: ioBroker.WellKnownMessagesIndex = await this.fetchJson(`index.json`);

      // validate the index
      const validationResult = validate(wellKnownMessagesIndex, schemaIndex);
      if (!validationResult.valid) {
        this.props.onError(I18n.t('The downloaded index is not valid'));
        return;
      }

      const wellKnownMessagesSelectedVersions: Record<string, string> = {};
      const l = I18n.getLanguage();
      for (const id in wellKnownMessagesIndex) {
        // use localized names and descriptions
        wellKnownMessagesIndex[id].name = wellKnownMessagesIndex[id].nameLang?.[l] || wellKnownMessagesIndex[id].nameLang?.en || wellKnownMessagesIndex[id].name;
        wellKnownMessagesIndex[id].description = wellKnownMessagesIndex[id].descriptionLang?.[l] || wellKnownMessagesIndex[id].descriptionLang?.en || wellKnownMessagesIndex[id].description;

        // preset version states
        if (wellKnownMessagesIndex[id].releases.length > 0) {
          wellKnownMessagesSelectedVersions[id] = wellKnownMessagesIndex[id].releases[0].version;
        }
      }

      this.setState({
        wellKnownMessagesIndex,
        wellKnownMessagesIndexLoaded: true,
        wellKnownMessagesSelectedVersions,
      });

    } catch (err: any) {
      console.error(err);
      this.props.onError(err.toString());
    }
  }

  /**
   * Fetch a json file from GitHub.
   * @param file Path of the file to fetch relative to `WELL_KNOWN_MESSAGES_RAW_BASE_URL`.
   * @returns The object loaded from the fetched json file.
   */
  private async fetchJson<T = any> (file: string): Promise<T> {
    const res = await fetch(WELL_KNOWN_MESSAGES_RAW_BASE_URL + file, {
      cache: 'no-cache',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });

    if (res.status !== 200) {
      throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }

  /**
   * Export the messages of the current configuration.
   */
  @autobind
  private export (): void {
    let content: string = '';
    let type: string = '';
    let filename: string = '';

    const defaultMessage: ioBroker.AdapterConfigMessage = {
      id: '',
      name: '',
      dlc: -1,
      receive: false,
      send: false,
      autosend: false,
      parsers: {},
    };
    const defaultParser: ioBroker.AdapterConfigMessageParser = {
      id: '',
      name: '',
      dataType: 'int8',
      dataLength: 1,
      dataOffset: 0,
      dataUnit: '',
      dataEncoding: 'latin1',
      booleanMask: 0,
      booleanInvert: false,
      customScriptRead: '',
      customScriptWrite: '',
      customDataType: 'number',
      commonRole: 'state',
      commonStates: false,
    };

    // create an object with the messages to export with defaults set if some config parts are missing
    const messages = this.props.native.messages || {};
    const exportMessages: ioBroker.AdapterConfigMessages = {};
    for (const msgUuid in messages) {
      // export only selected?
      if (this.state.exportSelected && !this.state.exportSelectedEntries.includes(msgUuid)) {
        continue;
      }

      exportMessages[msgUuid] = {
        ...defaultMessage,
        ...messages[msgUuid],
        parsers: {},
      };
      for (const parserUuid in messages[msgUuid].parsers) {
        exportMessages[msgUuid].parsers[parserUuid] = {
          ...defaultParser,
          ...messages[msgUuid].parsers[parserUuid],
        };
      }
    }

    if (this.state.exportFormat === 'csv') {
      // csv export
      type = 'text/csv';
      filename = 'canbus-messages.csv';
      const lines: string[] = [];
      lines.push(CSV_HEADER_FIELDS.join(';'));

      for (const msgUuid in exportMessages) {
        const msg = exportMessages[msgUuid];
        const parserUuids = Object.keys(msg.parsers);
        if (parserUuids.length === 0) {
          // no parsers
          lines.push([
            msgUuid,
            this.escapeCsvValue(msg.id),
            this.escapeCsvValue(msg.name),
            msg.dlc,
            msg.receive ? 1 : 0,
            msg.send ? 1 : 0,
            msg.autosend ? 1 : 0,
            null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, // no parser
          ].join(';'));
        } else {
          // with parsers
          parserUuids.forEach((parserUuid) => {
            const parser = msg.parsers[parserUuid];
            lines.push([
              msgUuid,
              this.escapeCsvValue(msg.id),
              this.escapeCsvValue(msg.name),
              msg.dlc,
              msg.receive ? 1 : 0,
              msg.send ? 1 : 0,
              msg.autosend ? 1 : 0,
              parserUuid,
              this.escapeCsvValue(parser.id),
              this.escapeCsvValue(parser.name),
              parser.dataType,
              parser.dataLength,
              parser.dataOffset,
              this.escapeCsvValue(parser.dataUnit),
              parser.dataEncoding,
              parser.booleanMask,
              parser.booleanInvert ? 1 : 0,
              parser.customDataType,
              this.escapeCsvValue(parser.customScriptRead),
              this.escapeCsvValue(parser.customScriptWrite),
              this.escapeCsvValue(parser.commonRole),
              parser.commonStates ? this.escapeCsvValue(parser.commonStates) : '',
              parser.autoSetInterval ? parser.autoSetInterval : 0,
              parser.dataType === 'boolean' ? (parser.autoSetValue ? 1 : 0) : (parser.dataType === 'string') ? this.escapeCsvValue(parser.autoSetValue) : parser.autoSetValue,
              parser.autoSetTriggerSend ? 1 : 0,
            ].join(';'));
          });
        }
      }

      content = lines.join('\r\n');

    } else {
      // json export
      type = 'application/json';
      filename = 'canbus-messages.json';

      content = JSON.stringify(exportMessages, null, 2);
    }

    const el = window.document.createElement('a');
    el.setAttribute('href', `data:${type};charset=utf-8,${encodeURIComponent(content)}`);
    el.setAttribute('download', filename);
    el.style.display = 'none';
    window.document.body.appendChild(el);
    el.click();
    window.document.body.removeChild(el);
  }

  /**
   * Import messages from a file.
   */
  @autobind
  private importFromFile (): void {
    const input = window.document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('id', 'files');
    input.setAttribute('opacity', '0');
    input.addEventListener('change', this.handleImportFileSelect, false);
    (input.click)();
  }

  /**
   * Handle the file select when importing messages from a file.
   */
  @autobind
  private handleImportFileSelect (evt: Event): void {

    const f = (evt as unknown as React.ChangeEvent<HTMLInputElement>).target?.files?.[0];
    if (!f) {
      this.props.onError(I18n.t('Failed to open file!'));
      return;
    }

    const m = f.name.match(/\.([^.]+)$/);
    if (!m || (m[1] !== 'json' && m[1] !== 'csv')) {
      this.props.onError(I18n.t('Unsupported file type!'));
      return;
    }

    const type = m[1];

    const r = new window.FileReader();
    r.onload = (e) => {
      const contents = e.target?.result as string;
      if (!contents) {
        this.props.onError(I18n.t('File is empty!'));
        return;
      }

      let msgs: ioBroker.AdapterConfigMessagesLang = {};

      try {
        // parse the contents
        if (type === 'csv') {
          // parse csv
          const arr = this.readArrayFromCsv(contents);

          // convert to messages object
          const headerFields = arr.shift() as typeof CSV_HEADER_FIELDS | undefined;
          if (!headerFields || !headerFields.includes('msgUuid')) {
            throw new Error('Invalid file');
          }

          arr.forEach((msgFields, idx) => {
            const objParts = headerFields.map((k, i) => ({ [k]: msgFields[i] } as Record<typeof CSV_HEADER_FIELDS[number], string>));
            const obj: Record<typeof CSV_HEADER_FIELDS[number], string> = Object.assign({}, ...objParts);

            if (!obj.msgUuid) {
              console.warn(`Ignore invalid entry on line ${idx + 2}!`, msgFields);
              return;
            }

            // need to create a new message?
            if (!msgs[obj.msgUuid]) {
              // new message
              msgs[obj.msgUuid] = {
                id: obj.msgId,
                name: obj.msgName,
                send: strToBool(obj.msgSend),
                receive: strToBool(obj.msgReceive),
                autosend: strToBool(obj.msgAutosend),
                dlc: parseInt(obj.msgDlc, 10),
                parsers: {},
              };
            }

            // add parser if defined
            if (obj.parserUuid) {
              const parserDataType = obj.parserDataType === 'custom' ? obj.parserCustomDataType : obj.parserDataType;

              msgs[obj.msgUuid].parsers[obj.parserUuid] = {
                id: obj.parserId,
                name: obj.parserName,
                dataType: obj.parserDataType as ioBroker.AdapterConfigDataType,
                dataLength: parseInt(obj.parserDataLength, 10),
                dataOffset: parseInt(obj.parserDataOffset, 10),
                dataUnit: obj.parserDataUnit,
                dataEncoding: obj.parserDataEncoding as ioBroker.AdapterConfigDataEncoding,
                booleanMask: parseInt(obj.parserBooleanMask, 10),
                booleanInvert: strToBool(obj.parserBooleanInvert),
                customDataType: obj.parserCustomDataType as ioBroker.CommonType,
                customScriptRead: obj.parserCustomScriptRead,
                customScriptWrite: obj.parserCustomScriptWrite,
                commonRole: obj.parserCommonRole,
                commonStates: obj.parserCommonStates || false,
                autoSetInterval: parseInt(obj.parserAutoSetInterval, 10) || false,
                autoSetValue: (parserDataType === 'number') ? parseInt(obj.parserAutoSetValue, 10) : parserDataType === 'boolean' ? strToBool(obj.parserAutoSetValue) : obj.parserAutoSetValue !== undefined ? obj.parserAutoSetValue : '',
                autoSetTriggerSend: strToBool(obj.parserAutoSetTriggerSend),
              };
            }
          });

        } else {
          // parse json
          msgs = JSON.parse(contents);
        }
      } catch (err: any) {
        this.props.onError(I18n.t('Error parsing file! %s', err.toString()));
        return;
      }

      // import the messages
      this.importMessagesObject(msgs);
    };
    r.readAsText(f);
  }

  /**
   * Open a new browser windows/tab to show the configuration.
   */
  private showPredefinedConfig (id: string): void {
    const version = this.state.wellKnownMessagesSelectedVersions[id];
    const release = this.state.wellKnownMessagesIndex[id]?.releases.find((r) => r.version === version);

    if (!release || !release.file) {
      this.props.onError('Release not found');
      return;
    }

    window.open(`${WELL_KNOWN_MESSAGES_BASE_URL}configs/${release.file}`);
  }

  /**
   * Import messages from a selected predefined config.
   * This will load the configuration in the selected verserion from GitHub.
   */
  @autobind
  private async importPredefinedConfig (id: string): Promise<void> {
    const version = this.state.wellKnownMessagesSelectedVersions[id];
    const release = this.state.wellKnownMessagesIndex[id]?.releases.find((r) => r.version === version);

    if (!release || !release.file) {
      this.props.onError('Release not found');
      return;
    }

    let msgs: ioBroker.AdapterConfigMessagesLang = {};

    try {
      msgs = await this.fetchJson('configs/' + release.file);
    } catch (err: any) {
      console.error(err);
      this.props.onError(err.toString());
    }

    this.importMessagesObject(msgs);
  }

  /**
   * Import messages from a given object.
   * @param msgs Object containing the messages to import.
   */
  private importMessagesObject (msgs: ioBroker.AdapterConfigMessagesLang, ignoreErrors: boolean = false): void {
    // validate messages and parsers using the json schema
    if (!ignoreErrors) {
      const validationResult = validate(msgs, schemaMessages);

      if (!validationResult.valid) {
        this.props.onError(
          <div>
            <div><strong>{I18n.t('Validation error:')}</strong></div>
            <ul>
              {validationResult.errors.map((e) => (<li><code>{e.path.join('.')}</code><br />{e.message}</li>))}
            </ul>
            <Button
              color='default'
              variant='contained'
              fullWidth
              onClick={() => { this.props.onError(''); this.importMessagesObject(msgs, true); }}
            >
              {I18n.t('Ignore this error and try to import')}
            </Button>
          </div>
        );

        return;
      }
    }

    const { native } = this.props;
    if (!native.messages) {
      native.messages = {};
    }

    for (const msgUuid in msgs) {
      // get the name from nameLang if available in the current language and remove nameLang attribute
      msgs[msgUuid].name = msgs[msgUuid].nameLang?.[I18n.getLanguage()] || msgs[msgUuid].nameLang?.en || msgs[msgUuid].name || msgs[msgUuid].id;
      delete msgs[msgUuid].nameLang;

      if (!native.messages[msgUuid]) {
        // new message
        native.messages[msgUuid] = msgs[msgUuid];
      } else {
        // existing message...
        // update fields if overwrite is enabled
        if (this.state.importOverwrite) {
          const { parsers, ...msgFields } = msgs[msgUuid];
          native.messages[msgUuid] = {
            ...native.messages[msgUuid],
            ...msgFields,
          };
        }
        // check parsers
        for (const parserUuid in msgs[msgUuid].parsers) {
          // get the name from nameLang if available in the current language and remove nameLang attribute
          msgs[msgUuid].parsers[parserUuid].name = msgs[msgUuid].parsers[parserUuid].nameLang?.[I18n.getLanguage()] || msgs[msgUuid].parsers[parserUuid].nameLang?.en || msgs[msgUuid].parsers[parserUuid].name || msgs[msgUuid].parsers[parserUuid].id;
          delete msgs[msgUuid].parsers[parserUuid].nameLang;

          if (!native.messages[msgUuid].parsers[parserUuid]) {
            // add parser
            native.messages[msgUuid].parsers[parserUuid] = msgs[msgUuid].parsers[parserUuid];
          } else {
            // updateParser if overwrite is enabled
            if (this.state.importOverwrite) {
              native.messages[msgUuid].parsers[parserUuid] = {
                ...native.messages[msgUuid].parsers[parserUuid],
                ...msgs[msgUuid].parsers[parserUuid],
              };
            }
          }
        }
      }
    }

    this.props.setNative(native);

    // show a toast message to inform the user that the import is done
    this.props.showToast(I18n.t('Import done'));
  }

  /**
   * Escape a string to be used as value in a csv file.
   * This will wrap the string into `""` and escape quotes and semicolons if necessary.
   * According to RFC 4180 fields may contain CRLF.
   * @param value The string to escape.
   * @returns The escaped string.
   */
  private escapeCsvValue (value: any): string {
    if (typeof value !== 'string') {
      try {
        return value.toString();
      } catch (_err) {
        return '';
      }
    }

    if (value.match(/[;"\r\n]/)) {
      value = value.replace(/"/g, '""');
      value = `"${value}"`
    }
    return value;
  }

  /**
   * Convert a csv text to arrays.
   * According to RFC 4180 fields may contain CRLF.
   * @see https://stackoverflow.com/a/41563966/7136720
   * @param text The text to read from.
   * @returns Array of lines containing arrays of line values.
   */
  private readArrayFromCsv (text: string): string[][] {
    let p = '', row = [''], i = 0, r = 0, s = !0, l;
    const ret = [row];
    for (l of text) {
      if ('"' === l) {
        if (s && l === p) row[i] += l;
        s = !s;
      } else if (';' === l && s) l = row[++i] = '';
      else if ('\n' === l && s) {
        if ('\r' === p) row[i] = row[i].slice(0, -1);
        row = ret[++r] = [l = '']; i = 0;
      } else row[i] += l;
      p = l;
    }
    return ret;
  }

  /**
   * Render markdown in the given text.
   * This will remove all html entities before render.
   * @param text The text to render.
   * @returns The rendered text.
   */
  private renderMarkdown (text: string): string {
    // remove html entities
    text = text.replace(/<[^>]+>/, '');

    // render markdown
    text = snarkdown(text);

    // make links open in new tab
    text = text.replace(/<a ([^>]+)>/g, '<a target="_blank" $1>');

    return text;
  }
}
