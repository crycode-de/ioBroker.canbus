import { assert, expect } from 'chai';

import type { CanBusAdapter } from '../main';
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
  name: '',
};

/**
 * Faked stated to be read/written by faked get/set state functions.
 */
const fakeStates: Record<string, ioBroker.State> = {
  'canbus.0.some.id': {
    val: 10,
    ack: true,
    from: 'canbus.0',
    lc: Date.now(),
    ts: Date.now(),
  },
  'test.0.some.id': {
    val: 123,
    ack: true,
    from: 'test.0',
    lc: Date.now(),
    ts: Date.now(),
  },
};

const fakeGetForeignStateAsync = (id: string): Promise<ioBroker.State> => {
  return new Promise((resolve) => {
    const state: ioBroker.State = fakeStates[id];
    setTimeout(() => resolve(state), 10); // simulate async behavior
  });
};

const fakeGetStateAsync = (id: string): Promise<ioBroker.State> => {
  return fakeGetForeignStateAsync(`canbus.0.${id}`);
};

const fakeGetObjectAsync = (id: string): Promise<ioBroker.Object> => {
  return new Promise((resolve) => {
    const obj: ioBroker.Object = {
      _id: id,
      common: {
        name: 'Test object',
        read: true,
        write: true,
        role: 'state',
      },
      native: {
        data: 42,
      },
      type: 'state',
    };
    setTimeout(() => resolve(obj), 10); // simulate async behavior
  });
};

const fakeSetForeignStateAsync = (id: string, state: ioBroker.State | ioBroker.StateValue | ioBroker.SettableState, ack?: boolean): ioBroker.SetStatePromise => {
  return new Promise((resolve) => {
    if (typeof state === 'object') {
      fakeStates[id] = state as ioBroker.State;
    } else {
      fakeStates[id] = {
        val: state,
        ack: !!ack,
        from: 'canbus.0',
        lc: Date.now(),
        ts: Date.now(),
      };
    }
    resolve(id);
  });
};

const fakeSetStateAsync = (id: string, state: ioBroker.State | ioBroker.StateValue | ioBroker.SettableState, ack?: boolean): ioBroker.SetStatePromise => {
  return fakeSetForeignStateAsync(`canbus.0.${id}`, state, ack);
};

