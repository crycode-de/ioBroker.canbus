import React from 'react';
import { autobind } from 'core-decorators';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { Theme, withStyles } from '@material-ui/core/styles';
import { CreateCSSProperties } from '@material-ui/core/styles/withStyles';
import AddIcon from '@material-ui/icons/Add'

import I18n from '../i18n';

import { TabPanel } from './tab-panel';
import { General } from './general';
import { Message } from './message';
import { AppContext } from '../common';
import { uuidv4 } from '../lib/helpers';

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
  classes: Record<string, string>;
  native: ioBroker.AdapterConfig;
  common: (ioBroker.StateCommon & Record<string, any>) | (ioBroker.ChannelCommon & Record<string, any>) | (ioBroker.DeviceCommon & Record<string, any>) | (ioBroker.OtherCommon & Record<string, any>) | (ioBroker.EnumCommon & Record<string, any>);
  context: AppContext;

  onChange: (attr: string, value: any) => void;
}

interface SettingsState {
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

  @autobind
  private onMessageChange(uuid: string, msg: ioBroker.AdapterConfigMessage): void {
    console.log('onMessageChange()', uuid, msg);

    const msgs = { ...this.state.messages };
    msgs[uuid] = msg;
    this.onGeneralChange('messages', msgs);
  }

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

    // TODO: load unconfigured messages
  }

  @autobind
  private async onGeneralValidate(valid: boolean): Promise<void> {
    return new Promise((resolve) => {
      this.setState({
        generalValid: valid
      }, resolve);
    });
  }

  @autobind
  private async onMessageValidate(uuid: string, valid: boolean): Promise<void> {
    const msgsValid = { ...this.state.messagesValid };
    msgsValid[uuid] = valid;

    return new Promise((resolve) => {
      this.setState({
        messagesValid: msgsValid
      }, resolve);
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

  @autobind
  private handleTabChange(_event: React.ChangeEvent<any>, newValue: number): void {
    this.setState({ tabIndex: newValue });
  }

  render(): React.ReactNode {
    const { classes, native, context } = this.props;
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
          {Object.keys(this.state.messages).map((msgUuid, i) => (
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

          <Button color='primary' startIcon={<AddIcon />} onClick={this.onMessageAdd}>
            {I18n.t('Add')}
          </Button>
        </Tabs>

        <TabPanel value={this.state.tabIndex} index={0} className={classes.tabpanel}>
          <General
            settings={native}
            context={context}
            common={this.props.common}
            native={this.props.native}
            onChange={this.onGeneralChange}
            onValidate={this.onGeneralValidate}
          />
        </TabPanel>
        <TabPanel value={this.state.tabIndex} index={1}>
          {/* dummy for messages divider */}
        </TabPanel>
        {Object.keys(this.state.messages).map((msgUuid, i) => (
          <TabPanel key={`tabpanel-${i + 2}`} value={this.state.tabIndex} index={i + 2} className={classes.tabpanel}>
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
      </div>
    );
  }

  private getMessageTabLabel (msg: ioBroker.AdapterConfigMessage): string {
    if (!msg?.id) {
      return I18n.t('ID missing');
    }

    if (msg.dlc >= 0) {
      return `${msg.id}-${msg.dlc} ${msg.name}`;
    }

    return `${msg.id} ${msg.name}`;
  }
}

export default withStyles(styles)(Settings);
