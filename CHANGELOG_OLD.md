The newest change log is in README.md

### 1.0.0-beta.6 (2021-01-11)
* (crycode-de) Fixed object setup sequence
* (crycode-de) Fixed issue with multiple id definition check in admin
* (crycode-de) Added multiple id definition check in backend

### 1.0.0-beta.5 (2021-01-09)
* (crycode-de) Added Sentry error reporting in admin
* (crycode-de) Added check for multiple times configured message IDs in admin
* (crycode-de) Message IDs are now transformed to upper case automatically in admin
* (crycode-de) Updated dependencies

### 1.0.0-beta.4 (2020-12-01)
* (crycode-de) Ignore read value if a parser returned `undefined`
* (crycode-de) Updated dependencies

### 1.0.0-beta.3 (2020-11-25)
* (crycode-de) Fixed js-controller dependency
* (crycode-de) Custom parsers `getStateAsync` function now uses `getForeignStateAsync` internally
* (crycode-de) Added parses readme
* (crycode-de) Updated dependencies

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
## 1.2.2 (2021-08-22)

* (crycode-de) Fixed text colors in dark theme of admin 5
* (crycode-de) Updated dependencies

## 1.2.1 (2021-06-22)

* (crycode-de) Added option to automatically set a certain value in a given interval for each parser
* (crycode-de) Added checks for duplicate parser IDs
* (VeSler) Russian translation updates
* (crycode-de) Use inline sourcemaps for the adapter build files to make remote debugging work
* (crycode-de) Updated dependencies

## 1.1.4 (2021-04-30)

* (crycode-de) Added license information to import of well-known configurations
* (crycode-de) Fixed "Parser returned wrong data type undefined" log message
* (crycode-de) Updated dependencies

## 1.1.3 (2021-04-12)

* (crycode-de) Added definition of possible state values in admin
* (crycode-de) Added selection of the state role for each parser in admin
* (crycode-de) Fixed display bug of floating action buttons in admin
* (crycode-de) Export uses defaults if some config parts are not defined (e.g. if the config is from an older version)
* (crycode-de) Fixed wrong validation if a message/parser was deleted

## 1.1.2 (2021-04-06)

* (crycode-de) Added copy/paste function for message and parser configurations in admin

## 1.1.1 (2021-04-02)

* (crycode-de) Import bugfixes
* (crycode-de) Prevent wrong log warning if a parser returned undefined
* (crycode-de) Added react errorboundary for better clientside error handling

## 1.1.0 (2021-04-01)

* (crycode-de) Added import/export feature for messages in json or csv format
* (crycode-de) Added import of well known configurations from GitHub
* (crycode-de) Fixed config import in admin
* (crycode-de) Added ioBroker state data type option for custom parsers

## 1.0.2 (2021-03-26)

* (crycode-de) Fixed issue where missing state prevented custom parser write
* (DutchmanNL) Dutch translation updates
* (UncleSamSwiss) French translation updates
* (VeSler) Russian translation updates

## 1.0.1 (2021-03-12)

* (crycode-de) Use a queue to process *parser* and *send* state changes in the correct order
* (crycode-de) Fixed some spelling issues
* (crycode-de) Updated dependencies

## 1.0.0 (2021-02-23)

* (crycode-de) Sort messages in admin
* (VeSler) Russian admin translations
* (crycode-de) Updated dependencies

Older changelog is in CHANGELOG_OLD.md