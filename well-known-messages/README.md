# ioBroker.canbus well known messages

Predefined configurations for the _ioBroker.canbus_ adapter.

## Index and versioning

Each configuration has to be listed in `index.json` with at least one version.  
Each version requires an own file like `name-1.2.3.json` containing the configuration inside the `configs` directory.

The latest/testing configuration has to be named `named-latest.json` and should be listed as last entry in the `releases` section of `index.json`.  
Changes are only allowed in the latest configuration!  
When a new configuration version will be released, the latest file will be copied to a new file containing the version number and an entry to `index.json` will be added.

## Schema definitions

Schema definition for `index.json` and the configuration files are available in the `schemas` directory.
