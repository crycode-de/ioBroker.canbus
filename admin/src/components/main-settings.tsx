import * as React from 'react';

import { InputText } from './input-text';
import { InputCheckbox } from './input-checkbox';
import { INTERFACE_REGEXP } from '../../../src/consts';

interface MainSettingsProps {
  onChange: (mainSettings: ioBroker.AdapterConfigMainSettings) => void;
  onValidate: (isValid: boolean) => void;
  interface: string | undefined;
  autoAddSeenMessages: boolean | undefined;
  deleteUnconfiguredMessages: boolean | undefined;
}

interface MainSettingsState extends ioBroker.AdapterConfigMainSettings {
  interfaceError: string | null;
}

/**
 * Main apater settings.
 */
export class MainSettings extends React.PureComponent<MainSettingsProps, MainSettingsState> {

  constructor (props: MainSettingsProps) {
    super(props);

    this.state = this.validateState({
      interface: this.props.interface || '',
      interfaceError: null,
      autoAddSeenMessages: this.props.autoAddSeenMessages || false,
      deleteUnconfiguredMessages: this.props.deleteUnconfiguredMessages || false
    });
  }

  public render() : JSX.Element {
    return (
      <>
        <div className='row'>
          <div className='col s12 m4 l2'>
            <img src='canbus.png' className='logo' />
          </div>
        </div>
        <div className='row'>
          <InputText
            label={_('Interface')}
            className='s12 m6 l4'
            value={this.state.interface}
            onChange={(v) => this.handleChange('interface', v)}
            errorMsg={this.state.interfaceError}
          >
            <span>{_('e.g.')} <code>can0</code></span>
          </InputText>
        </div>
        <div className='row'>
          <InputCheckbox
            label={_('Auto add seen messages')}
            className='s12 m6'
            value={this.state.autoAddSeenMessages}
            onChange={(v) => this.handleChange('autoAddSeenMessages', v)}
          >
            <span >{_('Automatically add new messages to the list of our known messages when they are received.')}</span>
          </InputCheckbox>
          <InputCheckbox
            label={_('Delete unconfigured messages')}
            className='s12 m6'
            value={this.state.deleteUnconfiguredMessages}
            onChange={(v) => this.handleChange('deleteUnconfiguredMessages', v)}
          >
            <span >{_('Delete all objects of unconfigured messages on adapter startup.')}</span>
          </InputCheckbox>
        </div>
      </>
    );
  }

  /**
   * Submit changes to the parent component.
   */
  private onChange(): void {
    this.props.onChange({
      interface: this.state.interface,
      autoAddSeenMessages: this.state.autoAddSeenMessages,
      deleteUnconfiguredMessages: this.state.deleteUnconfiguredMessages
    });
  }

  /**
   * Handle changes from input components.
   * @param key The key of the changed state.
   * @param value The new value.
   */
  private handleChange<T extends keyof MainSettingsState>(key: T, value: MainSettingsState[T]): void {
    const newState = {
      [key]: value
    } as unknown as Pick<MainSettingsState, keyof MainSettingsState>;

    this.validateState(newState);

    this.setState(newState, () => {
      this.onChange();
    });
  }

  /**
   * Validate the state of this component.
   * This will trigger the `onValidate()` function of the parent component.
   * @param state The state to validate or `undefined` to use results of a previous validation.
   * @return The validated state object.
   */
  private validateState<T extends Partial<MainSettingsState>>(state: T = {} as T): T {
    let isValid = true;

    // check own states
    if (state.interface !== undefined) {
      // check this
      if (state.interface.match(INTERFACE_REGEXP)) {
        state.interfaceError = null;
      } else {
        state.interfaceError = _('Only allowed chars: %s', '0-9a-zA-Z-_/');
        isValid = false;
      }
    } else if (this.state?.interfaceError !== null) {
      // use result from previous check
      isValid = false;
    }

    this.props.onValidate(isValid);
    return state;
  }
}