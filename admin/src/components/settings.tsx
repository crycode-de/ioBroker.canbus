import React from 'react';
import { autobind } from 'core-decorators';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { Theme, withStyles } from '@material-ui/core/styles';
import { CreateCSSProperties } from '@material-ui/core/styles/withStyles';
import AddIcon from '@material-ui/icons/Add'

import I18n from '@iobroker/adapter-react/i18n';

import { TabPanel } from './tab-panel';
import { General } from './general';
import { Message } from './message';
import { AppContext } from '../common';
import { uuidv4 } from '../lib/helpers';
import { MESSAGE_ID_REGEXP, MESSAGE_ID_REGEXP_WITH_DLC } from '../../../src/consts';

const styles = (theme: Theme): Record<string, CreateCSSProperties> => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    height: 'calc(100% - 102px)'
  },
  tabs: {
    borderRight: `1px solid ${theme.palette.divider}`
  },
  tab: {
    textTransform: 'none'
  },
  tabpanel: {
    position: 'relative',
    width: '100%',
    overflowY: 'auto'
  },
  fabTopRight: {
    position: 'absolute',
    top: theme.spacing(2),
    right: theme.spacing(2)
  }
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
  common: (ioBroker.StateCommon & Record<string, any>) | (ioBroker.ChannelCommon & Record<string, any>) | (ioBroker.DeviceCommon & Record<string, any>) | (ioBroker.OtherCommon & Record<string, any>) | (ioBroker.EnumCommon & Record<string, any>);

  /**
   * The app context.
   */
  context: AppContext;

  /**
   * The settings were changed.
   */
  onChange: (attr: string, value: any) => void;

  /**
   * The settings were validated.
   */
  onValidate: (valid: boolean) => void;
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
   * Validation status of the configured messages.
   */
  messagesValid: Record<string, boolean>;

  /**
   * Unconfigured (but seen) messages.
   */
  messagesUnconfigured: ioBroker.AdapterConfigMessages;
}

class Settings extends React.Component<SettingsProps, SettingsState> {
  constructor(props: SettingsProps) {
    super(props);

    this.state = {
      tabIndex: 0,
      generalValid: true,
      messages: this.props.native.messages || {},
      messagesValid: {},
      messagesUnconfigured: {},
    };
  }

  public componentDidMount(): void {
    const { socket, instance, adapterName } = this.props.context;

    // subscribe to object changes to live display new unconfigured messages.
    socket.subscribeObject(`${adapterName}.${instance}.*`, this.handleObjChange);

    // get unconfigured messages
    this.loadUnfiguredMessages();
  }

  public componentWillUnmount(): void {
    const { socket, instance, adapterName } = this.props.context;
    socket.unsubscribeObject(`${adapterName}.${instance}.*`, this.handleObjChange);
  }

