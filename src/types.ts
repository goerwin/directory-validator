export interface FileRule {
  type: 'file';
  name: string | RegExp;
  extension?: string | RegExp;
  isOptional?: boolean;
}

export interface DirectoryRule {
  type: 'directory';
  name: string | RegExp;
  isOptional?: boolean;
  isRecursive?: boolean;
  rules?: Rules;
}

export interface CommonRule {
  type: 'commonRule';
  id: string;
}

export interface ValidatableFile {
  path: string;
  isGood: boolean;
  isValidated: boolean;
}

export type Rules = (FileRule | DirectoryRule | CommonRule)[];

export type SpecialName = '[camelCase]' | '[UPPERCASE]' | '[dash-case]' | '[snake_case]' | '*';

export interface Config {
  ignoreFiles?: string[];
  ignoreDirs?: string[];
  rules: Rules;
}
