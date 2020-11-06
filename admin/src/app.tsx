import * as React from 'react';
import { Theme, withStyles } from '@material-ui/core/styles';

import GenericApp from '@iobroker/adapter-react/GenericApp';
import Settings from './components/settings';
import { GenericAppProps, GenericAppSettings } from '@iobroker/adapter-react/types';
import { StyleRules } from '@material-ui/styles';
import { AppContext } from './common';

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
  }

  onPrepareSave(settings: Record<string, any>): void {
    super.onPrepareSave(settings);
    // TODO: filter out not fully configured messages and parsers
    //const messages: ioBroker.AdapterConfigMessages = {...settings.messages};
    //settings.devices = devices.filter((d) => d.type && d.name);
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
        />
        {this.renderError()}
        {this.renderToast()}
        {this.renderSaveCloseButtons()}
      </div>
    );
  }
}

export default withStyles(styles)(App);