  public render(): React.ReactNode {
    const { classes, native, common, context } = this.props;

    /**
     * Counter for the tab numbers. Will be increased on each tab.
     */
    let tabIndex: number = 0;

    const keysMessages = Object.keys(this.state.messages);
    const keysMessagesUnconfigured = Object.keys(this.state.messagesUnconfigured);

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
              color: this.state.generalValid === false ? 'red' : undefined
            }}
          />

          <Box textAlign='center'>{I18n.t('Messages')}</Box>
          {keysMessages.map((msgUuid, i) => (
            <Tab
              key={`tab-${i + 1}`}
              label={this.getMessageTabLabel(this.state.messages[msgUuid])}
              id={`tab-${i + 1}`}
              className={classes.tab}
              style={{
                color: this.state.messagesValid[msgUuid] === false ? 'red' : undefined,
                fontStyle: this.state.messages[msgUuid].id ? undefined : 'italic'
              }}
            />
          ))}

          {keysMessagesUnconfigured.length > 0 &&
            <Box textAlign='center'>{I18n.t('Unconfigured messages')}</Box>
          }
          {keysMessagesUnconfigured.map((id, i) => (
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
            context={context}
            common={common}
            native={native}
            onChange={this.onGeneralChange}
            onValidate={this.onGeneralValidate}
          />
        </TabPanel>

        <TabPanel value={this.state.tabIndex} index={tabIndex++}>
          {/* dummy for messages divider */}
        </TabPanel>

        {keysMessages.map((msgUuid, i) => (
          <TabPanel key={`tabpanel-${i}`} value={this.state.tabIndex} index={tabIndex++} className={classes.tabpanel}>
            <Message
              key={msgUuid}
              context={context}
              classes={classes}
              uuid={msgUuid}
              config={this.state.messages[msgUuid]}
              onChange={this.onMessageChange}
              onDelete={this.onMessageDelete}
              onValidate={this.onMessageValidate}
            />
          </TabPanel>
        ))}


        {keysMessagesUnconfigured.length > 0 &&
          <TabPanel value={this.state.tabIndex} index={tabIndex++}>
            {/* dummy for unconfigured messages divider */}
          </TabPanel>
        }

        {keysMessagesUnconfigured.map((id, i) => (
          <TabPanel key={`tabpanel-${i}`} value={this.state.tabIndex} index={tabIndex++} className={classes.tabpanel}>
            <Message
              key={id}
              context={context}
              classes={classes}
              uuid={id}
              config={this.state.messagesUnconfigured[id]}
              readonly={true}
              onAdd={this.onMessageAddFromUnconfigured}
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
  @autobind
  private handleTabChange(_event: React.ChangeEvent<any>, newValue: number): void {
    this.setState({ tabIndex: newValue });
  }

  /**
   * Handler for all changes.
   * @param attr The name of the changed setting.
   * @param value The new value.
   */
  @autobind
  private async onGeneralChange(attr: string, value: any): Promise<void> {
    this.props.onChange(attr, value);

    if (attr === 'messages') {
      if (Object.keys(value).length === 0) {
        // activate the first tab if there are no messages
        await new Promise((resolve) => {
          this.setState({
            messages: value,
            tabIndex: 0
          }, resolve);
        });
      } else {
        await new Promise((resolve) => {
          this.setState({
            messages: value
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
  @autobind
  private onMessageChange(uuid: string, msg: ioBroker.AdapterConfigMessage): void {
    const msgs = { ...this.state.messages };
    msgs[uuid] = msg;
    this.onGeneralChange('messages', msgs);
  }

  /**
   * Handler for message delete events.
   * @param uuid The UUID of the message.
   */
  @autobind
  private async onMessageDelete(uuid: string): Promise<void> {
    const msgs = { ...this.state.messages };
    delete msgs[uuid];
    await this.onGeneralChange('messages', msgs);

    this.setState({
      tabIndex: this.state.tabIndex - 1
    }, () => {
      // need to set the tabIndex this way because otherwise the selected message
      // will not be updated if the first message is deleted
      if (this.state.tabIndex < 2) {
        this.setState({ tabIndex: 0 });
      }
    });

    // reload unconfigured messages since the deleted message may still exists as an object
    this.loadUnfiguredMessages();
  }

  /**
   * Handler for validation results of the general settings.
   * @param valid If the general settings are valid.
   */
  @autobind
  private async onGeneralValidate(valid: boolean): Promise<void> {
    return new Promise((resolve) => {
      this.setState({
        generalValid: valid
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
  @autobind
  private async onMessageValidate(uuid: string, valid: boolean): Promise<void> {
    const msgsValid = { ...this.state.messagesValid };
    msgsValid[uuid] = valid;

    return new Promise((resolve) => {
      this.setState({
        messagesValid: msgsValid
      }, () => {
        this.validate();
        resolve();
      });
    });
  }

  /**
   * Add a new message.
   */
  @autobind
  private async onMessageAdd(): Promise<void> {
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
    msgs[uuid] = msg;
    await this.onGeneralChange('messages', msgs);

    // a new message can't be valid
    await this.onMessageValidate(uuid, false);

    this.setState({
      tabIndex: Object.keys(this.state.messages).length + 1
    });
  }

  /**
   * Add a message from the unconfigured messages to the configured messages.
   * @param id The ID (not UUID!) of the unconfigured message.
   */
  @autobind
  private async onMessageAddFromUnconfigured(id: string): Promise<void> {
    const uuid = uuidv4();
    const msg: ioBroker.AdapterConfigMessage = {
      ...this.state.messagesUnconfigured[id]
    };

    const msgs = { ...this.state.messages };
    msgs[uuid] = msg;
    await this.onGeneralChange('messages', msgs);

    // remove it from unconfigured
    const messagesUnconfigured = { ...this.state.messagesUnconfigured };
    delete messagesUnconfigured[id];

    this.setState({
      tabIndex: Object.keys(this.state.messages).length + 1,
      messagesUnconfigured
    });
  }

  /**
   * Load the currently unconfigured messages from the server.
   * This will overwrite the current state of unconfigured messages.
   */
  @autobind
  private async loadUnfiguredMessages(): Promise<void> {
    const { socket, instance, adapterName } = this.props.context;

    const objs = await socket.getObjectView(`${adapterName}.${instance}.`, `${adapterName}.${instance}.\u9999`, 'channel');

    const messagesUnconfigured: ioBroker.AdapterConfigMessages = {};
    for (const id in objs) {
      this.addPossiblyUnconfiguredMessage(messagesUnconfigured, objs[id]);
    }

    this.setState({
      messagesUnconfigured
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
  private addPossiblyUnconfiguredMessage(unconfMessages: ioBroker.AdapterConfigMessages, obj: ioBroker.Object): boolean {

    if (obj.type !== 'channel') return false;

    // the ID must match the message id regexp
    const idParts = obj._id.split('.');
    if (!idParts[2].match(MESSAGE_ID_REGEXP_WITH_DLC)) return false;

    const [id, dlcStr] = idParts[2].split('-');
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
      parsers: {}
    };

    return true;
  }

  /**
   * Handle changes in the adapter objects.
   * This will create/remove "unconfigured messages" if messages are dynamicaly added/removed while the adapter admin
   * site is opend.
   * @param id The ID of the ioBroker object
   * @param obj The ioBroker object or `null` if the object was deleted.
   */
  @autobind
  private handleObjChange(id: string, obj: ioBroker.Object | null | undefined): void {
    const { instance, adapterName } = this.props.context;

    // don't handle any foreign objects
    if (!id.startsWith(`${adapterName}.${instance}.`)) return;

    // delete?
    if (!obj) {
      const idParts = id.split('.');
      if (!idParts[2].match(MESSAGE_ID_REGEXP)) return;
      // delete from state
      this.setState((prevState) => {
        const newState: SettingsState = {
          ...prevState,
          messagesUnconfigured: {
            ...prevState.messagesUnconfigured
          }
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
            ...unconfMessages
          }
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
  private validate(): boolean {
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