const fakeAdapter = {
  name: 'canbus',
  log: {
    warn: () => { /* just discard in this test */ },
  },
  getStateAsync: fakeGetStateAsync,
  getForeignStateAsync: fakeGetForeignStateAsync,
  getObjectAsync: fakeGetObjectAsync,
  getForeignObjectAsync: fakeGetObjectAsync,
  setState: fakeSetStateAsync,
  setStateAsync: fakeSetStateAsync,
  setForeignStateAsync: fakeSetForeignStateAsync,
  setTimeout: setTimeout, // real adapter uses adapter internal function here but this is ok for the tests
  clearTimeout: clearTimeout, // real adapter uses adapter internal function here but this is ok for the tests
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
      customScriptWrite: `/* ... */`,
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
        `,
    });
    buf = (await parser.write(buf, 0b11111111)) as Buffer;
    assert.deepEqual([ buf[1], buf[2] ], [ 0b11001100, 0x42 ]);
  });

  it(`cancel write`, async () => {
    const parser = new ParserCustom(fakeAdapter, {
      ...genericParserConfig,
      customScriptRead: `/* ... */`,
      customScriptWrite: `
        return false;
        `,
    });
    const ret = (await parser.write(buf, null)) as Buffer;
    expect(ret).to.equal(false);
  });

  it(`replace buffer`, async () => {
    const parser = new ParserCustom(fakeAdapter, {
      ...genericParserConfig,
      customScriptRead: `/* ... */`,
      customScriptWrite: `
        buffer = Buffer.from([1, 2, 3, 4]);
        `,
    });
    buf = (await parser.write(buf, null)) as Buffer;
    expect(buf.length).to.equal(4);
  });

  it(`store data in sharedData object`, async () => {
    const parser = new ParserCustom(fakeAdapter, {
      ...genericParserConfig,
      customScriptRead: `
        sharedData.test = 42;
        return true;
      `,
      customScriptWrite: `/* ... */`,
    });
    await parser.read(buf);
  });

  it(`read data from sharedData object`, async () => {
    const parser = new ParserCustom(fakeAdapter, {
      ...genericParserConfig,
      customScriptRead: `/* ... */`,
      customScriptWrite: `
        buffer[0] = sharedData.test;
        `,
    });
    buf = (await parser.write(buf, null)) as Buffer;
    expect(buf[0]).to.equal(42);
  });

  it(`undefined script should return an error`, async () => {
    const parser = new ParserCustom(fakeAdapter, genericParserConfig);
    const result = await parser.read(buf);
    expect(result).to.be.instanceof(Error);
  });

  it(`use getStateAsync, getObjectAsync, getForeignStateAsync, getForeignObjectAsync`, async () => {
    const parser = new ParserCustom(fakeAdapter, {
      ...genericParserConfig,
      customScriptRead: `/* ... */`,
      customScriptWrite: `
        const state = await getStateAsync('some.id');
        buffer[0] = state.val;
        const obj = await getObjectAsync('some.id');
        buffer[1] = obj.native.data;
        buffer[2] = (await getForeignStateAsync('test.0.some.id')).val;
        buffer[3] = (await getForeignObjectAsync('test.0.some.id')).native.data;
        `,
    });
    buf = (await parser.write(buf, null)) as Buffer;
    assert.deepEqual([
      buf[0],
      buf[1],
      buf[2],
      buf[3],
    ], [
      10,
      42,
      123,
      42,
    ]);
  });

  it(`use setStateAsync, setForeignStateAsync`, async () => {
    const parser = new ParserCustom(fakeAdapter, {
      ...genericParserConfig,
      customScriptRead: `/* ... */`,
      customScriptWrite: `
        await setStateAsync('set.id', 1337);
        await setForeignStateAsync('test.0.set.id', 'test');
        `,
    });
    buf = (await parser.write(buf, null)) as Buffer;

    assert.deepEqual([
      fakeStates['canbus.0.set.id']?.val,
      fakeStates['test.0.set.id']?.val,
    ], [
      1337,
      'test',
    ]);
  });

  it(`use wait`, async () => {
    const parser = new ParserCustom(fakeAdapter, {
      ...genericParserConfig,
      customScriptRead: `/* ... */`,
      customScriptWrite: `
        await wait(50);
        `,
    });
    const start = Date.now();
    buf = (await parser.write(buf, null)) as Buffer;
    const end = Date.now();

    expect(end - start).to.be.greaterThanOrEqual(50);
  });

  it(`script with syntax error should log a warning`, () => {
    let warnMsg: string = '';
    const logWarn = (msg: string): void => {
      if (warnMsg !== '') {
        warnMsg += '\n';
      }
      warnMsg += msg;
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const parser = new ParserCustom({
      ...fakeAdapter,
      log: {
        warn: logWarn,
      },
    } as unknown as CanBusAdapter, {
      ...genericParserConfig,
      customScriptRead: `
        // missing ' at the end to throw a SyntaxError
        value = 'test;
        `,
      customScriptWrite: `/* ... */`,
    });

    expect(warnMsg).to.match(/SyntaxError/).and.to.match(/Unterminated string literal/);
  });

  it(`script returning wrong data type should log a warning`, async () => {
    let warnMsg: string = '';
    const logWarn = (msg: string): void => {
      if (warnMsg !== '') {
        warnMsg += '\n';
      }
      warnMsg += msg;
    };

    const parser = new ParserCustom({
      ...fakeAdapter,
      log: {
        warn: logWarn,
      },
    } as unknown as CanBusAdapter, {
      ...genericParserConfig,
      customDataType: 'string',
      customScriptRead: `
        value = 42;
        `,
      customScriptWrite: `/* ... */`,
    });

    await parser.read(buf);

    expect(warnMsg).to.match(/returned wrong data type number/).and.to.match(/expected string/);
  });

  it(`check scoped access to this and some globals`, async () => {
    const parser = new ParserCustom({
      ...fakeAdapter,
    } as unknown as CanBusAdapter, {
      ...genericParserConfig,
      dataType: 'string',
      customScriptRead: `
        return [
          typeof this,
          Object.keys(this).length,
          typeof console,
          typeof process,
          typeof setState,
          typeof Promise,
          typeof sharedData,
          typeof setTimeout,
          typeof clearTimeout,
          typeof wait,
        ].join(',');
        `,
      customScriptWrite: `/* ... */`,
    });
    const val = await parser.read(buf);
    expect(val).to.equal('object,0,undefined,undefined,undefined,function,object,function,function,function');
  });

});
