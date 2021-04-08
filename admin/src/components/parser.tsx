import React from 'react';
import { autobind } from 'core-decorators';

import Grid from '@material-ui/core/Grid';
import Fab from '@material-ui/core/Fab';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import InfoIcon from '@material-ui/icons/Info';

import I18n from '@iobroker/adapter-react/i18n';

import { AppContext } from '../common';

import {
  ContentCopyIcon,
  ContentPasteIcon,
} from '../lib/icons';

import { internalClipboard } from '../lib/helpers';

import { InputText } from './input-text';
import { InputCheckbox } from './input-checkbox';
import { InputSelect } from './input-select';
import { InputBitmask } from './input-bitmask';

import {
  PARSER_ID_REGEXP,
  PARSER_ID_RESERVED,
  PARSER_COMMON_STATES_REGEXP,
} from '../../../src/consts';

/**
 * Data types to be selected for a parser.
 */
const DATA_TYPE_OPTIONS: Record<ioBroker.AdapterConfigDataType, string> = {
  int8: 'int8',
  uint8: 'uint8',
  int16_be: 'int16 BE',
  int16_le: 'int16 LE',
  uint16_be: 'uint16 BE',
  uint16_le: 'uint16 LE',
  int32_be: 'int32 BE',
  int32_le: 'int32 LE',
  uint32_be: 'uint32 BE',
  uint32_le: 'uint32 LE',
  float32_be: 'float32 BE',
  float32_le: 'float32 LE',
  double64_be: 'double64 BE',
  double64_le: 'double64 LE',
  boolean: 'boolean',
  string: 'string',
  custom: 'custom',
};

/**
 * Known state roles with some common roles first.
 * Taken from https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/stateroles.md at 2021-04-08
 */
