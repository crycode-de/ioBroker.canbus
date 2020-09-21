import { autobind } from 'core-decorators';
import * as React from 'react';

import { uuidv4 } from '../lib/helpers';

interface InputSelectProps {
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
   * The selected value of the input.
   */
  value: string;

  /**
   * Additional class names.
   * Default: `s12`
   */
  className?: string;

  /**
   * The options to select.
   * `key` -> `display value`
   */
  options: Record<string, string> | string[];

  /**
   * Array of options which should be disabled.
   */
  disabledOptions?: string[];

  /**
   * If the input element should be completeley disabled.
   */
  disabled?: boolean;
}

interface InputSelectState {
  id: string;
  value: string;
  options: Record<string, string>;
}

/**
 * A select input.
 */
export class InputSelect extends React.PureComponent<InputSelectProps, InputSelectState> {
  private selectElement: HTMLSelectElement | null | undefined;

  constructor(props: InputSelectProps) {
    super(props);

    let options: Record<string, string>;
    if (Array.isArray(this.props.options)) {
      options = {};
      this.props.options.forEach((o) => options[o] = o);
    } else {
      options = this.props.options;
    }

    this.state = {
      id: this.props.id || uuidv4(),
      value: this.props.value,
      options: options
    };
  }

  public componentDidMount (): void {
    if (this.selectElement) {
      M.FormSelect.init(this.selectElement);
    }
  }

  public componentDidUpdate (prevProps: InputSelectProps): void {
    if (prevProps.value !== this.props.value) {
      this.setState({
        value: this.props.value
      }, () => {
        if (this.selectElement) {
          M.FormSelect.init(this.selectElement);
        }
      });
    }

    if (this.selectElement && (prevProps.disabled !== this.props.disabled || JSON.stringify(prevProps.disabledOptions) !== JSON.stringify(this.props.disabledOptions))) {
      M.FormSelect.init(this.selectElement);
    }
  }

  public render(): JSX.Element {
    let className = 'input-field col s12';
    if (this.props.className) {
      className = 'input-field col ' + this.props.className;
    }
    return (
      <div className={className}>
        <select id={this.state.id} onChange={this.handleChange} disabled={this.props.disabled} ref={me => this.selectElement = me}>
          {Object.keys(this.state.options).map((key) => {
            const attrs: React.OptionHTMLAttributes<HTMLOptionElement> = {};
            if (key === this.state.value) {
              attrs.selected = true;
            }
            if (this.props.disabledOptions && this.props.disabledOptions.includes(key)) {
              attrs.disabled = true;
            }
            return <option key={key} value={key} {...attrs}>{this.state.options[key]}</option>;
          })}
        </select>
        <label htmlFor={this.state.id}>{this.props.label}</label>
        {this.props.children}
      </div>
    );
  }

  @autobind
  private handleChange (event: React.ChangeEvent<HTMLSelectElement>): void {
    const value = event.target.value;

    this.setState({
      value: value
    }, () => {
      this.props.onChange(this.state.value);
    });
  }
}