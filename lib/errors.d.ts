import * as Types from './types';
export declare class JsonParseError extends Error {
    err: Error;
    rulesPath: string;
    constructor(err: Error, rulesPath: string);
}
export declare class ConfigJsonValidateError extends Error {
    rulesPath: string;
    messages: string[][];
    constructor(messages: string[][], rulesPath: string);
}
export declare class ProgramRuleError extends Error {
    paths: (string | RegExp)[];
    rule: (Types.FileRule | Types.DirectoryRule);
    constructor(rule: Types.FileRule | Types.DirectoryRule, paths: (string | RegExp)[]);
}
export declare class ProgramInvalidPathError extends Error {
    path: string;
    constructor(path: string);
}
