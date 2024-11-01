import React from 'react';
import { boundMethod } from 'autobind-decorator';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { Theme, withStyles } from '@material-ui/core/styles';
import { CreateCSSProperties } from '@material-ui/core/styles/withStyles';
import AddIcon from '@material-ui/icons/Add';

import I18n from '@iobroker/adapter-react/i18n';

import { TabPanel } from './tab-panel';
import { General } from './general';
import { ImportExport } from './import-export';
import { Message } from './message';
import type { AppContext, CommonObj } from '../common';
import {
  sortMessagesById,
  uuidv4,
} from '../lib/helpers';
import { MESSAGE_ID_REGEXP, MESSAGE_ID_REGEXP_WITH_DLC } from '../../../src/consts';

const styles = (theme: Theme): Record<string, CreateCSSProperties> => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    height: 'calc(100% - 102px)',
  },
  tabs: {
    borderRight: `1px solid ${theme.palette.divider}`,
  },
  tab: {
    textTransform: 'none',
  },
  tabpanel: {
    position: 'relative',
    width: '100%',
    overflowY: 'auto',
  },
  fabTopRight: {
    '& > button': {
      margin: theme.spacing(1),
    },
    position: 'absolute',
    top: theme.spacing(2),
    right: theme.spacing(2),
  },
});

interface SettingsProps {
  /**
   * Classes to apply for some elements.
   */
  classes: Record<string, string>;

  /**
   * The native adapter config.
   */
  native: ioBroker.AdapterConfig;

  /**
   * The common adapter options.
   */
  common: CommonObj;

  /**
   * The app context.
   */
  context: AppContext;

  /**
   * The settings were changed.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (attr: string, value: any) => void;

  /**
   * The settings were validated.
   */
  onValidate: (valid: boolean) => void;

  /**
   * Set the native config.
   */
  setNative: (native: ioBroker.AdapterConfig) => void;

  /**
   * Show a toast message.
   */
  showToast: (text: string) => void;

  /**
   * Show an error message.
   */
  onError: (text: string | React.ReactElement) => void;
}

interface SettingsState {
  /**
   * Index of the currently selected general/messages tab.
   */
  tabIndex: number;

  /**
   * Validation status of the general settings.
   */
  generalValid: boolean;

  /**
   * Configured messages.
   */
  messages: ioBroker.AdapterConfigMessages;

  /**
   * Sorted keys of the messages.
   */
  messagesKeys: string[];

  /**
   * Validation status of the configured messages.
   */
  messagesValid: Record<string, boolean>;

  /**
   * Unconfigured (but seen) messages.
   */
  messagesUnconfigured: ioBroker.AdapterConfigMessages;

  /**
   * Sorted keys of the unconfigured messages.
   */
  messagesUnconfiguredKeys: string[];
}

class Settings extends React.Component<SettingsProps, SettingsState> {

  constructor (props: SettingsProps) {
    super(props);

    const messages = this.props.native.messages ?? {};
    this.state = {
      tabIndex: 0,
      generalValid: true,
      messages,
      messagesKeys: Object.keys(messages).sort((a, b) => sortMessagesById(messages, a, b)),
      messagesValid: {},
      messagesUnconfigured: {},
      messagesUnconfiguredKeys: [],
    };
  }

  public componentDidMount (): void {
    const { socket, instance, adapterName } = this.props.context;

    // subscribe to object changes to live display new unconfigured messages.
    void socket.subscribeObject(`${adapterName}.${instance}.*`, this.handleObjChange);

    // get unconfigured messages
    void this.loadUnconfiguredMessages();
  }

  public componentWillUnmount (): void {
    const { socket, instance, adapterName } = this.props.context;
    void socket.unsubscribeObject(`${adapterName}.${instance}.*`, this.handleObjChange);
  }

