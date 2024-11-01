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

  fs.writeFileSync(path.join(outDir, s.file), JSON.stringify(schema, undefined, 2), { encoding: 'utf8' });
  console.log(`Schema ${s.file} created.`);
}

process.exit(retval);
