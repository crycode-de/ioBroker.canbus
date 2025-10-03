import React from 'react';
import { boundMethod } from 'autobind-decorator';

import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import ConfirmDialog from '@iobroker/adapter-react/Dialogs/Confirm';

import I18n from '@iobroker/adapter-react/i18n';
import { AppContext } from '../common';

import {
  ContentCopyIcon,
  ContentPasteIcon,
} from '../lib/icons';

import { internalClipboard, uuidv4 } from '../lib/helpers';

import { TabPanel } from './tab-panel';
import { InputCheckbox } from './input-checkbox';
import { InputText } from './input-text';
import { InputSelect } from './input-select';

import { Parser } from './parser';

import { MESSAGE_ID_REGEXP } from '../../../src/consts';

interface MessageProps {
  /**
   * The message was changed.
   */
  onChange?: (msgUuid: string, config: ioBroker.AdapterConfigMessage) => void;

  /**
   * The delete button was clicked.
   * If defined, an remove button will be rendered in the top right corner.
   */
  onDelete?: (uuid: string) => void;

  /**
   * The message was validated.
   */
  onValidate?: (uuid: string, isValid: boolean) => void;

  /**
   * The add button was clicked.
   * If defined, an add button will be rendered in the top right corner.
   */
  onAdd?: (uuid: string) => void;

  /**
   * Show a toast message.
   */
  showToast?: (text: string) => void;

  /**
   * The app context.
   */
  context: AppContext;

  /**
   * UUID of this message.
   */
  uuid: string;

  /**
   * The message config.
   */
  config: ioBroker.AdapterConfigMessage;

  /**
   * Known IDs of other configured messages.
   */
  knownMessageIds: { id: string, dlc: number, uuid: string }[];

  /**
   * Classes to apply for some elements.
   */
  classes: Record<string, string>;

  /**
   * If the message should be readonly.
   */
  readonly?: boolean;
}

interface MessageState extends ioBroker.AdapterConfigMessage {
  /**
   * Index of the currently selected parser tab.
   */
  tabIndex: number;

  /**
   * Error message for the ID input.
   */
  idError: string | null;

  /**
   * If the remove confirm dialog should be shown.
   */
  showRemoveConfirm: boolean;

  /**
   * Validation status of the configured parsers.
   */
  parsersValid: Record<string, boolean>;
}

export class Message extends React.Component<MessageProps, MessageState> {
  constructor (props: MessageProps) {
    super(props);
    // settings are our state
    this.state = this.validateState({
      tabIndex: 0,
      id: this.props.config.id || '',
      idError: null,
      name: this.props.config.name || '',
      dlc: typeof this.props.config.dlc === 'number' ? this.props.config.dlc : -1,
      receive: this.props.config.receive || false,
      send: this.props.config.send || false,
      autosend: this.props.config.autosend || false,
      parsers: this.props.config.parsers || {},
      parsersValid: {},
      showRemoveConfirm: false,
    });
  }

  public componentDidMount (): void {
    // revalidate parseres
    this.validateState();
  }

