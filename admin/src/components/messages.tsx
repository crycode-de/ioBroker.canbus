import * as React from 'react';
import { autobind } from 'core-decorators';

import { uuidv4 } from '../lib/helpers';

import { Button } from './button';
import { Message } from './message';

import {
  subscribeObjectsAsync,
  unsubscribeObjectsAsync,
} from '../lib/backend';
import { MESSAGE_ID_REGEXP } from '../../../src/consts';

interface MessagesProps {
  onChange: (msgs: ioBroker.AdapterConfigMessages) => void;
  onValidate: (isVaild: boolean) => void;
  messages: ioBroker.AdapterConfigMessages | undefined;
}

interface MessagesState {
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

/**
 * Configuration of the messages.
 */
export class Messages extends React.PureComponent<MessagesProps, MessagesState> {

  constructor (props: MessagesProps) {
    super(props);

    this.state = {
      messages: props.messages || {},
      messagesValid: {},
      messagesUnconfigured: {}
    };
  }


  public componentDidMount(): void {
    socket.on('objectChange', this.handleObjChange);
    subscribeObjectsAsync(`${adapter}.${instance}.*`);

    // get uncondigured messages
    this.loadUnfiguredMessages();
  }

  public componentWillUnmount(): void {
    unsubscribeObjectsAsync(`${adapter}.${instance}.*`);
    socket.removeEventHandler('objectChange', this.handleObjChange);
  }

  public render() : JSX.Element {
    return (
      <>
        <h2>
          {_('Configured messages')}
          <Button title={_('Add')} onClick={this.addMessage} iconName='add' />
        </h2>
        <div className='row'>
          {Object.keys(this.state.messages).map((uuid) => {
            return (
              <Message
                key={uuid}
                uuid={uuid}
                message={this.state.messages[uuid]}
                onChange={this.handleMessageChanged}
                onValidate={this.handleMessageValidate}
                onDelete={this.deleteMessage}
              />
            );
          })}
        </div>

        <h2>
          {_('Unconfigured messages')}
          <Button title={_('Reload')} onClick={this.loadUnfiguredMessages} iconName='refresh' />
        </h2>
        <div className='row'>
          {Object.keys(this.state.messagesUnconfigured).map((id) => {
            return (
              <Message
                key={id}
                uuid={id}
                message={this.state.messagesUnconfigured[id]}
                readonly={true}
                hideParsers={true}
                onAdd={this.addMessageFromUnconfigured}
              />
            );
          })}
        </div>
      </>
    );
  }

  /**
   * Will be called when something of this component changed.
   * This will validate the state and submit the current messages to the parent component.
   */
  private onChange (): void {
    this.validateState();
    this.props.onChange(this.state.messages);
  }

  /**
   * Handle changes of a message component.
   * @param uuid The UUID of the message.
   * @param msg The updated message.
   */
  @autobind
  private handleMessageChanged (uuid: string, msg: ioBroker.AdapterConfigMessage): void {
    this.setState((prevState) => ({
      ...prevState,
      messages: {
        ...prevState.messages,
        [uuid]: msg
      },
      messagesValid: {
        ...prevState.messagesValid
      }
    }), () => {
      this.onChange();
    });
  }

  /**
   * Add a new message.
   */
  @autobind
  private addMessage (): void {
    const uuid = uuidv4();
    const msg: ioBroker.AdapterConfigMessage = {
      id: '',
      name: '',
      receive: false,
      send: false,
      autosend: false,
      parsers: {}
    };

    this.setState((prevState) => {
      const newState = {
        ...prevState,
        messages: {
          ...prevState.messages,
          [uuid]: msg
        },
        messagesValid: {
          ...prevState.messagesValid,
          [uuid]: false // a new message can't be valid
        }
      };
      return newState;
    }, () => {
      this.onChange();
    });
  }

  /**
   * Add a message from the unconfigured messages to the configured messages.
   * @param id The ID (not UUID!) if the unconfigured message.
   */
  @autobind
  private addMessageFromUnconfigured (id: string): void {
    const uuid = uuidv4();
    const msg: ioBroker.AdapterConfigMessage = {
      ...this.state.messagesUnconfigured[id]
    };

    this.setState((prevState) => {
      const newState = {
        ...prevState,
        messages: {
          ...prevState.messages,
          [uuid]: msg
        },
        messagesValid: {
          ...prevState.messagesValid,
          [uuid]: true // this a new message should be valid
        },
        messagesUnconfigured: {
          ...prevState.messagesUnconfigured
        }
      };

      // remove from unconfigured
      delete newState.messagesUnconfigured[id];

      return newState;
    }, () => {
      this.onChange();
    });
  }

  /**
   * Delete a configured message.
   * @param uuid The UUID of the message.
   */
  @autobind
  private deleteMessage (uuid: string): void {
    this.setState((prevState) => {
      const newState = {
        messages: {
          ...prevState.messages
        },
        messagesValid: {
          ...prevState.messagesValid
        }
      };
      delete newState.messages[uuid];
      delete newState.messagesValid[uuid];
      return newState;
    }, () => {
      console.log('messages updated', this.state.messages);
      this.onChange();

      // reload unconfigured messages since the deleted message may still exists as an object
      this.loadUnfiguredMessages();
    });
  }

  /**
   * Handle the validation result of a single message.
   * @param uuid The UUID of the validated message.
   * @param isValid `true` if the message is valid.
   */
  @autobind
  private handleMessageValidate(uuid: string, isValid: boolean): void {
    this.setState((prevState) => ({
      ...prevState,
      messages: {
        ...prevState.messages
      },
      messagesValid: {
        ...prevState.messagesValid,
        [uuid]: isValid
      }
    }), () => {
      // revalidate
      this.validateState();
    });
  }

  /**
   * Validate the state of this component.
   */
  private validateState (): void {
    let isValid = true;

    // check if parsers in current state are valid
    for (const uuid in this.state.messagesValid) {
      if (!this.state.messagesValid[uuid]) {
        isValid = false;
      }
    }

    this.props.onValidate(isValid);
  }

  /**
   * Load the currently unconfigured messages from the server.
   * This will overwrite the current state of unconfigured messages.
   */
  @autobind
  private loadUnfiguredMessages (): void {
    socket.emit('getObjectView', 'system', 'channel', { startkey: `${adapter}.${instance}`, endkey: `${adapter}.${instance}\u9999` }, (err, res: { rows: ioBroker.GetObjectViewItem[] }) => {
      const unconfMessages: ioBroker.AdapterConfigMessages = {};
      res.rows.forEach((obj) => {
        if (!obj.value) return;
        this.addPossiblyUnconfiguredMessage(unconfMessages, obj.value);
      });

      this.setState({
        messagesUnconfigured: unconfMessages
      });
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
    if (!idParts[2].match(MESSAGE_ID_REGEXP)) return false;

    // check if the message ID exists in currently configures messages
    for (const uuid in this.state.messages) {
      if (this.state.messages[uuid].id === idParts[2]) return false;
    }

    // add it to the unknown messages
    unconfMessages[idParts[2]] = {
      id: idParts[2],
      name: obj.common.name,
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
    // don't handle any foreign objects
    if (!id.startsWith(`${adapter}.${instance}.`)) return;

    // delete?
    if (!obj) {
      const idParts = id.split('.');
      if (!idParts[2].match(MESSAGE_ID_REGEXP)) return;
      // delete from state
      this.setState((prevState) => {
        const newState: MessagesState = {
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
        const newState: MessagesState = {
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
}