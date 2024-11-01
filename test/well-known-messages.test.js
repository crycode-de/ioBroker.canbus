const fs = require('node:fs');
const path = require('node:path');
const { expect } = require('chai');
const jsonschema = require('jsonschema');

const wkmDir = path.join(__dirname, '..', 'well-known-messages');

const schemaIndex = JSON.parse(fs.readFileSync(path.join(wkmDir, 'schemas', 'index.json'), 'utf-8'));
const schemaMessages = JSON.parse(fs.readFileSync(path.join(wkmDir, 'schemas', 'messages.json'), 'utf-8'));

const configFiles = fs.readdirSync(path.join(wkmDir, 'configs'));

describe('well-known-messages', function () {
  // increase default timeout cause of reading files and validation
  this.timeout(3000);
  this.delayed

  // index.json
  it(`Index index.json`, async function () {
    const index = JSON.parse(await fs.promises.readFile(path.join(wkmDir, 'index.json'), 'utf-8'));
    const res = jsonschema.validate(index, schemaIndex);

    expect(res.valid).to.equal(true, res.errors.map((e) => e.stack).join('; '));
  });

  // create test for each config file
  for (const file of configFiles) {
    if (!file.endsWith('.json')) continue;

    it(`Config ${file}`, async function () {
      const data = JSON.parse(await fs.promises.readFile(path.join(wkmDir, 'configs', file), 'utf-8'));
      const res = jsonschema.validate(data, schemaMessages);
      expect(res.valid).to.equal(true, res.errors.map((e) => e.stack).join('; '));
    });
  }
});