  public render (): React.ReactNode {
    const { classes, native, common, context } = this.props;

    /**
     * Counter for the tab numbers. Will be increased on each tab.
     */
    let tabIndex: number = 0;

    const knownMessageIds = Object.keys(this.state.messages).map((uuid) => ({ id: this.state.messages[uuid].id, dlc: this.state.messages[uuid].dlc, uuid: uuid }));

    return (
      <div className={classes.root}>
        <Tabs
          orientation='vertical'
          variant='scrollable'
          value={this.state.tabIndex}
          onChange={this.handleTabChange}
          className={classes.tabs}
        >
          <Tab
            label={I18n.t('General')}
            id='tab-0'
            className={classes.tab}
            style={{
              color: this.state.generalValid === false ? 'red' : undefined,
            }}
          />
          <Tab
            label={I18n.t('Import / Export')}
            id='tab-1'
            className={classes.tab}
          />

          <Box textAlign='center'>{I18n.t('Messages')}</Box>
          {this.state.messagesKeys.map((msgUuid, i) => this.state.messages[msgUuid] && (
            <Tab
              key={`tab-${i + 1}`}
              label={this.getMessageTabLabel(this.state.messages[msgUuid])}
              id={`tab-${i + 1}`}
              className={classes.tab}
              style={{
                color: this.state.messagesValid[msgUuid] === false ? 'red' : undefined,
                fontStyle: this.state.messages[msgUuid].id ? undefined : 'italic',
              }}
            />
          ))}

          {this.state.messagesUnconfiguredKeys.length > 0 && (
            <Box textAlign='center'>{I18n.t('Unconfigured messages')}</Box>
          )}
          {this.state.messagesUnconfiguredKeys.map((id, i) => this.state.messagesUnconfigured[id] && (
            <Tab
              key={`tab-unconf-${i}`}
              label={this.getMessageTabLabel(this.state.messagesUnconfigured[id])}
              id={`tab-unconf-${i}`}
              className={classes.tab}
            />
          ))}

          <Button color='primary' startIcon={<AddIcon />} onClick={this.onMessageAdd}>
            {I18n.t('Add')}
          </Button>
        </Tabs>

        <TabPanel value={this.state.tabIndex} index={tabIndex++} className={classes.tabpanel}>
          <General
            common={common}
            context={context}
            native={native}
            onChange={this.onGeneralChange}
            onError={this.props.onError}
            onValidate={this.onGeneralValidate}
            setNative={this.props.setNative}
          />
        </TabPanel>

        <TabPanel value={this.state.tabIndex} index={tabIndex++} className={classes.tabpanel}>
          <ImportExport
            context={context}
            native={native}
            onError={this.props.onError}
            setNative={this.props.setNative}
            showToast={this.props.showToast}
          />
        </TabPanel>

        <TabPanel value={this.state.tabIndex} index={tabIndex++}>
          {/* dummy for messages divider */}
        </TabPanel>

        {this.state.messagesKeys.map((msgUuid, i) => this.state.messages[msgUuid] && (
          <TabPanel key={`tabpanel-${i}`} value={this.state.tabIndex} index={tabIndex++} className={classes.tabpanel}>
            <Message
              key={msgUuid}
              context={context}
              classes={classes}
              uuid={msgUuid}
              config={this.state.messages[msgUuid]}
              knownMessageIds={knownMessageIds}
              onChange={this.onMessageChange}
              onDelete={this.onMessageDelete}
              onValidate={this.onMessageValidate}
              showToast={this.props.showToast}
            />
          </TabPanel>
        ))}

        {this.state.messagesUnconfiguredKeys.length > 0 && (
          <TabPanel value={this.state.tabIndex} index={tabIndex++}>
            {/* dummy for unconfigured messages divider */}
          </TabPanel>
        )}

        {this.state.messagesUnconfiguredKeys.map((id, i) => this.state.messagesUnconfigured[id] && (
          <TabPanel key={`tabpanel-${i}`} value={this.state.tabIndex} index={tabIndex++} className={classes.tabpanel}>
            <Message
              key={id}
              context={context}
              classes={classes}
              uuid={id}
              config={this.state.messagesUnconfigured[id]}
              knownMessageIds={[]}
              readonly={true}
              onAdd={this.onMessageAddFromUnconfigured}
              showToast={this.props.showToast}
            />
          </TabPanel>
        ))}

      </div>
    );
  }

  /**
   * Method to create the label for a message tab.
   * @param msg The message config.
   */
  private getMessageTabLabel (msg: ioBroker.AdapterConfigMessage): string {
    if (!msg?.id) {
      return I18n.t('ID missing');
    }

    if (msg.dlc >= 0) {
      return `${msg.id}-${msg.dlc} ${msg.name}`;
    }

    return `${msg.id} ${msg.name}`;
  }

  /**
   * Handler for tab changes.
   */
  @boundMethod
  private handleTabChange (_event: React.ChangeEvent<unknown>, newValue: number): void {
    this.setState({ tabIndex: newValue });
  }

