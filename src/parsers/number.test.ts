import { expect } from 'chai';

import { ParserNumber } from './number';

const genericParserConfig: ioBroker.AdapterConfigMessageParser = {
  booleanInvert: false,
  booleanMask: 0,
  dataEncoding: 'latin1',
  dataLength: 1,
  dataOffset: 0,
  dataType: 'uint8',
  dataUnit: '',
  customDataType: 'number',
  customScriptRead: '',
  customScriptWrite: '',
  commonStates: undefined,
  id: '',
  name: ''
};

describe('ParserNumber => uint8', () => {
  const parser = new ParserNumber({} as any, {
    ...genericParserConfig,
    dataType: 'uint8',
    dataOffset: 1
  });
  const buf = Buffer.from([10,20,30,40]);

  it(`should read 20`, async () => {
    const result = await parser.read(buf);
    expect(result).to.equal(20);
  });
  it(`should write 42`, async () => {
    const result = await parser.write(buf, 42);
    expect(result).to.be.instanceOf(Buffer);
    expect(buf[1]).to.equal(42);
  });
  it(`should return an error`, async () => {
    const result = await parser.read(Buffer.from([1]));
    expect(result).to.be.instanceof(Error);
  });

});