const COMMON_ROLES: string[] = [
  'state',
  'button',
  'indicator',
  'level',
  'level.temperature',
  'switch',
  'switch.power',
  'switch.light',
  'text',
  'value',
  'value.temperature',

  'button.close.blind',
  'button.close.tilt',
  'button.fastforward',
  'button.fastreverse',
  'button.forward',
  'button.long',
  'button.mode.auto',
  'button.mode.manual',
  'button.mode.silent',
  'button.next',
  'button.open.blind',
  'button.open.door',
  'button.open.tilt',
  'button.open.window',
  'button.pause',
  'button.play',
  'button.press',
  'button.prev',
  'button.reverse',
  'button.start',
  'button.stop',
  'button.stop.tilt',
  'button.volume.down',
  'button.volume.up',
  'date',
  'date.end',
  'date.forecast.1',
  'date.start',
  'date.sunrise',
  'date.sunset',
  'dayofweek',
  'html',
  'indicator.alarm',
  'indicator.alarm.fire',
  'indicator.alarm.flood',
  'indicator.alarm.health',
  'indicator.alarm.secure',
  'indicator.connected',
  'indicator.lowbat',
  'indicator.maintenance',
  'indicator.maintenance.alarm',
  'indicator.maintenance.lowbat',
  'indicator.maintenance.unreach',
  'indicator.maintenance.waste',
  'indicator.reachable',
  'indicator.working',
  'info.address',
  'info.display',
  'info.ip',
  'info.mac',
  'info.name',
  'info.port',
  'info.standby',
  'info.status',
  'json',
  'level.bass',
  'level.blind',
  'level.co2',
  'level.color.blue',
  'level.color.green',
  'level.color.hue',
  'level.color.luminance',
  'level.color.red',
  'level.color.rgb',
  'level.color.saturation',
  'level.color.temperature',
  'level.color.white',
  'level.curtain',
  'level.dimmer',
  'level.mode.cleanup',
  'level.mode.fan',
  'level.mode.swing',
  'level.mode.thermostat',
  'level.mode.work',
  'level.tilt',
  'level.timer',
  'level.timer.sleep',
  'level.treble',
  'level.valve',
  'level.volume',
  'level.volume.group',
  'list',
  'location',
  'media.add',
  'media.album',
  'media.artist',
  'media.bitrate',
  'media.broadcastDate',
  'media.browser',
  'media.clear',
  'media.content',
  'media.cover',
  'media.cover.big',
  'media.cover.small',
  'media.date',
  'media.duration',
  'media.duration.text',
  'media.elapsed',
  'media.elapsed.text',
  'media.episode',
  'media.genre',
  'media.input',
  'media.jump',
  'media.link',
  'media.mode.repeat',
  'media.mode.shuffle',
  'media.mute',
  'media.mute.group',
  'media.playid',
  'media.playlist',
  'media.season',
  'media.seek',
  'media.state',
  'media.title',
  'media.title.next',
  'media.track',
  'media.tts',
  'media.url',
  'media.url.announcement',
  'sensor.alarm',
  'sensor.alarm.fire',
  'sensor.alarm.flood',
  'sensor.alarm.power',
  'sensor.alarm.secure',
  'sensor.door',
  'sensor.light',
  'sensor.lock',
  'sensor.motion',
  'sensor.noise',
  'sensor.rain',
  'sensor.window',
  'switch.boost',
  'switch.comfort',
  'switch.enable',
  'switch.lock',
  'switch.lock.door',
  'switch.lock.window',
  'switch.mode.auto',
  'switch.mode.color',
  'switch.mode.manual',
  'switch.mode.moonlight',
  'switch.mode.silent',
  'switch.pause',
  'switch.power.zone',
  'text.phone',
  'text.url',
  'url',
  'url.audio',
  'url.blank',
  'url.cam',
  'url.icon',
  'url.same',
  'value.battery',
  'value.blind',
  'value.blood.sugar',
  'value.brightness',
  'value.clouds',
  'value.current',
  'value.curtain',
  'value.default',
  'value.direction',
  'value.direction.max.wind',
  'value.direction.min.wind',
  'value.direction.wind',
  'value.direction.wind.forecast.0',
  'value.direction.wind.forecast.1',
  'value.distance',
  'value.distance.visibility',
  'value.fill',
  'value.gps',
  'value.gps.elevation',
  'value.gps.latitude',
  'value.gps.longitude',
  'value.health.bmi',
  'value.health.bpm',
  'value.health.calories',
  'value.health.fat',
  'value.health.steps',
  'value.health.weight',
  'value.humidity',
  'value.humidity.max',
  'value.humidity.min',
  'value.interval',
  'value.lock',
  'value.max',
  'value.min',
  'value.power.consumption',
  'value.precipitation',
  'value.precipitation.day.forecast.0',
  'value.precipitation.forecast.0',
  'value.precipitation.forecast.1',
  'value.precipitation.hour',
  'value.precipitation.night.forecast.0',
  'value.precipitation.today',
  'value.pressure',
  'value.pressure.forecast.0',
  'value.pressure.forecast.1',
  'value.radiation',
  'value.rain',
  'value.rain.hour',
  'value.rain.today',
  'value.severity',
  'value.snow',
  'value.snow.hour',
  'value.snow.today',
  'value.snowline',
  'value.speed',
  'value.speed.max.wind',
  'value.speed.min.wind',
  'value.speed.wind',
  'value.speed.wind.forecast.0',
  'value.speed.wind.forecast.1',
  'value.speed.wind.gust',
  'value.state',
  'value.sun.azimuth',
  'value.sun.elevation',
  'value.temperature.dewpoint',
  'value.temperature.feelslike',
  'value.temperature.max',
  'value.temperature.max.forecast.0',
  'value.temperature.max.forecast.1',
  'value.temperature.min',
  'value.temperature.min.forecast.0',
  'value.temperature.min.forecast.1',
  'value.temperature.windchill',
  'value.tilt',
  'value.time',
  'value.uv',
  'value.valve',
  'value.voltage',
  'value.warning',
  'value.waste',
  'value.water',
  'value.window',
  'weather.chart.url',
  'weather.chart.url.forecast',
  'weather.direction.wind',
  'weather.direction.wind.forecast.0',
  'weather.html',
  'weather.icon',
  'weather.icon.forecast.1',
  'weather.icon.name',
  'weather.icon.wind',
  'weather.json',
  'weather.state',
  'weather.state.forecast.0',
  'weather.state.forecast.1',
  'weather.title',
  'weather.title.forecast.0',
  'weather.title.short',
  'weather.type',
];