  public render (): React.ReactNode {
    const { classes, context } = this.props;
    return (
      <>
        <div className={classes.fabTopRight}>
          <Fab
            size='small'
            color='primary'
            aria-label='copy'
            title={I18n.t('Copy')}
            onClick={this.copy}
          >
            <ContentCopyIcon />
          </Fab>
          <Fab
            size='small'
            color='primary'
            aria-label='paste'
            title={I18n.t('Paste')}
            onClick={this.paste}
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            disabled={this.props.readonly || !internalClipboard.message}
          >
            <ContentPasteIcon />
          </Fab>
          <Fab
            size='small'
            color='primary'
            aria-label='delete'
            title={I18n.t('Remove')}
            onClick={() => this.setState({ showRemoveConfirm: true })}
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            disabled={this.props.readonly || !this.props.onDelete}
          >
            <DeleteIcon />
          </Fab>

          {this.props.onAdd && (
            <Fab
              size='small'
              color='primary'
              aria-label='add'
              title={I18n.t('Add')}
              onClick={() => this.props.onAdd?.(this.props.uuid)}
            >
              <AddIcon />
            </Fab>
          )}
        </div>

        <h2>{I18n.t('Message')}</h2>

        <Grid container spacing={3}>
          <InputText
            xs={12}
            sm={6}
            md={4}
            lg={2}
            label={I18n.t('Message ID')}
            value={this.state.id}
            required
            errorMsg={this.state.idError}
            disabled={this.props.readonly}
            transform='upperCase'
            onChange={(v) => this.handleChange('id', v)}
          >
            {I18n.t('CAN message ID in hex')}, {I18n.t('e.g.')} <code>00A0123B</code> {I18n.t('or')} <code>1AB</code>
          </InputText>
          <InputText
            xs={12}
            sm={6}
            md={4}
            lg={4}
            label={I18n.t('Name')}
            value={this.state.name}
            disabled={this.props.readonly}
            onChange={(v) => this.handleChange('name', v)}
          >
            {I18n.t('e.g.')} <code>{I18n.t('My super message')}</code>
          </InputText>
          <InputSelect
            xs={12}
            sm={6}
            md={4}
            lg={3}
            label={I18n.t('Data length')}
            value={this.state.dlc.toString()}
            options={{
              /* eslint-disable @stylistic/quote-props */
              '-1': I18n.t('Not set'),
              '0': '0',
              '1': '1',
              '2': '2',
              '3': '3',
              '4': '4',
              '5': '5',
              '6': '6',
              '7': '7',
              '8': '8',
              /* eslint-enable @stylistic/quote-props */
            }}
            disabled={this.props.readonly}
            onChange={(v) => this.handleChange('dlc', parseInt(v, 10))}
          >
            {I18n.t('Optionally set a fixed data length for this message')}
          </InputSelect>
        </Grid>
        <Grid container spacing={3}>
          <InputCheckbox
            xs={12}
            sm={12}
            md={4}
            lg={4}
            label={I18n.t('Receive')}
            value={this.state.receive}
            disabled={this.props.readonly}
            onChange={(v) => this.handleChange('receive', v)}
          >
            {I18n.t('Receive messages with the given ID')}
          </InputCheckbox>
          <InputCheckbox
            xs={12}
            sm={12}
            md={4}
            lg={4}
            label={I18n.t('Send')}
            value={this.state.send}
            disabled={this.props.readonly}
            onChange={(v) => this.handleChange('send', v)}
          >
            {I18n.t('Send messages with the given ID')}
          </InputCheckbox>
          <InputCheckbox
            xs={12}
            sm={12}
            md={4}
            lg={4}
            label={I18n.t('Autosend')}
            value={this.state.autosend}
            disabled={this.props.readonly}
            onChange={(v) => this.handleChange('autosend', v)}
          >
            {I18n.t('Automatically send the message when some data part changed')}
          </InputCheckbox>
        </Grid>

        <h2>{I18n.t('Parsers')}</h2>

        <div className={classes.root}>
          <Tabs
            orientation='vertical'
            variant='scrollable'
            value={this.state.tabIndex}
            onChange={this.handleTabChange}
            className={classes.tabs}
          >
            {Object.keys(this.state.parsers).map((parserUuid, i) => (
              <Tab
                key={`tab-${i}`}
                label={this.getParserTabLabel(this.state.parsers[parserUuid])}
                id={`${this.props.uuid}-tab-${i}`}
                className={classes.tab}
                style={{
                  color: this.state.parsersValid[parserUuid] === false ? 'red' : undefined,
                  fontStyle: this.state.parsers[parserUuid].id ? undefined : 'italic',
                }}
              />
            ))}

            {!this.props.readonly && (
              <Button color='primary' startIcon={<AddIcon />} onClick={this.onParserAdd}>
                {I18n.t('Add')}
              </Button>
            )}
          </Tabs>

          {Object.keys(this.state.parsers).map((parserUuid, i) => (
            <TabPanel key={`tabpanel-${i}`} value={this.state.tabIndex} index={i} className={classes.tabpanel}>
              <Parser
                uuid={parserUuid}
                config={this.state.parsers[parserUuid]}
                msgId={this.state.dlc >= 0 ? `${this.state.id}-${this.state.dlc}` : this.state.id}
                msgReceive={this.state.receive}
                msgSend={this.state.send}
                msgAutoSend={this.state.autosend}
                onChange={this.onParserChange}
                onValidate={this.onParserValidate}
                onDelete={this.onParserDelete}
                showToast={this.props.showToast}
                context={context}
                classes={classes}
                readonly={this.props.readonly}
              />
            </TabPanel>
          ))}
        </div>

        {this.state.showRemoveConfirm && (
          <ConfirmDialog
            title={I18n.t('Remove this message?')}
            text={I18n.t('Are you sure you want to remove this message? This will also remove all it\'s parsers. The message will be treated as unconfigured and may be deleted on adapter restart.')}
            onClose={(ok) => {
              if (ok && this.props.onDelete) {
                this.props.onDelete(this.props.uuid);
              }
              this.setState({ showRemoveConfirm: false });
            }}
          />
        )}
      </>
    );
  }

