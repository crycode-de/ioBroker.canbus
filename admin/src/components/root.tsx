import * as React from 'react';

import { Tabs } from 'iobroker-react-components';

import { autobind } from 'core-decorators';

import { MainSettings } from './main-settings';
import { Messages } from './messages';

interface RootProps {
  settings: ioBroker.AdapterConfig;
  onSettingsChanged: (changes: Partial<ioBroker.AdapterConfig>) => void;
  onValidate: (isValid: boolean) => void;
}

/**
 * The root component for the adapter admin interface.
 */
export class Root extends React.Component<RootProps> {

  private mainSettingsValid: boolean = false;
  private messagesValid: boolean = false;

  constructor(props: RootProps) {
    super(props);
  }

  public render(): React.ReactNode {
    return (
      <Tabs labels={['Main settings', 'Messages']}>
        <MainSettings
          interface={this.props.settings.interface}
          autoAddSeenMessages={this.props.settings.autoAddSeenMessages}
          deleteUnconfiguredMessages={this.props.settings.deleteUnconfiguredMessages}
          onChange={this.handleSettingsChanged}
          onValidate={this.handleSettingsValidate}
        />
        <Messages
          messages={this.props.settings.messages}
          onChange={this.handleMessagesChanged}
          onValidate={this.handleMessagesValidate}
        />
      </Tabs>
    );
  }

  /**
   * Handler for changes in the messages.
   * @param messages The new messages.
   */
  @autobind
  private handleMessagesChanged (messages: ioBroker.AdapterConfigMessages): void {
    this.props.onSettingsChanged({
      messages
    });
  }

  /**
   * Handler for messages validation status.
   * @param isValid `true` if all messages are valid.
   */
  @autobind
  private handleMessagesValidate (isValid: boolean): void {
    this.messagesValid = isValid;
    this.onValidate();
  }

  /**
   * Handler for changes in the main settings.
   * @param mainSettings The new main settings.
   */
  @autobind
  private handleSettingsChanged (mainSettings: ioBroker.AdapterConfigMainSettings): void {
    this.props.onSettingsChanged({
      ...mainSettings
    });
  }

  /**
   * Handler for main settings validation status.
   * @param isValid `true` if the main settings are valid.
   */
  @autobind
  private handleSettingsValidate (isValid: boolean): void {
    this.mainSettingsValid = isValid;
    this.onValidate();
  }

  /**
   * Submit the current validation state to the parent.
   */
  private onValidate (): void {
    this.props.onValidate(this.mainSettingsValid && this.messagesValid);
  }
}