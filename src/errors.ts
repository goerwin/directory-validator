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

export class ProgramError extends Error { }