  /**
   * Method to create the label for a parser tab.
   * @param parser The parser config.
   */
  private getParserTabLabel (parser: ioBroker.AdapterConfigMessageParser): string {
    if (!parser?.id) {
      return I18n.t('ID missing');
    }

    if (!parser.name) {
      return parser.id;
    }

    return `${parser.name} (${parser.id})`;
  }

  /**
   * Handler for tab changes.
   */
  @boundMethod
  private handleTabChange (_event: React.ChangeEvent<unknown>, newValue: number): void {
    this.setState({ tabIndex: newValue });
  }

  /**
   * Handler for changed inputs.
   * @param key Key of the changed state
   * @param value The new value
   */
  private async handleChange<T extends keyof MessageState>(key: T, value: MessageState[T]): Promise<void> {
    const newState = {
      [key]: value,
    } as unknown as Pick<MessageState, keyof MessageState>;

    // to validate the id we need the dlc and vice versa, so we take the missing one from the current state
    if (key === 'id' && newState.dlc === undefined) {
      newState.dlc = this.state.dlc;
    } else if (key === 'dlc' && newState.id === undefined) {
      newState.id = this.state.id;
    }

    this.validateState(newState);

    await new Promise<void>((resolve) => {
      this.setState(newState, () => {
        this.onChange();
        resolve();
      });
    });
  }

  /**
   * Submit changes to the parent component.
   */
  private onChange (): void {
    if (this.props.onChange) {
      this.props.onChange(this.props.uuid, {
        id: this.state.id,
        name: this.state.name,
        dlc: this.state.dlc,
        receive: this.state.receive,
        send: this.state.send,
        autosend: this.state.autosend,
        parsers: { ...this.state.parsers },
      });
    }
  }

  /**
   * Validate the state of this component.
   * If no state is given, the previous results will be used and only the parser
   * validation results will be checked.
   * @param state The (partial) state to validate.
   */
  private validateState<T extends Partial<MessageState>>(state: T = {} as T): T {
    let isValid: boolean = true;

    // check own states
    if (state.id !== undefined) {
      // check this
      if (!state.id.match(MESSAGE_ID_REGEXP)) {
        state.idError = I18n.t('Must be a 3 or 8 char hex ID');
        isValid = false;
      } else if (this.props.knownMessageIds.find((i) => i.id === state.id && i.dlc === state.dlc && i.uuid !== this.props.uuid)) {
        state.idError = I18n.t('This ID is configured multiple times with this data length');
        isValid = false;
      } else {
        state.idError = null;
      }
    } else if (this.state?.idError !== null) {
      // use result from previous check
      isValid = false;
    }

    // check if parsers in current state are valid
    if (this.state?.parsersValid) {
      for (const uuid in this.state.parsersValid) {
        if (!this.state.parsersValid[uuid]) {
          isValid = false;
        }
      }
    }

    if (this.props.onValidate) {
      this.props.onValidate(this.props.uuid, isValid);
    }

    return state;
  }

