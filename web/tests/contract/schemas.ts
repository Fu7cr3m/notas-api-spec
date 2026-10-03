import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';

const contractPath = resolve(
  __dirname,
  '../../../specs/001-notes-api-baseline/contracts/openapi.yaml',
);

const document = parse(readFileSync(contractPath, 'utf8')) as {
  components: { schemas: Record<string, object> };
};

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema({ $id: 'contract', components: document.components });

function validator(name: string) {
  return ajv.compile({ $ref: `contract#/components/schemas/${name}` });
}

export const validateNoteInput = validator('NoteInput');
export const validateNote = validator('Note');
export const validateNotePage = validator('NotePage');
export const validateProblem = validator('Problem');
