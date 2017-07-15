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
export declare type Rules = (FileRule | DirectoryRule)[];
export declare type SpecialName = '[camelCase]' | '[UPPERCASE]' | '[dash-case]' | '[snake_case]' | '*';
export interface Config {
    ignoreFiles?: string[];
    ignoreDirs?: string[];
    rules: Rules;
}
