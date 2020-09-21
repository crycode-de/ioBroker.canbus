import { autobind } from 'core-decorators';
import * as React from 'react';

import { uuidv4 } from '../lib/helpers';

interface InputBitmaskProps {
  onChange: (newValue: number) => void;

  /**
   * Unique ID for this element.
   * If not set a UUID will be generated.
   */
  id?: string;

  /**
   * Label for this input.
   * Will be translatable.
   */
  label: string | JSX.Element;

  /**
   * Number of bits in this bitmask.
   */
  bits: number;

  /**
   * The value of the bitmask.
   */
  value: number;

  /**
   * Additional class names.
   * Default: `s12`
   */
  className?: string;
}

interface InputBitmaskState {
  id: string;
  value: number;
  bits: boolean[];
}

/**
 * Checkbox inputs for a bitmask.
 */
export class InputBitmask extends React.PureComponent<InputBitmaskProps, InputBitmaskState> {

  constructor(props: InputBitmaskProps) {
    super(props);

    const bits: boolean[] = [];
    for (let i=0; i < this.props.bits; i++) {
      bits[i] = ((this.props.value & (1<<i)) > 0)
    }

    this.state = {
      id: this.props.id || uuidv4(),
      value: this.props.value,
      bits: bits
    };
  }

  public componentDidUpdate (prevProps: InputBitmaskProps): void {
    if (prevProps.value !== this.props.value) {
      const bits: boolean[] = [];
      for (let i = 0; i < this.props.bits; i++) {
        bits[i] = ((this.props.value & (1 << i)) > 0)
      }
      this.setState({
        value: this.props.value,
        bits: bits
      });
    }
  }

  public render(): JSX.Element {
    let className = 'input-field-checkbox col s12';
    if (this.props.className) {
      className = 'input-field-checkbox col ' + this.props.className;
    }

    return (
      <div className={className}>
        <div className='bitmask-wrapper'>
          {this.state.bits.map((bitValue, idx) => {
            return (
              <label key={idx}>
                <input type='checkbox' checked={bitValue} onChange={() => this.changeBit(idx)} />
                <span>{idx}</span>
              </label>
            );
          })}
          {this.props.children && <>
            <br />
            {this.props.children}
          </>}
        </div>
        <label>{this.props.label}</label>
      </div>
    );
  }

  @autobind
  private changeBit (idx: number): void {
    const bits = [...this.state.bits];
    bits[idx] = !bits[idx];

    let value = 0;
    bits.forEach((b, i) => {
      if (b) {
        value |= (1<<i);
      }
    });

    this.setState({
      bits: bits,
      value: value
    }, () => {
      this.props.onChange(this.state.value);
    });
  }
}