import * as Types from './types';

export class JsonParseError extends Error {
  err: Error;
  rulesPath: string;

  constructor(err: Error, rulesPath: string) {
    super(err.message);
    this.err = err;
    this.rulesPath = rulesPath;
  }
}

export class ConfigJsonValidateError extends Error {
  rulesPath: string;
  messages: string[][];

  constructor(messages: string[][], rulesPath: string) {
    super();
    this.messages = messages;
    this.rulesPath = rulesPath;
  }
}

export class ProgramRuleError extends Error {
  paths: (string | RegExp)[];
  rule: (Types.FileRule | Types.DirectoryRule);

  constructor(rule: Types.FileRule | Types.DirectoryRule, paths: (string | RegExp)[]) {
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
