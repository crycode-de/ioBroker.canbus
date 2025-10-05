import React from 'react';

import Grid from '@material-ui/core/Grid';

import I18n from '@iobroker/adapter-react/i18n';
import Logo from '@iobroker/adapter-react/Components/Logo';

import type { AppContext, CommonObj } from '../common';

import { InputCheckbox } from './input-checkbox';
import { InputText } from './input-text';
import { InputSelect } from './input-select';

import { INTERFACE_REGEXP, IP_REGEXP } from '../../../src/consts';

interface GeneralProps {
  /**
   * Will be called if any value changed.
   * @param attr Name of the changed attribute.
   * @param value The new value.
   */
  onChange: (attr: string, value: unknown) => void;

  /**
   * Will be called if the inputs are validated.
   * @param isValid If all inputs are valid or not.
   */
  onValidate: (isValid: boolean) => void;

  /**
   * Show an error message.
   */
  onError: (text: string | React.ReactElement) => void;

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

  /**
   * The common adapter options.
   */
  common: CommonObj;
}

interface GeneralState extends ioBroker.AdapterConfigMainSettings {
  /**
   * Error string to display for the interface option or `null` if no error.
   */
  interfaceError: string | null;

  /**
   * Error string to display for the ip option or `null` if no error.
   */
  ipError: string | null;

  /**
   * Error string to display for the port option or `null` if no error.
   */
  portError: string | null;
}

export class General extends React.Component<GeneralProps, GeneralState> {
  constructor (props: GeneralProps) {
    super(props);
    // native settings are our state
    this.state = this.validateState({
      autoAddSeenMessages: this.props.native.autoAddSeenMessages,
      deleteUnconfiguredMessages: this.props.native.deleteUnconfiguredMessages,
      interfaceType: this.props.native.interfaceType,
      interface: this.props.native.interface,
      ip: this.props.native.ip,
      port: this.props.native.port,
      interfaceError: null,
      ipError: null,
      portError: null,
      useRawStates: this.props.native.useRawStates,
      useRtrFlag: this.props.native.useRtrFlag,
    });
  }

  public render (): React.ReactNode {
    return (
      <>
        <Logo
          common={this.props.common}
          instance={this.props.context.instance}
          native={this.props.native}
          onError={this.props.onError}
          onLoad={this.props.setNative}
          classes={{
            buttons: '',
            logo: '',
          }}
        />
        <Grid container spacing={3}>
          <InputSelect
            xs={12}
            sm={6}
            md={4}
            lg={2}
            label={I18n.t('Interface type')}
            value={this.state.interfaceType}
            onChange={(v) => this.handleChange('interfaceType', v as ioBroker.AdapterConfig['interfaceType'])}
            options={{
              socketcan: I18n.t('socketcan'),
              'waveshare-can2eth': I18n.t('waveshare-can2eth'),
            }}
          >
            {I18n.t('Type of the CAN interface to use')}
          </InputSelect>
          {this.state.interfaceType === 'socketcan' && (
            <InputText
              xs={12}
              sm={12}
              md={6}
              lg={4}
              label={I18n.t('Interface')}
              value={this.state.interface}
              errorMsg={this.state.interfaceError}
              required
              onChange={(v) => this.handleChange('interface', v)}
            >
              {I18n.t('e.g.')} <code>can0</code>
            </InputText>
          )}
          {this.state.interfaceType === 'waveshare-can2eth' && (
            <>
              <InputText
                xs={12}
                sm={12}
                md={6}
                lg={4}
                label={I18n.t('IP address')}
                value={this.state.ip}
                errorMsg={this.state.ipError}
                required
                onChange={(v) => this.handleChange('ip', v)}
              >
                {I18n.t('e.g.')} <code>192.168.0.201</code>
              </InputText>
              <InputText
                xs={12}
                sm={12}
                md={6}
                lg={4}
                label={I18n.t('Port')}
                value={!isNaN(this.state.port) ? String(this.state.port) : ''}
                errorMsg={this.state.portError}
                required
                onChange={(v) => this.handleChange('port', parseInt(v, 10))}
              >
                {I18n.t('e.g.')} <code>20001</code>
              </InputText>
            </>
          )}
        </Grid>
        <Grid container spacing={3}>
          <InputCheckbox
            xs={12}
            sm={12}
            md={6}
            label={I18n.t('Auto add seen messages')}
            value={this.state.autoAddSeenMessages}
            onChange={(v) => this.handleChange('autoAddSeenMessages', v)}
          >
            {I18n.t('Automatically add new messages to the list of our known messages when they are received.')}
          </InputCheckbox>
          <InputCheckbox
            xs={12}
            sm={12}
            md={6}
            label={I18n.t('Delete unconfigured messages')}
            value={this.state.deleteUnconfiguredMessages}
            onChange={(v) => this.handleChange('deleteUnconfiguredMessages', v)}
          >
            {I18n.t('Delete all objects of unconfigured messages on adapter startup.')}
          </InputCheckbox>
        </Grid>
        <Grid container spacing={3}>
          <InputCheckbox
            xs={12}
            sm={12}
            md={6}
            label={I18n.t('Use raw states')}
            value={this.state.useRawStates}
            onChange={(v) => this.handleChange('useRawStates', v)}
          >
            {I18n.t('Use the raw states, which are updated with every received or sent message and can be used to send your own messages. This enables the usage in scripts, but may lead to a higher load on systems with a high message throughput.')}<br />
            <code>{this.props.context.adapterName}.{this.props.context.instance}.raw.received</code> {I18n.t('and')} <code>{this.props.context.adapterName}.{this.props.context.instance}.raw.send</code>
          </InputCheckbox>
          <InputCheckbox
            xs={12}
            sm={12}
            md={6}
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
      [key]: value,
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
    const interfaceType = state.interfaceType ?? this.state.interfaceType;

    if (interfaceType === 'socketcan') {
      // socketcan

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

    } else if (interfaceType === 'waveshare-can2eth') {
      // Waveshare CAN to Ethernet Server

      // check ip
      if (state.ip !== undefined) {
        // check this
        if (state.ip.match(IP_REGEXP)) {
          state.ipError = null;
        } else {
          state.ipError = I18n.t('Invalid IP address');
          isValid = false;
        }
      } else if (this.state?.ipError !== null) {
        // use result from previous check
        isValid = false;
      }

      // check port
      if (state.port !== undefined) {
        // check this
        if (typeof state.port === 'number' && state.port > 0 && state.port < 65536) {
          state.portError = null;
        } else {
          state.portError = I18n.t('Invalid port');
          isValid = false;
        }
      } else if (this.state?.portError !== null) {
        // use result from previous check
        isValid = false;
      }

    } else {
      // unknown interface type
      console.warn(`Unknown interface type "${interfaceType}"`);
      isValid = false;
    }

    this.props.onValidate(isValid);
    return state;
  }
}
