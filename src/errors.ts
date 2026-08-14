import * as path from 'node:path';
import type * as types from './types.ts';

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
  paths: (string | RegExp)[];
  rule: types.FileRule | types.DirectoryRule;
  rulePath: string;

  constructor(
    rule: types.FileRule | types.DirectoryRule,
    paths: (string | RegExp)[],
    rulePath: string,
    commonKey?: string,
  ) {
    const commonRulePath = commonKey ? ` (commonRules.${commonKey})` : '';
    super(
      `${JSON.stringify(rule)}, deep: ${paths.length}, rule did not passed at: ${paths.join(path.sep)}, rulePath: ${rulePath}${commonRulePath}`,
    );
    this.rule = rule;
    this.paths = paths;
    this.rulePath = `${rulePath}${commonRulePath}`;
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
  if (typeof err !== 'object' || err === null) {
    return false;
  }

  const candidate = err as { message?: string; stack?: string };
  return Boolean(candidate.message && candidate.stack);
}