  /**
   * Handler for all changes.
   * @param attr The name of the changed setting.
   * @param value The new value.
   */
  @boundMethod
  private async onGeneralChange (attr: string, value: unknown): Promise<void> {
    this.props.onChange(attr, value);

    if (attr === 'messages') {
      if (Object.keys(value as ioBroker.AdapterConfigMessages).length === 0) {
        // activate the first tab if there are no messages
        await new Promise<void>((resolve) => {
          this.setState({
            messages: value as ioBroker.AdapterConfigMessages,
            tabIndex: 0,
          }, resolve);
        });
      } else {
        await new Promise<void>((resolve) => {
          this.setState({
            messages: value as ioBroker.AdapterConfigMessages,
          }, resolve);
        });
      }
    }
  }

  /**
   * Handler for changed messages.
   * @param uuid The UUID of the message.
   * @param msg The new message config.
   */
  @boundMethod
  private onMessageChange (uuid: string, msg: ioBroker.AdapterConfigMessage): void {
    const msgs = { ...this.state.messages };
    msgs[uuid] = msg;
    void this.onGeneralChange('messages', msgs);
  }

  /**
   * Handler for message delete events.
   * @param uuid The UUID of the message.
   */
  @boundMethod
  private async onMessageDelete (uuid: string): Promise<void> {
    const messages = { ...this.state.messages };
    const messagesValid = { ...this.state.messagesValid };
    const messagesKeys = this.state.messagesKeys.filter((k) => k !== uuid);
    delete messages[uuid];
    delete messagesValid[uuid];
    await this.onGeneralChange('messages', messages);

    this.setState({
      tabIndex: this.state.tabIndex - 1,
      messagesKeys,
      messagesValid,
    }, () => {
      this.validate();

      // need to set the tabIndex this way because otherwise the selected message
      // will not be updated if the first message is deleted
      if (this.state.tabIndex < 3) {
        this.setState({ tabIndex: 0 });
      }
    });

    // reload unconfigured messages since the deleted message may still exists as an object
    void this.loadUnconfiguredMessages();
  }

  /**
   * Handler for validation results of the general settings.
   * @param valid If the general settings are valid.
   */
  @boundMethod
  private async onGeneralValidate (valid: boolean): Promise<void> {
    return await new Promise((resolve) => {
      this.setState({
        generalValid: valid,
      }, () => {
        this.validate();
        resolve();
      });
    });
  }

  /**
   * Handler for validation results of a message.
   * @param uuid The UUID of the message.
   * @param valid If the message is valid.
   */
  @boundMethod
  private async onMessageValidate (uuid: string, valid: boolean): Promise<void> {
    const messagesValid = { ...this.state.messagesValid };
    messagesValid[uuid] = valid;

    return await new Promise((resolve) => {
      this.setState({
        messagesValid,
      }, () => {
        this.validate();
        resolve();
      });
    });
  }

  /**
   * Add a new message.
   */
  @boundMethod
  private async onMessageAdd (): Promise<void> {
    const uuid = uuidv4();
    const msg: ioBroker.AdapterConfigMessage = {
      id: '',
      name: '',
      dlc: -1,
      receive: false,
      send: false,
      autosend: false,
      parsers: {},
    };

    const msgs = { ...this.state.messages };
    const messagesKeys = [
      ...this.state.messagesKeys,
      uuid,
    ];
    msgs[uuid] = msg;
    await this.onGeneralChange('messages', msgs);

    // a new message can't be valid
    await this.onMessageValidate(uuid, false);

    this.setState({
      tabIndex: Object.keys(this.state.messages).length + 2,
      messagesKeys,
    });
  }

  /**
   * Add a message from the unconfigured messages to the configured messages.
   * @param id The ID (not UUID!) of the unconfigured message.
   */
  @boundMethod
  private async onMessageAddFromUnconfigured (id: string): Promise<void> {
    const uuid = uuidv4();
    const msg: ioBroker.AdapterConfigMessage = {
      ...this.state.messagesUnconfigured[id],
    };

    const messages = { ...this.state.messages };
    const messagesKeys = [
      ...this.state.messagesKeys,
      uuid,
    ];
    messages[uuid] = msg;
    await this.onGeneralChange('messages', messages);

    // remove it from unconfigured
    const messagesUnconfigured = { ...this.state.messagesUnconfigured };
    const messagesUnconfiguredKeys = this.state.messagesUnconfiguredKeys.filter((k) => k !== id);
    delete messagesUnconfigured[id];

    this.setState({
      tabIndex: Object.keys(this.state.messages).length + 2,
      messagesKeys,
      messagesUnconfigured,
      messagesUnconfiguredKeys,
    });
  }

