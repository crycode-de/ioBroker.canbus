import { expect } from 'chai';

import { ParserString } from './string';

const genericParserConfig: ioBroker.AdapterConfigMessageParser = {
  booleanInvert: false,
  booleanMask: 0,
  dataEncoding: 'latin1',
  dataLength: 8,
  dataOffset: 0,
  dataType: 'string',
  dataUnit: '',
  customDataType: 'number',
  customScriptRead: '',
  customScriptWrite: '',
  commonRole: 'state',
  commonStates: undefined,
  id: '',
  name: ''
};

describe('ParserString', () => {
  const buf = Buffer.alloc(8);

  it(`should read 'Testäöüß' latin1`, async () => {
    const parser = new ParserString({} as any, genericParserConfig);
    buf.write('Testäöüß', 'latin1');
    const result = await parser.read(buf);
    expect(result).to.equal('Testäöüß');
  });

  it(`should read 'äöüß' utf8`, async () => {
    const parser = new ParserString({} as any, {
      ...genericParserConfig,
      dataEncoding: 'utf8'
    });
    buf.write('äöüß', 'utf8');
    const result = await parser.read(buf);
    expect(result).to.equal('äöüß');
  });

  it(`should read 'bar' latin1 with offset and length`, async () => {
    const parser = new ParserString({} as any, {
      ...genericParserConfig,
      dataOffset: 4,
      dataLength: 3
    });
    buf.write('foo bar!', 'latin1');
    const result = await parser.read(buf);
    expect(result).to.equal('bar');
  });

  it(`should write 'Testäöüß' latin1`, async () => {
    const parser = new ParserString({} as any, genericParserConfig);
    buf.fill(0);
    await parser.write(buf, 'Testäöüß');
    expect(buf.toString('latin1')).to.equal('Testäöüß');
  });

  it(`should write 'äöüß' utf8`, async () => {
    const parser = new ParserString({} as any, {
      ...genericParserConfig,
      dataEncoding: 'utf8'
    });
    buf.fill(0);
    await parser.write(buf, 'äöüß');
    expect(buf.toString('utf8')).to.equal('äöüß');
  });

  it(`should write 'foo bar!' latin1 with offset and length`, async () => {
    const parser = new ParserString({} as any, {
      ...genericParserConfig,
      dataOffset: 4,
      dataLength: 3
    });
    buf.write('foo foo!', 'latin1');
    await parser.write(buf, 'bar?');
    expect(buf.toString('latin1')).to.equal('foo bar!');
  });

});
