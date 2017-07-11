namespace Types {
  // type NotationName = '[camelCase]' | '[UPPERCASE]' | '[dash-case]' | '[snake_case]';

  export interface File {
    name: string;
    extension?: string | RegExp;
    type: 'file';
    isOptional?: boolean;
  }

  export interface Directory {
    name: string;
    type: 'directory';
    isOptional?: boolean;
    isRecursive?: boolean;
    children?: (Directory | File)[];
  }
}