  /**
   * Load the currently unconfigured messages from the server.
   * This will overwrite the current state of unconfigured messages.
   */
  @boundMethod
  private async loadUnconfiguredMessages (): Promise<void> {
    const { socket, instance, adapterName } = this.props.context;

    const objs = await socket.getObjectView(`${adapterName}.${instance}.`, `${adapterName}.${instance}.\u9999`, 'channel');

    const messagesUnconfigured: ioBroker.AdapterConfigMessages = {};
    for (const id in objs) {
      this.addPossiblyUnconfiguredMessage(messagesUnconfigured, objs[id]);
    }

    this.setState({
      messagesUnconfigured,
      messagesUnconfiguredKeys: Object.keys(messagesUnconfigured).sort((a, b) => sortMessagesById(messagesUnconfigured, a, b)),
    });
  }

  /**
   * Add a possibly unconfigured message from the corresponding ioBroker object
   * to the given object of unconfigured messages.
   * The message will only be added if `obj` is a 'message object' and the
   * message id is not included in the configured messages.
   * @param unconfMessages Object with unconfigured messages to which the messages should be added
   * @param obj ioBroker object to add.
   * @return `true` if the message is added.
   */
  private addPossiblyUnconfiguredMessage (unconfMessages: ioBroker.AdapterConfigMessages, obj: ioBroker.Object): boolean {

    if (obj.type !== 'channel') return false;

    // the ID must match the message id regexp
    const idParts = obj._id.split('.');
    if (!idParts[2].match(MESSAGE_ID_REGEXP_WITH_DLC)) return false;

    const [ id, dlcStr ] = idParts[2].split('-');
    const dlc = (dlcStr === undefined) ? -1 : parseInt(dlcStr, 10);

    // check if the message ID exists in currently configures messages
    for (const uuid in this.state.messages) {
      if (this.state.messages[uuid].id === id && this.state.messages[uuid].dlc === dlc) return false;
    }

    // add it to the unknown messages
    unconfMessages[idParts[2]] = {
      id: id,
      name: obj.common.name as string,
      dlc: dlc,
      receive: true,
      send: false,
      autosend: false,
      parsers: {},
    };

    return true;
  }

  /**
   * Handle changes in the adapter objects.
   * This will create/remove "unconfigured messages" if messages are dynamically
   * added/removed while the adapter admin site is opened.
   * @param id The ID of the ioBroker object
   * @param obj The ioBroker object or `null` if the object was deleted.
   */
  @boundMethod
  private handleObjChange (id: string, obj: ioBroker.Object | null | undefined): void {
    const { instance, adapterName } = this.props.context;

    // don't handle any foreign objects
    if (!id.startsWith(`${adapterName}.${instance}.`)) return;

    const idParts = id.split('.');
    if (!idParts[2].match(MESSAGE_ID_REGEXP)) return;

    // delete?
    if (!obj) {
      // delete from state
      this.setState((prevState) => {
        const newState: SettingsState = {
          ...prevState,
          messagesUnconfigured: {
            ...prevState.messagesUnconfigured,
          },
          messagesUnconfiguredKeys: prevState.messagesUnconfiguredKeys.filter((k) => k !== idParts[2]),
        };
        delete newState.messagesUnconfigured[idParts[2]];
        return newState;
      });
      return;
    }

    // add?
    const unconfMessages: ioBroker.AdapterConfigMessages = {};
    if (this.addPossiblyUnconfiguredMessage(unconfMessages, obj)) {
      this.setState((prevState) => {
        const newState: SettingsState = {
          ...prevState,
          messagesUnconfigured: {
            ...prevState.messagesUnconfigured,
            ...unconfMessages,
          },
          messagesUnconfiguredKeys: [
            ...prevState.messagesUnconfiguredKeys,
            idParts[2],
          ],
        };
        return newState;
      });
    }
  }

  /**
   * Validate the current settings.
   * This will use the results of the previous general/message validation results.
   * @return `true` if all settings are valid.
   */
  private validate (): boolean {
    let isValid = this.state.generalValid;

    if (isValid) {
      for (const msgUuid in this.state.messagesValid) {
        if (!this.state.messagesValid[msgUuid]) {
          isValid = false;
        }
      }
    }

    this.props.onValidate(isValid);

    return isValid;
  }
}

export default withStyles(styles)(Settings);
