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
export declare class ProgramError extends Error {
}
