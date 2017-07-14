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

export interface ValidatableFile {
  path: string;
  isGood: boolean;
  isValidated: boolean;
}

export type Rules = (FileRule | DirectoryRule)[];
