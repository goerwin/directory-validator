export interface File {
  type: 'file';
  name: string | RegExp;
  extension?: string | RegExp;
  isOptional?: boolean;
}

export interface Directory {
  type: 'directory';
  name: string | RegExp;
  isOptional?: boolean;
  isRecursive?: boolean;
  rules?: (Directory | File)[];
}

export type FileDirectoryArray = (File | Directory)[];
