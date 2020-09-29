
import { expect } from 'chai';

// import '../lib/adapter-config.d.ts';

import { ParserNumber } from './number';

const genericParserConfig: ioBroker.AdapterConfigMessageParser = {
  booleanInvert: false,
  booleanMask: 0,
  dataEncoding: 'latin1',
  dataLength: 1,
  dataOffset: 1,
  dataType: 'uint8',
  dataUnit: '',
  id: '',
  name: ''
};

describe('ParserNumber => uint8', () => {
  const parser = new ParserNumber({
    ...genericParserConfig,
    dataType: 'uint8',
    dataOffset: 1
  });
  const buf = Buffer.from([10,20,30,40]);

  it(`should read 20`, () => {
    const result = parser.read(buf);
    // assign result a value from functionToTest
    expect(result).to.equal(20);
  });
  it(`should write 42`, () => {
    const result = parser.write(buf, 42);
    // assign result a value from functionToTest
    expect(result).to.equal(true);
    expect(buf[1]).to.equal(42);
  });
  it(`should return an error`, () => {
    const result = parser.read(Buffer.from([1]));
    // assign result a value from functionToTest
    expect(result).to.be.instanceof(Error);
  });

});
