import * as React from 'react';
import { autobind } from 'core-decorators';

import { uuidv4 } from '../lib/helpers';

import { Button } from './button';
import { InputText } from './input-text';
import { InputCheckbox } from './input-checkbox';
import { Parser } from './parser';

import { MESSAGE_ID_REGEXP } from '../../../src/consts';

interface MessageProps {
  /**
   * The message changed.
   */
  onChange?: (uuid: string, msg: ioBroker.AdapterConfigMessage) => void;

  /**
   * The message was validated.
   */
  onValidate?: (uuid: string, isValid: boolean) => void;

  /**
   * The delete button was clicked.
   */
  onDelete?: (uuid: string) => void;

  /**
   * When the add-button is pressed to configure and unconfigured message
   */
  onAdd?: (uuid: string) => void;

  /**
   * UUID of this message.
   */
  uuid: string;

  /**
   * The message contents.
   */
  message: ioBroker.AdapterConfigMessage;

  /**
   * If this message should be readonly.
   */
  readonly?: boolean;

  /**
   * If this message should hide it's parsers.
   */
  hideParsers?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface MessageState extends ioBroker.AdapterConfigMessage {
  idError: string | null;
  parsersValid: Record<string, boolean>;
}

/**
 * A single message.
 * This may be configured or an unconfigured message.
 */
export class Message extends React.PureComponent<MessageProps, MessageState> {

  constructor (props: MessageProps) {
    super(props);

    this.state = this.validateState({
      id: this.props.message.id || '',
      idError: null,
      name: this.props.message.name || '',
      receive: this.props.message.receive || false,
      send: this.props.message.send || false,
      autosend: this.props.message.autosend || false,
      parsers: this.props.message.parsers || {},
      parsersValid: {}
    });
  }

  public componentDidMount(): void {
    // revalidate parsers
    this.validateState();
  }

  public render() : JSX.Element {
    return (
      <div className='msg-block'>
        {this.props.onDelete &&
          <Button title={_('Remove')} onClick={() => this.props.onDelete && this.props.onDelete(this.props.uuid)} iconName='delete' className='right-icon' />}
        {this.props.onAdd &&
          <Button title={_('Add')} onClick={() => this.props.onAdd && this.props.onAdd(this.props.uuid)} iconName='add' className='right-icon' />}

        <div className='row'>
          <InputText
            label={_('Message ID')}
            className='s6 m4 l2'
            value={this.state.id}
            onChange={(v) => this.handleChange('id', v)}
            errorMsg={this.state.idError}
            transform='upperCase'
            maxLength={8}
            disabled={this.props.readonly}
          >
            <span>{_('CAN message ID in hex')}, {_('e.g.')} <code>00A0123B</code> {_('or')} <code>1AB</code></span>
          </InputText>
          <InputText
            label={_('Name')}
            className='s6 m4 l2'
            value={this.state.name}
            onChange={(v) => this.handleChange('name', v)}
            disabled={this.props.readonly}
          >
            <span>{_('e.g.')} <code>{_('My super message')}</code></span>
          </InputText>

          <InputCheckbox
            label={_('Receive')}
            className='s6 m6 l2'
            value={this.state.receive}
            onChange={(v) => this.handleChange('receive', v)}
            disabled={this.props.readonly}
          >
            <span>{_('Receive messages with the given ID')}</span>
          </InputCheckbox>
          <InputCheckbox
            label={_('Send')}
            className='s6 m6 l2'
            value={this.state.send}
            onChange={(v) => this.handleChange('send', v)}
            disabled={this.props.readonly}
          >
            <span>{_('Send messages with the given ID')}</span>
          </InputCheckbox>
          <InputCheckbox
            label={_('Autosend')}
            className='s6 m6 l2'
            value={this.state.autosend}
            onChange={(v) => this.handleChange('autosend', v)}
            disabled={this.props.readonly}
          >
            <span>{_('Automatically send the message when some data part changed')}</span>
          </InputCheckbox>
        </div>

        {!this.props.hideParsers &&
          <div className='parsers-block'>
            <h3>
              {_('Parsers')}
              <Button title={_('Add')} onClick={this.addParser} iconName='add' />
            </h3>

            <div data-id='parsers'>
              {Object.keys(this.state.parsers).map((uuid) => {
                return (
                  <Parser
                    key={uuid}
                    uuid={uuid}
                    parser={this.state.parsers[uuid]}
                    msgId={this.state.id}
                    onChange={this.handleParserChanged}
                    onValidate={this.handleParserValidate}
                    onDelete={this.deleteParser}
                  />
                );
              })}
            </div>
          </div>
        }
      </div>
    );
  }

