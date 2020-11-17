import React from 'react';

import Grid from '@material-ui/core/Grid';
import Logo from '@iobroker/adapter-react/Components/Logo';

import I18n from '@iobroker/adapter-react/i18n';
import { AppContext } from '../common';

import { InputCheckbox } from './input-checkbox';
import { InputText } from './input-text';

import { INTERFACE_REGEXP } from '../../../src/consts';

interface GeneralProps {
  /**
   * Will be called if any value changed.
   * @param attr Name of the changed attribute.
   * @param value The new value.
   */
  onChange: (attr: string, value: any) => void;

  /**
   * Will be called if the inputs are validated.
   * @param isValid If all inputs are valid or not.
   */
  onValidate: (isValid: boolean) => void;

  /**
   * The app context.
   */
  context: AppContext;

  /**
   * The native adapter config.
   */
  native: ioBroker.AdapterConfig;

  /**
   * The common adapter options.
   */
  common: (ioBroker.StateCommon & Record<string, any>) | (ioBroker.ChannelCommon & Record<string, any>) | (ioBroker.DeviceCommon & Record<string, any>) | (ioBroker.OtherCommon & Record<string, any>) | (ioBroker.EnumCommon & Record<string, any>);
}

interface GeneralState extends ioBroker.AdapterConfigMainSettings {
  /**
   * Error string to display for the interface option or `null` if no error.
   */
  interfaceError: string | null;
}

export class General extends React.Component<GeneralProps, GeneralState> {
  constructor(props: GeneralProps) {
    super(props);
    // native settings are our state
    this.state = this.validateState({
      ...props.native,
      interfaceError: null
    });
  }

  public render(): React.ReactNode {
    return (
      <>
        <Logo
          common={this.props.common}
          native={this.props.native}
          instance={this.props.context.instance}
          classes={{} as any}
        />
        <Grid container spacing={3}>
          <InputText
            xs={12} sm={12} md={6} lg={4}
            label={I18n.t('Interface')}
            value={this.state.interface}
            errorMsg={this.state.interfaceError}
            required
            onChange={(v) => this.handleChange('interface', v)}
          >
            {I18n.t('e.g.')} <code>can0</code>
          </InputText>
        </Grid>
        <Grid container spacing={3}>
          <InputCheckbox
            sm={12} md={6}
            label={I18n.t('Auto add seen messages')}
            value={this.state.autoAddSeenMessages}
            onChange={(v) => this.handleChange('autoAddSeenMessages', v)}
          >
            {I18n.t('Automatically add new messages to the list of our known messages when they are received.')}
          </InputCheckbox>
          <InputCheckbox
            sm={12} md={6}
            label={I18n.t('Delete unconfigured messages')}
            value={this.state.deleteUnconfiguredMessages}
            onChange={(v) => this.handleChange('deleteUnconfiguredMessages', v)}
          >
            {I18n.t('Delete all objects of unconfigured messages on adapter startup.')}
          </InputCheckbox>
        </Grid>
        <Grid container spacing={3}>
          <InputCheckbox
            sm={12} md={6}
            label={I18n.t('Use raw states')}
            value={this.state.useRawStates}
            onChange={(v) => this.handleChange('useRawStates', v)}
          >
            {I18n.t('Use the raw states, which are updated with every received or sent message and can be used to send your own messages. This enables the usage in scripts, but may lead to a higher load on systems with a high message throughput.')}<br />
            <code>{this.props.context.adapterName}.{this.props.context.instance}.raw.received</code> {I18n.t('and')} <code>{this.props.context.adapterName}.{this.props.context.instance}.raw.send</code>
          </InputCheckbox>
          <InputCheckbox
            sm={12} md={6}
            label={I18n.t('Use rtr flag')}
            value={this.state.useRtrFlag}
            onChange={(v) => this.handleChange('useRtrFlag', v)}
          >
            {I18n.t('Add an additional Remote Transmission Request (rtr) state on each message.')}
          </InputCheckbox>
        </Grid>
      </>
    );
  }

  /**
   * Handler for changed inputs.
   * @param key Key of the changed state
   * @param value The new value
   */
  private handleChange<T extends keyof GeneralState>(key: T, value: GeneralState[T]): void {
    const newState = {
      [key]: value
    } as unknown as Pick<GeneralState, keyof GeneralState>;

    this.validateState(newState);

    this.setState(newState, () => {
      this.props.onChange(key, value);
    });
  }

  /**
   * Validate the state of this component.
   * This will trigger the `onValidate()` function of the parent component.
   * @param state The state to validate or `undefined` to use results of a previous validation.
   * @return The validated state object.
   */
  private validateState<T extends Partial<GeneralState>>(state: T = {} as T): T {
    let isValid = true;

    // check own states
    if (state.interface !== undefined) {
      // check this
      if (state.interface.match(INTERFACE_REGEXP)) {
        state.interfaceError = null;
      } else {
        state.interfaceError = I18n.t('Only allowed chars: %s', '0-9a-zA-Z-_/');
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
