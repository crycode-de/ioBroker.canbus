import { autobind } from 'core-decorators';
import * as React from 'react';

import { uuidv4 } from '../lib/helpers';

interface InputTextProps {
  onChange: (newValue: string) => void;

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
   * The value of the input.
   */
  value: string;

  /**
   * Additional class names.
   * Default: `s12`
   */
  className?: string;

  /**
   * If the input element should be completeley disabled.
   */
  disabled?: boolean;

  /**
   * If the input should be a textarea.
   */
  area?: boolean;

  /**
   * Maximum length for the text.
   */
  maxLength?: number;

  /**
   * Placeholder to show if no value exists.
   */
  placeholder?: string;

  /**
   * Error message to display in case of e.g. validation errors.
   */
  errorMsg?: string | null;

  /**
   * Optional transforming of input.
   */
  transform?: 'lowerCase' | 'upperCase' | ((newValue: string, oldValue: string) => string);
}

interface InputTextState {
  id: string;
  value: string;
}

/**
 * A text input.
 */
export class InputText extends React.PureComponent<InputTextProps, InputTextState> {
  private textArea: HTMLTextAreaElement | null | undefined;

  constructor(props: InputTextProps) {
    super(props);

    this.state = {
      id: this.props.id || uuidv4(),
      value: this.props.value
    };
  }

  public componentDidMount (): void {
    M.updateTextFields();
  }

  public componentDidUpdate (prevProps: InputTextProps): void {
    if (prevProps.value !== this.props.value) {
      this.setState({
        value: this.props.value
      });
    }
  }

  public render(): JSX.Element {
    let className = 'input-field col s12';
    if (this.props.className) {
      className = 'input-field col ' + this.props.className;
    }
    return (
      <div className={className}>
        {this.props.area ?
          <textarea
            className='materialize-textarea custom-script'
            id={this.state.id}
            onChange={this.handleChange}
            placeholder={this.props.placeholder}
            disabled={this.props.disabled}
            ref={(me) => this.textArea = me}
          >{this.state.value}</textarea>
          :
          <input
            type='text'
            className='value'
            id={this.state.id}
            value={this.state.value}
            onChange={this.handleChange}
            maxLength={this.props.maxLength}
            placeholder={this.props.placeholder}
            disabled={this.props.disabled}
          />
        }
        <label htmlFor={this.state.id}>{this.props.label}</label>
        {this.props.errorMsg && <span className='error-msg'>{this.props.errorMsg}</span>}
        {this.props.children}
      </div>
    );
  }

  @autobind
  private handleChange (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
    let value = event.target.value;

    if (typeof this.props.transform === 'function') {
      value = this.props.transform(value, this.state.value);
    } else {
      switch (this.props.transform) {
        case 'lowerCase':
          value = value.toLowerCase();
          break;
        case 'upperCase':
          value = value.toUpperCase();
          break;
      }
    }

    this.setState({
      value
    }, () => {
      this.props.onChange(this.state.value);
    });
  }
}