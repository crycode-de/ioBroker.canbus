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
  id: '',
  name: ''
};

describe('ParserString', () => {
  const buf = Buffer.alloc(8);

  it(`should read 'Testäöüß' latin1`, () => {
    const parser = new ParserString(genericParserConfig);
    buf.write('Testäöüß', 'latin1');
    const result = parser.read(buf);
    expect(result).to.equal('Testäöüß');
  });

  it(`should read 'äöüß' utf8`, () => {
    const parser = new ParserString({
      ...genericParserConfig,
      dataEncoding: 'utf8'
    });
    buf.write('äöüß', 'utf8');
    const result = parser.read(buf);
    expect(result).to.equal('äöüß');
  });

  it(`should read 'bar' latin1 with offset and length`, () => {
    const parser = new ParserString({
      ...genericParserConfig,
      dataOffset: 4,
      dataLength: 3
    });
    buf.write('foo bar!', 'latin1');
    const result = parser.read(buf);
    expect(result).to.equal('bar');
  });

  it(`should write 'Testäöüß' latin1`, () => {
    const parser = new ParserString(genericParserConfig);
    buf.fill(0);
    parser.write(buf, 'Testäöüß');
    expect(buf.toString('latin1')).to.equal('Testäöüß');
  });

  it(`should write 'äöüß' utf8`, () => {
    const parser = new ParserString({
      ...genericParserConfig,
      dataEncoding: 'utf8'
    });
    buf.fill(0);
    parser.write(buf, 'äöüß');
    expect(buf.toString('utf8')).to.equal('äöüß');
  });

  it(`should write 'foo bar!' latin1 with offset and length`, () => {
    const parser = new ParserString({
      ...genericParserConfig,
      dataOffset: 4,
      dataLength: 3
    });
    buf.write('foo foo!', 'latin1');
    parser.write(buf, 'bar?');
    expect(buf.toString('latin1')).to.equal('foo bar!');
  });

});
