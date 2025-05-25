'use strict';

// Makes ts-node ignore warnings, so mocha --watch does work
process.env.TS_NODE_IGNORE_WARNINGS = 'TRUE';
// Sets the correct tsconfig for testing
process.env.TS_NODE_PROJECT = 'tsconfig.json';
// Needed to use AdapterConfig* types in tests
process.env.TS_NODE_FILES = 'true';

// Don't silently swallow unhandled rejections
process.on('unhandledRejection', (e) => {
    throw e;
});

// enable the should interface with sinon
// and load chai-as-promised and sinon-chai by default
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');

chai.should();
chai.use(sinonChai.default || sinonChai);
chai.use(chaiAsPromised.default || chaiAsPromised);
