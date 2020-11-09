import React from 'react';
import { Theme, withStyles } from '@material-ui/core/styles';
import { StyleRules } from '@material-ui/styles';

import GenericApp from '@iobroker/adapter-react/GenericApp';
import { GenericAppProps, GenericAppSettings } from '@iobroker/adapter-react/types';

import I18n from './i18n';

import { AppContext } from './common';

import Settings from './components/settings';

import { compareObjects } from './lib/helpers';

const styles = (_theme: Theme): StyleRules => ({
  root: {},
});

class App extends GenericApp {
  constructor(props: GenericAppProps) {
    const extendedProps: GenericAppSettings = { ...props };
    extendedProps.encryptedFields = [];
    extendedProps.translations = {
      en: require('./i18n/en.json'),
      de: require('./i18n/de.json'),
      ru: require('./i18n/ru.json'),
      pt: require('./i18n/pt.json'),
      nl: require('./i18n/nl.json'),
      fr: require('./i18n/fr.json'),
      it: require('./i18n/it.json'),
      es: require('./i18n/es.json'),
      pl: require('./i18n/pl.json'),
      'zh-cn': require('./i18n/zh-cn.json'),
    };

    super(props, extendedProps);
  }

  onConnectionReady(): void {
    // executed when connection is ready

    // read the saved native config to allow compare in `getIsChanged()`
    this.socket.getObject(this.instanceId)
      .then((obj) => {
        this.savedNative = obj?.native || {};
      });
  }

  getIsChanged(native?: Record<string, any>): boolean {
    // use own implementation to compare the native objects
    return !compareObjects(this.savedNative, native);
  }

  onPrepareSave(settings: ioBroker.AdapterConfig): void {
    // set DLC for messages if not set to update the config from older versions
    for (const msgUuid in settings.messages) {
      if (typeof settings.messages[msgUuid].dlc !== 'number') {
        settings.messages[msgUuid].dlc = -1;
      }
    }
    super.onPrepareSave(settings);
  }

  render(): React.ReactNode {
    if (!this.state.loaded) {
      return super.render();
    }

    const context: AppContext = {
      socket: this.socket,
      adapterName: this.adapterName,
      instance: this.instance
    };

    return (
      <div className='App'>
        <Settings
          native={this.state.native}
          common={this.common}
          context={context}
          onChange={(attr, value) => this.updateNativeValue(attr, value)}
          onValidate={(isValid) => this.setState({ isConfigurationError: isValid ? '' : I18n.t('Your configuration is invalid. Please check the settings marked in red.') })}
        />
        {this.renderError()}
        {this.renderToast()}
        {this.renderSaveCloseButtons()}
      </div>
    );
  }
}

export default withStyles(styles)(App);
