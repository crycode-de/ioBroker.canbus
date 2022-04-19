import React from 'react';
import ReactDOM from 'react-dom';
import { MuiThemeProvider } from '@material-ui/core/styles';
import theme from '@iobroker/adapter-react/Theme';
import Utils from '@iobroker/adapter-react/Components/Utils';
import App from './app';

import * as ioPkg from '../../io-package.json';

let themeName = Utils.getThemeName();

function build(): void {
  ReactDOM.render(
    <MuiThemeProvider theme={theme(themeName)}>
      <App
        adapterName={ioPkg.common.name}
        onThemeChange={(_theme) => {
          themeName = _theme;
          build();
        }}
      />
    </MuiThemeProvider>,
    document.getElementById('root'),
  );
}

build();
