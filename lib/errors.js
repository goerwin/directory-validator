"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class JsonParseError extends Error {
    constructor(err, rulesPath) {
        super(err.message);
        this.err = err;
        this.rulesPath = rulesPath;
    }
}
exports.JsonParseError = JsonParseError;
class ConfigJsonValidateError extends Error {
    constructor(messages, rulesPath) {
        super();
        this.messages = messages;
        this.rulesPath = rulesPath;
    }
}
exports.ConfigJsonValidateError = ConfigJsonValidateError;
class ProgramError extends Error {
}
exports.ProgramError = ProgramError;
