import * as React from 'react';

import {
  Grid,
  FormControl,
  FormHelperText,
  Select,
  MenuItem,
  InputLabel
} from '@material-ui/core';
import { GridSize } from '@material-ui/core/Grid';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';

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
export class InputSelect extends React.PureComponent<Partial<Record<Breakpoint, boolean | GridSize>> & InputSelectProps, InputSelectState> {

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

  public componentDidUpdate (prevProps: InputSelectProps): void {
    if (prevProps.value !== this.props.value) {
      this.setState({
        value: this.props.value
      });
    }
  }

  public render(): JSX.Element {
    return (
      <Grid item xs={this.props.xs} sm={this.props.sm} md={this.props.md} lg={this.props.lg} xl={this.props.xl}>
        <FormControl fullWidth>
          <InputLabel id={`${this.state.id}_label`}>{this.props.label}</InputLabel>
          <Select
            id={this.state.id}
            labelId={`${this.state.id}_label`}
            value={this.state.value}
            fullWidth
            disabled={this.props.disabled}
            onChange={(e) => this.handleChange(e.target.value as string)}
          >
            {Object.keys(this.state.options).map((k) => (
              <MenuItem
                key={k}
                value={k}
                disabled={this.props.disabledOptions && this.props.disabledOptions.includes(k)}
              >{this.state.options[k]}</MenuItem>
            ))}
          </Select>

          {this.props.children && <FormHelperText>{this.props.children}</FormHelperText>}
        </FormControl>
      </Grid>
    );
  }

  private handleChange (value: string): void {
    this.setState({
      value: value
    }, () => {
      this.props.onChange(this.state.value);
    });
  }
}