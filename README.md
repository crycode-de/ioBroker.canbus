# ioBroker.canbus

![Logo](admin/canbus.png)

[![NPM version](https://img.shields.io/npm/v/iobroker.canbus.svg)](https://www.npmjs.com/package/iobroker.canbus)
[![Downloads](https://img.shields.io/npm/dm/iobroker.canbus.svg)](https://www.npmjs.com/package/iobroker.canbus)
![Number of Installations (latest)](https://iobroker.live/badges/canbus-installed.svg)
![Number of Installations (stable)](https://iobroker.live/badges/canbus-stable.svg)
[![Dependency Status](https://img.shields.io/david/crycode-de/iobroker.canbus.svg)](https://david-dm.org/crycode-de/iobroker.canbus)
[![Known Vulnerabilities](https://snyk.io/test/github/crycode-de/ioBroker.canbus/badge.svg)](https://snyk.io/test/github/crycode-de/ioBroker.canbus)
[![Translation status](https://weblate.iobroker.net/widgets/adapters/-/canbus/svg-badge.svg)](https://weblate.iobroker.net/engage/adapters/?utm_source=widget)

[![NPM](https://nodei.co/npm/iobroker.canbus.png?downloads=true)](https://nodei.co/npm/iobroker.canbus/)

**Tests:** ![Test and Release](https://github.com/crycode-de/ioBroker.canbus/workflows/Test%20and%20Release/badge.svg)

## CAN bus adapter for ioBroker

This adapter connects ioBroker to a Controller Area Network (CAN bus).

**This adapter uses Sentry libraries to automatically report exceptions and code errors to the developers.** For more details and for information how to disable the error reporting see [Sentry-Plugin Documentation](https://github.com/ioBroker/plugin-sentry#plugin-sentry)! Sentry reporting is used starting with js-controller 3.0.
## Features

* Receive and send raw messages using standard frames and extended frames
* Each message may be configured for receiving and/or sending data
* Ability to automatically add objects for seen CAN messages which are not already configured
* Configure parsers for each message to read/write data from/to the raw message buffer
  * Nummeric types
  * Booleans including bitmask support
  * Strings in differenct character encodings
  * Custom scripts to read/write from/to the buffer of raw data
* Support for the RTR flag

## Requirements

* Linux operating system (because of the used socketcan library)
* CAN Hardware which creates an interface like `can0`
* Some knowledge about the messages send on you CAN bus

## Usage in scripts

You can handle/modify the `<messageId>.json` or `<messageId>.<parserId>` states in your scripts.

Additionally you may use the `raw.received` and `raw.send` states, if you have them enabled in the adapter config.  
They hold the stringified JSON data of the message data and can be used to handle each received or send message independent from the configured messages.
By writing JSON data to the `raw.send` state you are able to send CAN messages containing any data you like.

### Raw message object example
```js
{
  "id": 42,
  "ext": false,
  "data": [0, 13, 37, 255],
  "rtr": false
}
```

`ext` and `rtr` are optional and default to `false`.


## Changelog

### 1.0.0-beta.2 (2020-11-23)
* (crycode-de) Added Sentry error reporting
### 1.0.0-beta.1 (2020-11-17)
* (crycode-de) Added optional raw states.
* (crycode-de) Added option to enable/disable rtr states.

### 0.1.0-alpha.1 (2020-11-09)
* (crycode-de) New React UI
* (crycode-de) Support for messages with specific DLC
* (crycode-de) Parsers read on json state change with ack=false

### 0.0.1
* (crycode-de) initial development release

## License

Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)

Copyright (c) 2020 Peter Müller <peter@crycode.de> (https://crycode.de/)
