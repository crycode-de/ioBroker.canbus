import { autobind } from 'core-decorators';

import React from 'react';

import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

import Cached from '@material-ui/icons/Cached';
import VerticalAlignBottom from '@material-ui/icons/VerticalAlignBottom';
import VerticalAlignTop from '@material-ui/icons/VerticalAlignTop';

import I18n from '@iobroker/adapter-react/i18n';

import {
  sortMessagesById,
  strToBool,
} from '../lib/helpers';

import { AppContext } from '../common';

import { InputCheckbox } from './input-checkbox';
import { InputSelect } from './input-select';

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
  'parserCustomScriptRead',
  'parserCustomScriptWrite',
] as const;

interface ImportExportProps {
  /**
   * Show an error message.
   */
  onError: (text: string) => void;

  /**
   * Set the native config.
   */
  setNative: (native: ioBroker.AdapterConfig) => void;

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
}

export class ImportExport extends React.Component<ImportExportProps, ImportExportState> {
  constructor (props: ImportExportProps) {
    super(props);
    // native settings are our state
    this.state = {
      importOverwrite: false,
      exportFormat: 'json',
      exportSelected: false,
      exportSelectedEntries: [],
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
            <Typography>
              <em>{I18n.t('Hint: All configurations are provided without any warranty!')}</em>
            </Typography>
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item sm={12} md={8} lg={6}>
            <Button color='primary' variant='contained' fullWidth startIcon={<Cached />} onClick={this.fetchPredefinedConfigs}>
              {I18n.t('Fetch predefined configurations from GitHub')}
            </Button>
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
            <Button color='primary' variant='contained' fullWidth startIcon={<VerticalAlignTop />} onClick={this.importSelectedPredefinedConfig}>
              {I18n.t('Import selected from GitHub')}
            </Button>
          </Grid>
          <Grid item sm={12} md={6} lg={4}>
            <Button color='primary' variant='contained' fullWidth startIcon={<VerticalAlignTop />} onClick={this.importFromFile}>
              {I18n.t('Import from file')}
            </Button>
          </Grid>
        </Grid>

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
  private fetchPredefinedConfigs (): void {
    // TODO: get files from github using the adapter backend
    console.log('fetch');
    this.props.onError('Not yet implemented');
  }

  /**
   * Export the messages of the current configuration.
   */
  @autobind
  private export (): void {
    let content: string = '';
    let type: string = '';
    let filename: string = '';

    if (this.state.exportFormat === 'csv') {
      // csv export
      type = 'text/csv';
      filename = 'canbus-messages.csv';
      const lines: string[] = [];
      lines.push(CSV_HEADER_FIELDS.join(';'));

      const messages = this.props.native.messages || {};
      const msgUuids = Object.keys(messages);
      msgUuids.forEach((msgUuid) => {
        // export only selected?
        if (this.state.exportSelected && !this.state.exportSelectedEntries.includes(msgUuid)) {
          return;
        }
        const msg = messages[msgUuid];
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
            null, null, null, null, null, null, null, null, null, null, null, null, // no parser
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
              this.escapeCsvValue(parser.customScriptRead),
              this.escapeCsvValue(parser.customScriptWrite),
            ].join(';'));
          });
        }
      });

      content = lines.join('\r\n');

    } else {
      // json export
      type = 'application/json';
      filename = 'canbus-messages.json';
      const messages = this.props.native.messages || {};
      if (this.state.exportSelected) {
        // export selected
        const selectedMessages: ioBroker.AdapterConfigMessages = {};
        this.state.exportSelectedEntries.forEach((msgUuid) => {
          selectedMessages[msgUuid] = messages[msgUuid];
        });
        content = JSON.stringify(selectedMessages, null, 2);
      } else {
        // export all
        content = JSON.stringify(messages, null, 2);
      }
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
    console.log('import');

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
    console.log(f);

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

      let msgs: ioBroker.AdapterConfigMessages = {};

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
                customScriptRead: obj.parserCustomScriptRead,
                customScriptWrite: obj.parserCustomScriptWrite,
              };
            }
          });

        } else {
          // parse json
          msgs = JSON.parse(contents);
        }
      } catch (e) {
        this.props.onError(I18n.t('Error parsing file! %s', e.toString()));
        return;
      }

      // import the messages
      this.importMessagesObject(msgs);
    };
    r.readAsText(f);
  }

  /**
   * Import messages from a selected predefined config.
   * This will load the configuration from GitHub using the adapter.
   */
  @autobind
  private importSelectedPredefinedConfig (): void {
    // TODO:
    this.props.onError('Not yet implemented');
  }

  /**
   * Import messages from a given object.
   * @param msgs Object containing the messages to import.
   */
  private importMessagesObject (msgs: ioBroker.AdapterConfigMessages): void {
    // TODO: validate messages and parsers!!!

    const { native } = this.props;
    if (!native.messages) {
      native.messages = {};
    }

    for (const msgUuid in msgs) {
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

    console.log('updated native:', native);
    this.props.setNative(native);
  }

  /**
   * Escape a string to be used as value in a csv file.
   * This will wrap the string into `""` and escape quotes and semicolons if necessary.
   * According to RFC 4180 fields may contain CRLF.
   * @param value The string to escape.
   * @returns The escaped string.
   */
  private escapeCsvValue (value: string): string {
    if (typeof value !== 'string') {
      return value;
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
}
