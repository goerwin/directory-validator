import * as types from './types';

export class JsonParseError extends Error {
  err: Error;
  filePath: string;

  constructor(err: Error, filePath: string) {
    super(err.message);
    this.err = err;
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

export class ProgramRuleError extends Error {
  paths: (string | RegExp)[];
  rule: (types.FileRule | types.DirectoryRule);

  constructor(rule: types.FileRule | types.DirectoryRule, paths: (string | RegExp)[]) {
    super(`${JSON.stringify(rule)}, deep: ${paths.length}, rule did not passed`);
    this.rule = rule;
    this.paths = paths;
  }
}

export class ProgramInvalidPathError extends Error {
  path: string;

  constructor(path: string) {
    super(`${path}, was not validated`);
    this.path = path;
  }
}
