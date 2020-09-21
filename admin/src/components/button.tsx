import * as React from 'react';

interface ButtonProps {
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  iconName: string;
  className?: string;
  title?: string;
}

/**
 * Renders a small floating matrializecss button.
 */
export class Button extends React.PureComponent<ButtonProps> {
  constructor (props: ButtonProps) {
    super(props);
  }

  render (): JSX.Element {
    let className = 'btn-floating btn-small waves-effect waves-light blue';
    if (this.props.className) {
      className += ' ' + this.props.className;
    }
    return (
      <a className={className} title={this.props.title} onClick={this.props.onClick}>
        <i className='material-icons'>{this.props.iconName}</i>
      </a>
    );
  }
}