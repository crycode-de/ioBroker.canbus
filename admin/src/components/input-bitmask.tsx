import React from 'react';

import Grid, { GridSize } from '@material-ui/core/Grid';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Checkbox from '@material-ui/core/Checkbox';
import InputLabel from '@material-ui/core/InputLabel';

import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';

interface InputBitmaskProps {
  onChange: (newValue: number) => void;

  /**
   * Label for this input.
   */
  label: string;

  /**
   * Number of bits in this bitmask.
   */
  bits: number;

  /**
   * The value of the bitmask.
   */
  value: number;

  /**
   * If the input element should be completeley disabled.
   */
  disabled?: boolean;
}

interface InputBitmaskState {
  /**
   * The current value.
   */
  value: number;

  /**
   * The currents bit state.
   */
  bits: boolean[];
}

/**
 * Checkbox inputs for a bitmask.
 */
export class InputBitmask extends React.PureComponent<Partial<Record<Breakpoint, boolean | GridSize>> & InputBitmaskProps, InputBitmaskState> {

  constructor (props: InputBitmaskProps) {
    super(props);

    const bits: boolean[] = [];
    for (let i = 0; i < this.props.bits; i++) {
      bits[i] = ((this.props.value & (1 << i)) > 0);
    }

    this.state = {
      value: this.props.value,
      bits: bits,
    };
  }

  public componentDidUpdate (prevProps: InputBitmaskProps): void {
    if (prevProps.value !== this.props.value) {
      const bits: boolean[] = [];
      for (let i = 0; i < this.props.bits; i++) {
        bits[i] = ((this.props.value & (1 << i)) > 0);
      }
      this.setState({
        value: this.props.value,
        bits: bits,
      });
    }
  }

  public render (): React.ReactNode {
    return (
      <Grid item xs={this.props.xs} sm={this.props.sm} md={this.props.md} lg={this.props.lg} xl={this.props.xl}>
        <FormControl>
          <InputLabel shrink={true} style={{ marginTop: '-5px' }}>{this.props.label}</InputLabel>
          <div>
            {this.state.bits.map((bitValue, idx) => {
              return (
                <FormControlLabel
                  key={idx}
                  control={<Checkbox checked={bitValue} disabled={this.props.disabled} onChange={() => this.changeBit(idx)} />}
                  label={idx}
                />
              );
            })}
          </div>

          {this.props.children && <FormHelperText>{this.props.children}</FormHelperText>}
        </FormControl>
      </Grid>
    );
  }

  private changeBit (idx: number): void {
    const bits = [ ...this.state.bits ];
    bits[idx] = !bits[idx];

    let value = 0;
    bits.forEach((b, i) => {
      if (b) {
        value |= (1 << i);
      }
    });

    this.setState({
      bits: bits,
      value: value,
    }, () => {
      this.props.onChange(this.state.value);
    });
  }
}
