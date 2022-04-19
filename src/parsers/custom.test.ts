import { expect } from 'chai';

import { CanBusAdapter } from '../main';
import { ParserCustom } from './custom';

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
  commonRole: 'state',
  commonStates: false,
  id: 'test',
  name: ''
};

const fakeAdapter = {
  log: {
    warn: () => { /* just discard in this test */ }
  },
  // getForeignStateAsync is mapped to getStateAsync in the vm
  getForeignStateAsync: (_id: string): Promise<ioBroker.State> => {
    return new Promise((resolve) => {
      const state: ioBroker.State = {
        val: 123,
        ack: true,
        from: 'test.0',
        lc: Date.now(),
        ts: Date.now()
      };
      setTimeout(() => resolve(state), 100); // simulate async behavior
    });
  },
  // getForeignObjectAsync is mapped to getObjectAsync in the vm
  getForeignObjectAsync: (id: string): Promise<ioBroker.Object> => {
    return new Promise((resolve) => {
      const obj: ioBroker.Object = {
        _id: id,
        common: {
          name: 'Test object',
          read: true,
          write: true,
          role: 'state'
        },
        native: {
          data: 42
        },
        type: 'state'
      };
      setTimeout(() => resolve(obj), 100); // simulate async behavior
    });
  },

} as unknown as CanBusAdapter;

describe('ParserCustom', () => {
  let buf = Buffer.alloc(8);

  it(`simple read`, async () => {
    const parser = new ParserCustom(fakeAdapter, {
      ...genericParserConfig,
      customScriptRead: `
        // read value with a mask
        value = buffer[0] & 0b00001111;
        `,
      customScriptWrite: `/* ... */`
    });
    buf[0] = 0xff;
    const result = await parser.read(buf);
    expect(result).to.equal(15);
  });

  it(`simple write`, async () => {
    const parser = new ParserCustom(fakeAdapter, {
      ...genericParserConfig,
      customScriptRead: `/* ... */`,
      customScriptWrite: `
        buffer[1] = value & 0b11001100;
        buffer[2] = 0x42;
        `
    });
    buf = (await parser.write(buf, 0b11111111)) as Buffer;
    expect(buf[1]).to.equal(0b11001100);
    expect(buf[2]).to.equal(0x42);
  });

  it(`replace buffer`, async () => {
    const parser = new ParserCustom(fakeAdapter, {
      ...genericParserConfig,
      customScriptRead: `/* ... */`,
      customScriptWrite: `
        buffer = Buffer.from([1, 2, 3]);
        `
    });
    buf = (await parser.write(buf, null)) as Buffer;
    expect(buf.length).to.equal(3);
  });

  it(`undefined script should return an error`, async () => {
    const parser = new ParserCustom(fakeAdapter, genericParserConfig);
    const result = await parser.read(buf);
    expect(result).to.be.instanceof(Error);
  });

  it(`use getStateAsync and getObjectAsync`, async () => {
    const parser = new ParserCustom(fakeAdapter, {
      ...genericParserConfig,
      customScriptRead: `/* ... */`,
      customScriptWrite: `
        const state = await getStateAsync('test.0.some.id');
        buffer[0] = state.val;
        const obj = await getObjectAsync('test.0.some.id');
        buffer[1] = obj.native.data;
        `
    });
    buf = (await parser.write(buf, null)) as Buffer;
    expect(buf[0]).to.equal(123);
    expect(buf[1]).to.equal(42);
  });

  it(`script with syntax error should log a warning`, async () => {
    let warnMsg: string = '';
    const logWarn = (msg: string) => {
      if (warnMsg !== '') {
        warnMsg += '\n';
      }
      warnMsg += msg;
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const parser = new ParserCustom({
      ...fakeAdapter,
      log: {
        warn: logWarn
      }
    } as unknown as CanBusAdapter, {
      ...genericParserConfig,
      customScriptRead: `
        // missing ' at the end to throw a SyntaxError
        value = 'test;
        `,
      customScriptWrite: `/* ... */`
    });

    expect(warnMsg).to.match(/SyntaxError/).and.to.match(/value = 'test;\s*\^/);
  });

  it(`script returning wrong data type should log a warning`, async () => {
    let warnMsg: string = '';
    const logWarn = (msg: string) => {
      if (warnMsg !== '') {
        warnMsg += '\n';
      }
      warnMsg += msg;
    };

    const parser = new ParserCustom({
      ...fakeAdapter,
      log: {
        warn: logWarn
      }
    } as unknown as CanBusAdapter, {
      ...genericParserConfig,
      customDataType: 'string',
      customScriptRead: `
        value = 42;
        `,
      customScriptWrite: `/* ... */`
    });

    await parser.read(buf);

    expect(warnMsg).to.match(/returned wrong data type number/).and.to.match(/expected string/);
  });

});
