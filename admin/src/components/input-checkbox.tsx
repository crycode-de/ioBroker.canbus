import React from 'react';

import Grid, { GridSize } from '@material-ui/core/Grid';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Checkbox from '@material-ui/core/Checkbox';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';

interface InputCheckboxProps {
  onChange: (newValue: boolean) => void;

  /**
   * Label for this input.
   */
  label: string;

  /**
   * The value of the input.
   */
  value: boolean;

  /**
   * If the input element should be completeley disabled.
   */
  disabled?: boolean;
}

interface InputCheckboxState {
  value: boolean;
}

/**
 * A single checkbox input.
 */
export class InputCheckbox extends React.PureComponent<Partial<Record<Breakpoint, boolean | GridSize>> & InputCheckboxProps, InputCheckboxState> {

  constructor(props: InputCheckboxProps) {
    super(props);

    this.state = {
      value: this.props.value
    };
  }

  public componentDidUpdate (prevProps: InputCheckboxProps): void {
    if (prevProps.value !== this.props.value) {
      this.setState({
        value: this.props.value
      });
    }
  }

  public render(): JSX.Element {
    return (
      <Grid item xs={this.props.xs} sm={this.props.sm} md={this.props.md} lg={this.props.lg} xl={this.props.xl}>
        <FormControl>
          <FormControlLabel
            control={<Checkbox checked={this.state.value} disabled={this.props.disabled} onChange={(e) => this.handleChange(e.target.checked)} />}
            label={this.props.label}
          />

          {this.props.children && <FormHelperText>{this.props.children}</FormHelperText>}
        </FormControl>
      </Grid>
    );
  }

  private handleChange (checked: boolean): void {
    this.setState({
      value: checked
    }, () => {
      this.props.onChange(this.state.value);
    });
  }
}