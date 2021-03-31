import { expect } from 'chai';

import { ParserBoolean } from './boolean';

const genericParserConfig: ioBroker.AdapterConfigMessageParser = {
  booleanInvert: false,
  booleanMask: 0,
  dataEncoding: 'latin1',
  dataLength: 1,
  dataOffset: 0,
  dataType: 'boolean',
  dataUnit: '',
  customDataType: 'number',
  customScriptRead: '',
  customScriptWrite: '',
  id: '',
  name: ''
};

describe('ParserBoolean', () => {
  const buf = Buffer.from([0b00000000, 0b00001001, 0b11001001]);

  it(`should read false without mask`, async () => {
    const parser = new ParserBoolean({} as any, genericParserConfig);
    const result = await parser.read(buf);
    expect(result).to.equal(false);
  });

  it(`should read true without mask`, async () => {
    const parser = new ParserBoolean({} as any, {
      ...genericParserConfig,
      dataOffset: 1
    });
    const result = await parser.read(buf);
    expect(result).to.equal(true);
  });

  it(`should read false without mask and with invert`, async () => {
    const parser = new ParserBoolean({} as any, {
      ...genericParserConfig,
      dataOffset: 1,
      booleanInvert: true
    });
    const result = await parser.read(buf);
    expect(result).to.equal(false);
  });

  it(`should read false with mask`, async () => {
    const parser = new ParserBoolean({} as any, {
      ...genericParserConfig,
      dataOffset: 1,
      booleanMask: 0b01000001
    });
    const result = await parser.read(buf);
    expect(result).to.equal(false);
  });

  it(`should read true with mask`, async () => {
    const parser = new ParserBoolean({} as any, {
      ...genericParserConfig,
      dataOffset: 2,
      booleanMask: 0b01000001
    });
    const result = await parser.read(buf);
    expect(result).to.equal(true);
  });

  it(`should read false with mask and invert`, async () => {
    const parser = new ParserBoolean({} as any, {
      ...genericParserConfig,
      dataOffset: 2,
      booleanMask: 0b00001000,
      booleanInvert: true
    });
    const result = await parser.read(buf);
    expect(result).to.equal(false);
  });

  it(`should write 0b00000000 without mask`, async () => {
    const parser = new ParserBoolean({} as any, genericParserConfig);
    await parser.write(buf, false);
    expect(buf[0]).to.equal(0b00000000);
  });

  it(`should write 0b11111111 without mask`, async () => {
    const parser = new ParserBoolean({} as any, genericParserConfig);
    await parser.write(buf, true);
    expect(buf[0]).to.equal(0b11111111);
  });

  it(`should write 0b00000000 without mask and with invert`, async () => {
    const parser = new ParserBoolean({} as any, {
      ...genericParserConfig,
      booleanInvert: true
    });
    await parser.write(buf, true);
    expect(buf[0]).to.equal(0b00000000);
  });

  it(`should write 0b10111110 with mask`, async () => {
    const parser = new ParserBoolean({} as any, {
      ...genericParserConfig,
      booleanMask: 0b01000001
    });
    buf[0] = 0b11111111;
    await parser.write(buf, false);
    expect(buf[0]).to.equal(0b10111110);
  });

  it(`should write 0b10111111 with mask`, async () => {
    const parser = new ParserBoolean({} as any, {
      ...genericParserConfig,
      booleanMask: 0b00000001
    });
    buf[0] = 0b10111110;
    await parser.write(buf, true);
    expect(buf[0]).to.equal(0b10111111);
  });

  it(`should write 0b10111111 with mask and with invert`, async () => {
    const parser = new ParserBoolean({} as any, {
      ...genericParserConfig,
      booleanMask: 0b00001111,
      booleanInvert: true
    });
    buf[0] = 0b10111110;
    await parser.write(buf, true);
    expect(buf[0]).to.equal(0b10110000);
  });
});
