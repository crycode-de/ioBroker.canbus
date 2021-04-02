import React from 'react';
import ReactDOM from 'react-dom';
import * as Sentry from '@sentry/react';
import * as SentryIntegrations from '@sentry/integrations';
import { MuiThemeProvider } from '@material-ui/core/styles';
import theme from '@iobroker/adapter-react/Theme';
import Utils from '@iobroker/adapter-react/Components/Utils';
import App from './app';

import * as ioPkg from '../../io-package.json';

let themeName = Utils.getThemeName();

function build(): void {
  ReactDOM.render(
    <MuiThemeProvider theme={theme(themeName)}>
      <Sentry.ErrorBoundary
        fallback={'An error has occurred'}
        showDialog
      >
        <App
          adapterName={ioPkg.common.name}
          onThemeChange={(_theme) => {
            themeName = _theme;
            build();
          }}
        />
      </Sentry.ErrorBoundary>
    </MuiThemeProvider>,
    document.getElementById('root'),
  );
}

if (window.location.host !== 'localhost:3000') {
  Sentry.init({
    dsn: ioPkg.common.plugins.sentry.dsn,
    release: `iobroker.${ioPkg.common.name}@${ioPkg.common.version}`,
    integrations: [
      new SentryIntegrations.Dedupe()
    ]
  });
}

build();
