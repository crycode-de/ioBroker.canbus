import React from 'react';

import Grid from '@material-ui/core/Grid';
import Fab from '@material-ui/core/Fab';
import DeleteIcon from '@material-ui/icons/Delete'

import I18n from '@iobroker/adapter-react/i18n';

import { InputText } from './input-text';
import { InputCheckbox } from './input-checkbox';
import { InputSelect } from './input-select';
import { InputBitmask } from './input-bitmask';

import { PARSER_ID_REGEXP, PARSER_ID_RESERVED } from '../../../src/consts';
import { AppContext } from '../common';

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
  custom: 'custom'
};

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

    this.state = this.validateState(this.updateDependedEletents({
      ...this.props.config,
      idError: null,
      disabledDataLengths: [],
      disabledDataOffsets: [],
      disabledDataEncoding: false,
      disabledDataUnit: false,
      disabledDataOffsetAndLength: false
    }));
  }

  public render(): React.ReactNode {
    const { classes } = this.props;
    return (
      <>
        {this.props.onDelete && (
          <Fab
            size='small'
            color='primary'
            aria-label='delete'
            className={classes.fabTopRight}
            title={I18n.t('Remove')}
            onClick={() => this.props.onDelete && this.props.onDelete(this.props.uuid)}
          >
            <DeleteIcon />
          </Fab>
        )}

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
          />

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
        </Grid>

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
      customScriptWrite: this.state.customScriptWrite
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

    this.updateDependedEletents(newState);

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
  private updateDependedEletents<T extends Partial<ParserState>>(state: T): T {
    const dataType = state.dataType || this.state.dataType;
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
    if (state.id !== undefined) {
      // check this
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

    this.props.onValidate(this.props.uuid, isValid);
    return state;
  }
}