import type * as types from './types';

export class JsonParseError extends Error {
  err: Error;
  filePath: string;

  constructor(err: unknown, filePath: string) {
    const parsedError = isError(err) ? err : new Error('unknown error');

    super(parsedError.message);
    this.err = parsedError;
    this.filePath = filePath;
  }
}

export class ConfigJsonValidateError extends Error {
  filePath: string;
  messages: string[][];

  constructor(messages: string[][], filePath: string) {
    super();
    this.messages = messages;
    this.filePath = filePath;
  }
}

export class ValidatorRuleError extends Error {
  path: string;
  rule: types.FileRule | types.DirectoryRule;

  constructor(rule: types.FileRule | types.DirectoryRule, path: string) {
    const depth = path === '' ? 0 : path.match(/\//g)?.length ?? 1;
    super(`${JSON.stringify(rule)}, deep: ${depth}, rule did not passed`);
    this.rule = rule;
    this.path = path;
  }
}

export class ValidatorInvalidPathError extends Error {
  path: string;

  constructor(path: string) {
    super(`${path}, was not validated`);
    this.path = path;
  }
}

export function isError(err: unknown): err is Error {
  return typeof err === 'object' && err !== null && 'stack' in err && 'message' in err;
}
