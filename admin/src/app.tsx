import { autobind } from 'core-decorators';

import React from 'react';
import { Theme, withStyles } from '@material-ui/core/styles';
import { StyleRules } from '@material-ui/styles';

import GenericApp from '@iobroker/adapter-react/GenericApp';
import { GenericAppProps, GenericAppSettings } from '@iobroker/adapter-react/types';

import I18n from '@iobroker/adapter-react/i18n';

import * as Sentry from '@sentry/react';

import type { AppContext, CommonObj } from './common';

import Settings from './components/settings';

import { compareObjects } from './lib/helpers';

import * as ioPkg from '../../io-package.json';
import Connection from '@iobroker/adapter-react/Connection';

const styles = (_theme: Theme): StyleRules => ({
  root: {},
});

class App extends GenericApp implements AppContext {

  public socket!: Connection;
  public adapterName!: string;
  public common!: CommonObj;

  constructor (props: GenericAppProps) {
    const extendedProps: GenericAppSettings & { sentryDSN: string } = {
      ...props,
      encryptedFields: [],
      translations: {
        /* eslint-disable @typescript-eslint/no-require-imports,@stylistic/quote-props,@typescript-eslint/no-unsafe-assignment */
        'en': require('./i18n/en.json'),
        'de': require('./i18n/de.json'),
        'ru': require('./i18n/ru.json'),
        'pt': require('./i18n/pt.json'),
        'nl': require('./i18n/nl.json'),
        'fr': require('./i18n/fr.json'),
        'it': require('./i18n/it.json'),
        'es': require('./i18n/es.json'),
        'pl': require('./i18n/pl.json'),
        'zh-cn': require('./i18n/zh-cn.json'),
        /* eslint-enable @typescript-eslint/no-require-imports,@stylistic/quote-props,@typescript-eslint/no-unsafe-assignment */
      },
      sentryDSN: ioPkg.common.plugins.sentry.dsn,
    };

    super(props, extendedProps);
  }

  public async onConnectionReady (): Promise<void> {
    // executed when connection is ready

    // read the saved native config to allow compare in `getIsChanged()`
    const obj = await this.socket.getObject(this.instanceId);
    this.savedNative = obj?.native ?? {};
  }

  public getIsChanged (native?: ioBroker.AdapterConfig): boolean {
    // use own implementation to compare the native objects
    return !compareObjects(this.savedNative, native);
  }

  public onPrepareSave (settings: ioBroker.AdapterConfig): boolean {
    // set DLC for messages if not set to update the config from older versions
    for (const msgUuid in settings.messages) {
      if (typeof settings.messages[msgUuid].dlc !== 'number') {
        settings.messages[msgUuid].dlc = -1;
      }
    }
    return super.onPrepareSave(settings);
  }

  public render (): React.ReactElement {
    if (!this.state.loaded) {
      return super.render();
    }

    const { theme } = this.state;

    const context: AppContext = {
      socket: this.socket,
      adapterName: this.adapterName,
      instance: this.instance,
    };

    return (
      <Sentry.ErrorBoundary
        fallback={<p>An error has occurred</p>}
        showDialog
      >
        <div className='App' style={{ background: theme.palette.background.default, color: theme.palette.text.primary }}>
          <Settings
            common={this.common}
            context={context}
            native={this.state.native as ioBroker.AdapterConfig}
            onChange={(attr, value) => this.updateNativeValue(attr, value)}
            onError={(err) => this.showError(err)}
            onValidate={(isValid) => this.setState({ isConfigurationError: isValid ? '' : I18n.t('Your configuration is invalid. Please check the settings marked in red.') })}
            setNative={this.setNative}
            showToast={(text) => this.showToast(text)}
          />
          {this.renderError()}
          {this.renderToast()}
          {this.renderSaveCloseButtons()}
        </div>
      </Sentry.ErrorBoundary>
    );
  }

  /**
   * Set (override) the native config.
   * This will force a remount of the settings component which will discard all
   * current changes (if they are not already in the new native config).
   * @param native The new native config.
   */
  @autobind
  private setNative (native: ioBroker.AdapterConfig): void {
    // create new object
    native = JSON.parse(JSON.stringify(native)) as ioBroker.AdapterConfig;

    const changed = this.getIsChanged(native);

    // set loaded to false and then back to true to force a remount of the
    // settings component which will reload all settings
    this.setState({
      loaded: false,
    }, () => {
      this.setState({
        native,
        changed,
        loaded: true,
      });
    });
  }
}

export default withStyles(styles)(App);