interface ParserProps {
  /**
   * The parser was changed.
   */
  onChange: (uuid: string, parser: ioBroker.AdapterConfigMessageParser) => void;

  /**
   * The parser was validated.
   */
  onValidate: (uuid: string, isValid: boolean) => void;

  /**
   * The delete button was clicked.
   * If defined, an remove button will be rendered in the top right corner.
   */
  onDelete?: (uuid: string) => void;

  /**
   * Show a toast message.
   */
  showToast?: (text: string) => void;

  /**
   * The app context.
   */
  context: AppContext;

  /**
   * ID of the message to which the parser belongs.
   * This is NOT the UUID!
   * Used to display the full parser ID.
   */
  msgId: string;

  /**
   * UUID of the parser.
   */
  uuid: string;

  /**
   * Config of this parser.
   */
  config: ioBroker.AdapterConfigMessageParser;

  /**
   * Classes to apply for some elements.
   */
  classes: Record<string, string>;

  /**
   * If the parser should be readonly.
   */
  readonly?: boolean;
}

interface ParserState extends ioBroker.AdapterConfigMessageParser {
  /**
   * Error message for the ID input.
   */
  idError: string | null;

  /**
   * Error message for the commonStates input.
   */
  commonStatesError: string | null;

  disabledDataOffsets: string[];
  disabledDataLengths: string[];
  disabledDataEncoding: boolean;
  disabledDataUnit: boolean;
  disabledDataOffsetAndLength: boolean;
}

/**
 * A single parser.
 */
export class Parser extends React.PureComponent<ParserProps, ParserState> {

  constructor (props: ParserProps) {
    super(props);

    this.state = this.validateState(this.updateDependedElements({
      ...this.props.config,
      idError: null,
      commonStatesError: null,
      disabledDataLengths: [],
      disabledDataOffsets: [],
      disabledDataEncoding: false,
      disabledDataUnit: false,
      disabledDataOffsetAndLength: false,
    }));
  }

