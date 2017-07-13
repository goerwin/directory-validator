// TODO: Rename to FileRule
export interface File {
  type: 'file';
  name: string | RegExp;
  extension?: string | RegExp;
  isOptional?: boolean;
}

// TODO: Rename to DirectoryRule
export interface Directory {
  type: 'directory';
  name: string | RegExp;
  isOptional?: boolean;
  isRecursive?: boolean;
  rules?: (Directory | File)[];
}

// TODO: Rename to Rules
export type FileDirectoryArray = (File | Directory)[];
