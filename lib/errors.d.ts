import * as types from './types';
export declare class JsonParseError extends Error {
    err: Error;
    filePath: string;
    constructor(err: Error, filePath: string);
}
export declare class ConfigJsonValidateError extends Error {
    filePath: string;
    messages: string[][];
    constructor(messages: string[][], filePath: string);
}
export declare class ProgramRuleError extends Error {
    paths: (string | RegExp)[];
    rule: (types.FileRule | types.DirectoryRule);
    constructor(rule: types.FileRule | types.DirectoryRule, paths: (string | RegExp)[]);
}
export declare class ProgramInvalidPathError extends Error {
    path: string;
    constructor(path: string);
}
