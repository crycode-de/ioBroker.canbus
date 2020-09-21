import * as React from 'react';

import { Button } from './button';
import { InputText } from './input-text';
import { InputCheckbox } from './input-checkbox';
import { InputSelect } from './input-select';
import { InputBitmask } from './input-bitmask';

import { PARSER_ID_REGEXP, PARSER_ID_RESERVED } from '../../../src/consts';

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
  string: 'string'
};

interface ParserProps {
  onChange: (uuid: string, parser: ioBroker.AdapterConfigMessageParser) => void;
  onValidate: (uuid: string, isValid: boolean) => void;
  onDelete: (uuid: string) => void;
  msgId: string;
  uuid: string;
  parser: ioBroker.AdapterConfigMessageParser;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ParserState extends ioBroker.AdapterConfigMessageParser {
  idError: string | null;

  disabledDataOffsets: string[];
  disabledDataLengths: string[];
  disabledDataEncoding: boolean;
  disabledDataUnit: boolean;
}

/**
 * A single parser.
 */
export class Parser extends React.PureComponent<ParserProps, ParserState> {

  constructor (props: ParserProps) {
    super(props);

    this.state = this.validateState(this.updateDependedEletents({
      ...this.props.parser,
      idError: null,
      disabledDataLengths: [],
      disabledDataOffsets: [],
      disabledDataEncoding: false,
      disabledDataUnit: false
    }));
  }

  public render() : JSX.Element {
    return (
      <div className='parser-block'>
        <Button title={_('Remove')} onClick={() => this.props.onDelete(this.props.uuid)} iconName='delete' className='right-icon' />

        <div className='row'>
          <InputText
            label={_('Parser ID')}
            className='s6 m4 l2'
            value={this.state.id}
            onChange={(v) => this.handleChange('id', v)}
            errorMsg={this.state.idError}
            transform='lowerCase'
            maxLength={64}
          >
            <span><code>{adapter}.{instance}.{this.props.msgId || '<msgID>'}.{this.state.id || '<parserID>'}</code></span>
          </InputText>

          <InputText
            label={_('Name')}
            className='s6 m4 l2'
            value={this.state.name}
            onChange={(v) => this.handleChange('name', v)}
          >
            <span>{_('e.g.')} <code>{_('Temperature')}</code></span>
          </InputText>

          <InputSelect
            label={_('Data type')}
            className='s6 m4 l2'
            value={this.state.dataType}
            onChange={(v) => this.handleChange('dataType', v as ioBroker.AdapterConfigDataType)}
            options={DATA_TYPE_OPTIONS}
          />
          <InputSelect
            label={_('Offset')}
            className='s6 m2 l1'
            value={this.state.dataOffset.toString()}
            onChange={(v) => this.handleChange('dataOffset', parseInt(v, 10))}
            options={['0', '1', '2', '3', '4', '5', '6', '7']}
            disabledOptions={this.state.disabledDataOffsets}
          />
          <InputSelect
            label={_('Length')}
            className='s6 m2 l1'
            value={this.state.dataLength.toString()}
            onChange={(v) => this.handleChange('dataLength', parseInt(v, 10))}
            options={['1', '2', '3', '4', '5', '6', '7', '8']}
            disabledOptions={this.state.disabledDataLengths}
          />
          {!this.state.disabledDataEncoding &&
          <InputSelect
            label={_('Encoding')}
            className='s6 m2 l1'
            value={this.state.dataEncoding}
            onChange={(v) => this.handleChange('dataEncoding', v as ioBroker.AdapterConfigDataEncoding)}
            options={['latin1', 'utf8', 'utf16le']}
          />}

          {!this.state.disabledDataUnit &&
          <InputText
            label={_('Unit')}
            className='s6 m2 l1'
            value={this.state.dataUnit}
            onChange={(v) => this.handleChange('dataUnit', v)}
          >
            <span>{_('e.g.')} <code>°C</code></span>
          </InputText>}
        </div>

        {this.state.dataType === 'boolean' &&
        <div className='row'>
          <InputBitmask
            label={_('Boolean bitmask')}
            className='s6 m6 l5'
            bits={8}
            value={this.state.booleanMask}
            onChange={(v) => this.handleChange('booleanMask', v)}
          >
            <span dangerouslySetInnerHTML={{ __html: _('Bitmask to apply to detect/set a %s value. If no bits are selected any byte value greater than 0 will be interpreted as %s.', '<code>true</code>', '<code>true</code>')}} />
          </InputBitmask>

          <InputCheckbox
            label={_('Boolean invert')}
            className='s6 m6 l3'
            value={this.state.booleanInvert}
            onChange={(v) => this.handleChange('booleanInvert', v)}
          >
            <span>{_('Invert the boolean value')}</span>
          </InputCheckbox>
        </div>}
      </div>
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
      booleanInvert: this.state.booleanInvert
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
        state.dataUnit = '';
        break;
      case 'int8':
      case 'uint8':
        state.disabledDataOffsets = [];
        state.disabledDataLengths = ['2', '3', '4', '5', '6', '7', '8'];
        state.dataLength = 1;
        state.disabledDataEncoding = true;
        state.disabledDataUnit = false;
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
        break;
      case 'double64_be':
      case 'double64_le':
        state.disabledDataOffsets = ['1', '2', '3', '4', '5', '6', '7'];
        state.disabledDataLengths = ['1', '2', '3', '4', '5', '6', '7'];
        state.dataLength = 8;
        state.disabledDataEncoding = true;
        state.disabledDataUnit = false;
        break;
      case 'string':
        state.disabledDataOffsets = [];
        state.disabledDataLengths = [];
        state.disabledDataEncoding = false;
        state.disabledDataUnit = true;
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
        state.idError = _('This ID is reserved and can\'t be used');
        isValid = false;
      } else if (!state.id.match(PARSER_ID_REGEXP)) {
        state.idError = _('Only allowed chars: %s', '0-9a-z-_');
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