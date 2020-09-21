import * as React from 'react';
import * as ReactDOM from 'react-dom';

import './words';
import { compareObjects } from './lib/helpers';
import { Root } from './components/root';

/*
import {
  subscribeStatesAsync,
  subscribeObjectsAsync,
  unsubscribeStatesAsync,
  unsubscribeObjectsAsync,
} from './lib/backend';

/** The namespace of this adapter * /
let namespace: string;
/** The selector to subscribe to system state changes (e.g. adapter alive) * /
let systemStates: string;
/** The selector to subscribe to all of the adaper's own states * /
let adapterStates: string;
*/


// Used to compare the previously saved setting with the current configuration
let currentSettings: ioBroker.AdapterConfig;
let originalSettings: ioBroker.AdapterConfig;

let currentSettingsValid: boolean = false;

/**
 * Checks if any setting was changed
 */
function hasChanges(): boolean {
  return !compareObjects(originalSettings, currentSettings);
}

// When the config page is loaded, set up the settings change handler and render the root component
(window as any).load = (settings: ioBroker.AdapterConfig, onChange: (hasChanges: boolean) => void) => {
  originalSettings = settings;
  currentSettings = settings;

  const settingsChanged = (changes: Partial<ioBroker.AdapterConfig>): void => {
    //console.log('changed settings', changes);
    currentSettings = {
      ...currentSettings,
      ...changes
    };
    onChange(hasChanges());
  };

  ReactDOM.render(
    <Root settings={settings} onSettingsChanged={settingsChanged} onValidate={(isVaild) => currentSettingsValid = isVaild} />,
    document.getElementById('adapter-container') || document.getElementsByClassName('adapter-container')[0],
  );

  // Disable the save buttons because nothing was changed yet
  onChange(false);
};

// When the save button is clicked, overwrite the original settings variable with the new settings
(window as any).save = (callback: (newSettings: ioBroker.AdapterConfig) => void) => {
  if (!currentSettingsValid) {
    alert(_('There are some errors in you configuration. Please check!'));
    return;
  }

  // save the settings
  callback(currentSettings);
  originalSettings = currentSettings;
};