  /**
   * Submit changes to the parent component.
   */
  private onChange(): void {
    this.validateState();
    if (this.props.onChange) {
      this.props.onChange(this.props.uuid, {
        id: this.state.id,
        name: this.state.name,
        receive: this.state.receive,
        send: this.state.send,
        autosend: this.state.autosend,
        parsers: { ...this.state.parsers }
      });
    }
  }

  /**
   * Handler for changed inputs.
   * @param key Key of the changed state
   * @param value The new value
   */
  private handleChange<T extends keyof MessageState>(key: T, value: MessageState[T]): void {
    const newState = {
      [key]: value
    } as unknown as Pick<MessageState, keyof MessageState>;

    this.validateState(newState);

    this.setState(newState, () => {
      this.onChange();
    });
  }

  /**
   * Add a new parser.
   */
  @autobind
  private addParser(): void {
    const uuid = uuidv4();
    const par: ioBroker.AdapterConfigMessageParser = {
      id: '',
      name: '',
      dataType: 'int8',
      dataLength: 1,
      dataOffset: 0,
      dataUnit: '',
      dataEncoding: 'latin1',
      booleanMask: 0,
      booleanInvert: false
    };

    this.setState((prevState) => {
      const newState = {
        ...prevState,
        parsers: {
          ...prevState.parsers,
          [uuid]: par
        },
        parsersValid: {
          ...prevState.parsersValid,
          [uuid]: false // a new parser can't be valid
        }
      };
      return newState;
    }, () => {
      this.onChange();
    });
  }

  /**
   * Remove a parser from this message.
   * @param uuid The UUID of the parser.
   */
  @autobind
  private deleteParser(uuid: string): void {
    this.setState((prevState) => {
      const newState = {
        ...prevState,
        parsers: {
          ...prevState.parsers
        },
        parsersValid: {
          ...prevState.parsersValid
        }
      };
      delete newState.parsers[uuid];
      delete newState.parsersValid[uuid];
      return newState;
    }, () => {
      console.log('parsers updated', this.state.parsers);
      this.onChange();
    });
  }

  /**
   * Handle changes in a parser child component.
   * @param uuid The UUID of the parser.
   * @param parser The new parser config.
   */
  @autobind
  private handleParserChanged(uuid: string, parser: ioBroker.AdapterConfigMessageParser): void {
    this.setState((prevState) => ({
      ...prevState,
      parsers: {
        ...prevState.parsers,
        [uuid]: parser
      }
    }), () => {
      this.onChange();
    });
  }

  /**
   * Handle validation results of a parser.
   * @param uuid The UUID of the parser.
   * @param isValid `true` if the parser is valid.
   */
  @autobind
  private handleParserValidate(uuid: string, isValid: boolean): void {
    this.setState((prevState) => ({
      ...prevState,
      parsers: {
        ...prevState.parsers
      },
      parsersValid: {
        ...prevState.parsersValid,
        [uuid]: isValid
      }
    }), () => {
      // revalidate this
      this.validateState();
    });
  }

  /**
   * Validate the state of this component.
   * If no state is given, the previous results will be used and only the parser
   * validation results will be checked.
   * @param state The (partial) state to validate.
   */
  private validateState<T extends Partial<MessageState>>(state: T = {} as T): T {
    let isValid = true;

    // check own states
    if (state.id !== undefined) {
      // check this
      if (state.id.match(MESSAGE_ID_REGEXP)) {
        state.idError = null;
      } else {
        state.idError = _('Must be a 3 or 8 char hex ID');
        isValid = false;
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
}