  /**
   * Add a new parser.
   */
  @boundMethod
  private async onParserAdd (): Promise<void> {
    const uuid = uuidv4();
    const parser: ioBroker.AdapterConfigMessageParser = {
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
      autoSetInterval: false,
      autoSetValue: undefined,
    };

    const parsers = { ...this.state.parsers };
    parsers[uuid] = parser;
    await this.handleChange('parsers', parsers);

    // a new parser can't be valid
    await this.onParserValidate(uuid, false);

    this.setState({
      tabIndex: Object.keys(this.state.parsers).length - 1,
    });
  }

  /**
   * Handler for validation results of the parsers.
   * @param uuid The UUID of the parser.
   * @param valid If the parser is valid.
   */
  @boundMethod
  private async onParserValidate (uuid: string, valid: boolean): Promise<void> {
    const parsersValid = { ...this.state.parsersValid };
    parsersValid[uuid] = valid;

    return await new Promise((resolve) => {
      this.setState({
        parsersValid: parsersValid,
      }, () => {
        // trigger own revalidate to proxy the parser validation state
        this.validateState();

        resolve();
      });
    });
  }

  /**
   * Handler for changes in the parsers.
   * @param uuid The UUID of the parser.
   * @param parser The new parser config.
   */
  @boundMethod
  private onParserChange (uuid: string, parser: ioBroker.AdapterConfigMessageParser): void {
    const parsers = { ...this.state.parsers };
    parsers[uuid] = parser;
    void this.handleChange('parsers', parsers);
  }

  /**
   * Handler for parser delete events.
   * @param uuid The UUID of the parser.
   */
  @boundMethod
  private async onParserDelete (uuid: string): Promise<void> {
    const parsers = { ...this.state.parsers };
    const parsersValid = { ...this.state.parsersValid };
    delete parsers[uuid];
    delete parsersValid[uuid];
    await this.handleChange('parsers', parsers);

    this.setState({
      tabIndex: this.state.tabIndex - 1,
      parsersValid,
    }, () => {
      // trigger own revalidate to proxy the parser validation state
      this.validateState();

      // need to set the tabIndex this way because otherwise the selected parser
      // will not be updated if the first parser is deleted
      if (this.state.tabIndex < 0) {
        this.setState({ tabIndex: 0 });
      }
    });
  }

  /**
   * Copy the current configuration (the state) into the internal clipboard.
   */
  @boundMethod
  private copy (): void {
    internalClipboard.message = JSON.stringify(this.state);

    if (this.props.showToast) {
      this.props.showToast(I18n.t('Message configuration copied. Use the paste button to paste this configuration to an other message.'));
    }
  }

  /**
   * Load the configuration (the state) from the internal clipboard.
   */
  @boundMethod
  private paste (): void {
    if (!internalClipboard.message) {
      if (this.props.showToast) {
        this.props.showToast(I18n.t('Nothing to paste. Please use the copy button first.'));
      }
      return;
    }

    try {
      const ms: MessageState = JSON.parse(internalClipboard.message) as MessageState;

      // need to create new parser UUIDs to keep them unique
      const parserUuids = Object.keys(ms.parsers);
      for (const oldUuid of parserUuids) {
        const newUuid = uuidv4();
        ms.parsers[newUuid] = ms.parsers[oldUuid];
        delete ms.parsers[oldUuid];
      }

      this.setState(this.validateState({
        ...ms,
      }), () => {
        this.onChange();
        if (this.props.showToast) {
          this.props.showToast(I18n.t('Pasted'));
        }
      });
    } catch (err) {
      if (this.props.showToast) {
        this.props.showToast(I18n.t('Error while pasting: %s', `${err}`));
      }
    }
  }
}
