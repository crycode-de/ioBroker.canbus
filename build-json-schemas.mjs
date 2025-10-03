/**
 * Helper script to create json schemas from typescript interfaces required
 * by the well-known-messages.
 */
/* global console, process */
import fs from 'node:fs';
import path from 'node:path';
import TJS from 'typescript-json-schema';

const inputFiles = [
  path.join('src', 'lib', 'adapter-config.d.ts'),
];

const outDir = path.join('well-known-messages', 'schemas');

const settings = {
  required: true,
};

const compilerOptions = {
  strictNullChecks: true,
  skipLibCheck: true,
};

const program = TJS.getProgramFromFiles(
  inputFiles,
  compilerOptions,
  '.',
);

/**
 * Schemas to create
 */
const schemas = [
  {
    type: 'global.ioBroker.AdapterConfigMessagesLang',
    file: 'messages.json',
    settings,
  },
  {
    type: 'global.ioBroker.WellKnownMessagesIndex',
    file: 'index.json',
    settings,
  },
];

fs.mkdirSync(outDir, { recursive: true });

let retval = 0;

// loop over all given schemas and create the files
for (const s of schemas) {
  const schema = TJS.generateSchema(program, s.type, s.settings);
  if (!schema) {
    console.error(`Cloud not create schema for type ${s.type}!`);
    retval = 1;
    continue;
  }

  let json = JSON.stringify(schema, undefined, 2);

  // fix $ref containing invalid characters
  // e.g. $ref: "#/definitions/Message<Foo>"
  // we replace < and > with _
  // e.g. $ref: "#/definitions/Message_Foo_"
  // because the json schema validator in the frontend cannot handle these characters
  const refs = json.match(/"\$ref": "(.+?)"/g) ?? [];
  for (const ref of refs) {
    const m = /"\$ref": "#\/definitions\/(.+?)"/.exec(ref);
    if (m) {
      const def = m[1];
      const fixedDef = def.replace(/[<>]/g, '_');
      json = json.replaceAll(def, fixedDef);
    }
  }

  fs.writeFileSync(path.join(outDir, s.file), json, { encoding: 'utf8' });
  console.log(`Schema ${s.file} created.`);
}

process.exit(retval);