  public render(): React.ReactNode {
    const { classes } = this.props;
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
            disabled={this.props.readonly || !internalClipboard.parser}
          >
            <ContentPasteIcon />
          </Fab>
          <Fab
            size='small'
            color='primary'
            aria-label='delete'
            title={I18n.t('Remove')}
            onClick={() => this.props.onDelete && this.props.onDelete(this.props.uuid)}
            disabled={this.props.readonly || !this.props.onDelete}
          >
            <DeleteIcon />
          </Fab>
        </div>

        <Grid container spacing={3}>
          <InputText
            sm={6} md={4} lg={4}
            label={I18n.t('Parser ID')}
            value={this.state.id}
            disabled={this.props.readonly}
            onChange={(v) => this.handleChange('id', v)}
            errorMsg={this.state.idError}
            transform='lowerCase'
            maxLength={64}
          >
            <code>{this.props.context.adapterName}.{this.props.context.instance}.{this.props.msgId || '<msgID>'}.{this.state.id || '<parserID>'}</code>
          </InputText>

          <InputText
            sm={6} md={6} lg={4}
            label={I18n.t('Name')}
            value={this.state.name}
            disabled={this.props.readonly}
            onChange={(v) => this.handleChange('name', v)}
          >
            {I18n.t('e.g.')} <code>{I18n.t('Temperature')}</code>
          </InputText>
        </Grid>

        <Grid container spacing={3}>
          <InputSelect
            sm={6} md={4} lg={2}
            label={I18n.t('Data type')}
            value={this.state.dataType}
            disabled={this.props.readonly}
            onChange={(v) => this.handleChange('dataType', v as ioBroker.AdapterConfigDataType)}
            options={DATA_TYPE_OPTIONS}
          >
            {I18n.t('Data type in the can message')}
          </InputSelect>

          {this.state.dataType === 'custom' &&
            <InputSelect
              sm={6} md={4} lg={2}
              label={I18n.t('Data type')}
              value={this.state.customDataType}
              disabled={this.props.readonly}
              onChange={(v) => this.handleChange('customDataType', v as ioBroker.CommonType)}
              options={['boolean', 'number', 'string', 'mixed']}
            >
              {I18n.t('Data type in ioBroker')}
            </InputSelect>
          }

          {!this.state.disabledDataOffsetAndLength && <>
            <InputSelect
              sm={6} md={2} lg={1}
              label={I18n.t('Offset')}
              value={this.state.dataOffset.toString()}
              disabled={this.props.readonly}
              onChange={(v) => this.handleChange('dataOffset', parseInt(v, 10))}
              options={['0', '1', '2', '3', '4', '5', '6', '7']}
              disabledOptions={this.state.disabledDataOffsets}
            />
            <InputSelect
              sm={6} md={2} lg={1}
              label={I18n.t('Length')}
              value={this.state.dataLength.toString()}
              disabled={this.props.readonly}
              onChange={(v) => this.handleChange('dataLength', parseInt(v, 10))}
              options={['1', '2', '3', '4', '5', '6', '7', '8']}
              disabledOptions={this.state.disabledDataLengths}
            />
          </>}
          {!this.state.disabledDataEncoding &&
            <InputSelect
              sm={6} md={2} lg={1}
              label={I18n.t('Encoding')}
              value={this.state.dataEncoding}
              disabled={this.props.readonly}
              onChange={(v) => this.handleChange('dataEncoding', v as ioBroker.AdapterConfigDataEncoding)}
              options={['ascii', 'base64', 'hex', 'latin1', 'utf8', 'utf16le']}
            />
          }
          {!this.state.disabledDataUnit &&
            <InputText
              sm={6} md={2} lg={1}
              label={I18n.t('Unit')}
              value={this.state.dataUnit}
              disabled={this.props.readonly}
              onChange={(v) => this.handleChange('dataUnit', v)}
            >
              {I18n.t('e.g.')} <code>°C</code>
            </InputText>
          }
          <InputText
            sm={6} md={4} lg={3}
            label={I18n.t('Role')}
            value={this.state.commonRole}
            disabled={this.props.readonly}
            onChange={(v) => this.handleChange('commonRole', v)}
            autoCompleteOptions={COMMON_ROLES}
          >
            {I18n.t('Select a suitable role for the ioBroker state or just use "state" if you are not sure.')}
            <IconButton
              color='primary'
              size='small'
              title={I18n.t('Information about the state roles in ioBroker on GitHub')}
              onClick={() => window.open('https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/stateroles.md')}
            >
              <InfoIcon fontSize='inherit' />
            </IconButton>
          </InputText>
          <InputCheckbox
            sm={6} md={4} lg={3}
            label={I18n.t('Define possible states')}
            value={!!this.state.commonStates}
            disabled={this.props.readonly}
            onChange={(v) => this.handleChange('commonStates', v ? '' : false)}
          >
            {I18n.t('Setup a list of predefined state values')}
          </InputCheckbox>
        </Grid>

        {typeof this.state.commonStates === 'string' &&
          <Grid container spacing={3}>
            <InputText
              sm={12} md={12} lg={12}
              label={I18n.t('Possible states')}
              value={this.state.commonStates}
              disabled={this.props.readonly}
              onChange={(v) => this.handleChange('commonStates', v)}
              errorMsg={this.state.commonStatesError}
            >
              {I18n.t('Comma separated list of real values and display values. Example: 0=Off,1=On,2=Auto')}
            </InputText>
          </Grid>
        }

        {this.state.dataType === 'boolean' &&
          <Grid container spacing={3}>
            <InputBitmask
              sm={12} md={12} lg={8}
              label={I18n.t('Boolean bitmask')}
              bits={8}
              value={this.state.booleanMask}
              disabled={this.props.readonly}
              onChange={(v) => this.handleChange('booleanMask', v)}
            >
              <span dangerouslySetInnerHTML={{ __html: I18n.t('Bitmask to apply to detect/set a %s value. If no bits are selected any byte value greater than 0 will be interpreted as %s.', '<code>true</code>', '<code>true</code>') }} />
            </InputBitmask>

            <InputCheckbox
              sm={12} md={6} lg={3}
              label={I18n.t('Boolean invert')}
              value={this.state.booleanInvert}
              disabled={this.props.readonly}
              onChange={(v) => this.handleChange('booleanInvert', v)}
            >
              {I18n.t('Invert the boolean value')}
            </InputCheckbox>
          </Grid>
        }

        {this.state.dataType === 'custom' &&
          <Grid container spacing={3}>
            <InputText
              sm={12} md={6}
              label={I18n.t('Custom script read')}
              multiline={true}
              value={this.state.customScriptRead}
              disabled={this.props.readonly}
              onChange={(v) => this.handleChange('customScriptRead', v)}
              placeholder='// example:&#10;value = buffer[0] + buffer[1];'
            >
              <span dangerouslySetInnerHTML={{ __html: I18n.t('Script to read the value from the buffer. The buffer is available as %s and the value has to be written into %s.', '<code>buffer</code>', '<code>value</code>') }}></span>
            </InputText>
            <InputText
              sm={12} md={6}
              label={I18n.t('Custom script write')}
              multiline={true}
              value={this.state.customScriptWrite}
              disabled={this.props.readonly}
              onChange={(v) => this.handleChange('customScriptWrite', v)}
              placeholder='// example:&#10;buffer[0] = value & 0xff;&#10;buffer[1] = (value >> 8);'
            >
              <span dangerouslySetInnerHTML={{ __html: I18n.t('Script to write the value to the buffer. The buffer is available as %s and the value as %s.', '<code>buffer</code>', '<code>value</code>') }}></span>
            </InputText>
          </Grid>
        }
      </>
    );
  }

  /**
   * Submit changes to the parent component.
   */
  private onChange(): void {
    this.props.onChange(this.props.uuid, {
      id: this.state.id,
      name: this.state.name,
      dataType: this.state.dataType,
      dataLength: this.state.dataLength,
      dataOffset: this.state.dataOffset,
      dataUnit: this.state.dataUnit,
      dataEncoding: this.state.dataEncoding,
      booleanMask: this.state.booleanMask,
      booleanInvert: this.state.booleanInvert,
      customScriptRead: this.state.customScriptRead,
      customScriptWrite: this.state.customScriptWrite,
      customDataType: this.state.customDataType,
      commonRole: this.state.commonRole,
      commonStates: this.state.commonStates,
    });
  }

  /**
   * Handler for changed inputs.
   * @param key Key of the changed state
   * @param value The new value
   */
  private handleChange<T extends keyof ParserState>(key: T, value: ParserState[T]): void {
    const newState = {
      [key]: value
    } as unknown as Pick<ParserState, keyof ParserState>;

    this.updateDependedElements(newState);

    this.validateState(newState);

    this.setState(newState, () => {
      this.onChange();
    });
  }

  /**
   * Update some elements depending on the current state.
   * This will e.g. enable/disable options in selects.
   * @param state The state to use for detection.
   * @return The updated state with the options for the depended elements set.
   */
  private updateDependedElements<T extends Partial<ParserState>>(state: T): T {
    const dataType = state.dataType || this.state?.dataType || 'uint8';
    switch (dataType) {
      case 'boolean':
        state.disabledDataOffsets = [];
        state.disabledDataLengths = ['2', '3', '4', '5', '6', '7', '8'];
        state.dataLength = 1;
        state.disabledDataEncoding = true;
        state.disabledDataUnit = true;
        state.disabledDataOffsetAndLength = false;
        state.dataUnit = '';
        break;
      case 'int8':
      case 'uint8':
        state.disabledDataOffsets = [];
        state.disabledDataLengths = ['2', '3', '4', '5', '6', '7', '8'];
        state.dataLength = 1;
        state.disabledDataEncoding = true;
        state.disabledDataUnit = false;
        state.disabledDataOffsetAndLength = false;
        break;
      case 'int16_be':
      case 'int16_le':
      case 'uint16_be':
      case 'uint16_le':
        state.disabledDataOffsets = ['7'];
        state.disabledDataLengths = ['1', '3', '4', '5', '6', '7', '8'];
        state.dataLength = 2;
        state.disabledDataEncoding = true;
        state.disabledDataUnit = false;
        state.disabledDataOffsetAndLength = false;
        break;
      case 'int32_be':
      case 'int32_le':
      case 'uint32_be':
      case 'uint32_le':
      case 'float32_be':
      case 'float32_le':
        state.disabledDataOffsets = ['5', '6', '7'];
        state.disabledDataLengths = ['1', '2', '3', '5', '6', '7', '8'];
        state.dataLength = 4;
        state.disabledDataEncoding = true;
        state.disabledDataUnit = false;
        state.disabledDataOffsetAndLength = false;
        break;
      case 'double64_be':
      case 'double64_le':
        state.disabledDataOffsets = ['1', '2', '3', '4', '5', '6', '7'];
        state.disabledDataLengths = ['1', '2', '3', '4', '5', '6', '7'];
        state.dataLength = 8;
        state.disabledDataEncoding = true;
        state.disabledDataUnit = false;
        state.disabledDataOffsetAndLength = false;
        break;
      case 'string':
        state.disabledDataOffsets = [];
        state.disabledDataLengths = [];
        state.disabledDataEncoding = false;
        state.disabledDataUnit = true;
        state.disabledDataOffsetAndLength = false;
        state.dataUnit = '';

        // disable data lengths depending on the selected offset
        const dataOffset = state.dataOffset !== undefined ? state.dataOffset : this.state.dataOffset;
        const dataLength = state.dataLength !== undefined ? state.dataLength : this.state.dataLength;
        if ((dataLength + dataOffset) > 8) {
          state.dataLength = 8 - dataOffset;
        }
        for (let i = 1; i<=8; i++) {
          if (i + dataOffset > 8) {
            state.disabledDataLengths.push(i.toString());
          }
        }
        break;
      case 'custom':
        state.disabledDataOffsets = [];
        state.disabledDataLengths = [];
        state.dataOffset = 0;
        state.dataLength = 8;
        state.disabledDataEncoding = true;
        state.disabledDataUnit = false;
        state.disabledDataOffsetAndLength = true;
        break;
    }

    return state;
  }

  /**
   * Validate the state.
   * If no state is given this will use the previous results.
   * @param state The state to validate.
   */
  private validateState<T extends Partial<ParserState>>(state: T): T {
    let isValid = true;

    // check the ID
    if (state.id !== undefined) {
      if (PARSER_ID_RESERVED.includes(state.id)) {
        state.idError = I18n.t('This ID is reserved and can\'t be used');
        isValid = false;
      } else if (!state.id.match(PARSER_ID_REGEXP)) {
        state.idError = I18n.t('Only allowed chars: %s', '0-9a-z-_');
        isValid = false;
      } else {
        state.idError = null;
      }
    } else if (this.state?.idError !== null) {
      // use result from previous check
      isValid = false;
    }

    // check the commonStates
    if (state.commonStates !== undefined) {
      if (state.commonStates !== false && !state.commonStates.match(PARSER_COMMON_STATES_REGEXP)) {
        state.commonStatesError = I18n.t('Invalid format! Please use the format value=text,value=text,...');
        isValid = false;
      } else {
        state.commonStatesError = null;
      }
    } else if (this.state?.commonStatesError) {
      // use result from previous check
      isValid = false;
    }

    this.props.onValidate(this.props.uuid, isValid);
    return state;
  }

  /**
   * Copy the current configuration (the state) into the internal clipboard.
   */
  @autobind
  private copy (): void {
    internalClipboard.parser = JSON.stringify(this.state);

    if (this.props.showToast) {
      this.props.showToast(I18n.t('Parser configuration copied. Use the paste button to paste this configuration to an other parser.'));
    }
  }

  /**
   * Load the configuration (the state) from the internal clipboard.
   */
  @autobind
  private paste (): void {
    if (!internalClipboard.parser) {
      if (this.props.showToast) {
        this.props.showToast(I18n.t('Nothing to paste. Please use the copy button first.'));
      }
      return;
    }

    try {
      const ps: ParserState = JSON.parse(internalClipboard.parser);

      this.setState(this.validateState({
        ...ps
      }), () => {
        this.onChange();
        if (this.props.showToast) {
          this.props.showToast(I18n.t('Pasted'));
        }
      });
    } catch (err) {
      if (this.props.showToast) {
        this.props.showToast(I18n.t('Error while pasting: %s', err.toString()));
      }
    }
  }

}