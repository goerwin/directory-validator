"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class JsonParseError extends Error {
    constructor(err, filePath) {
        super(err.message);
        this.err = err;
        this.filePath = filePath;
    }
}
exports.JsonParseError = JsonParseError;
class ConfigJsonValidateError extends Error {
    constructor(messages, filePath) {
        super();
        this.messages = messages;
        this.filePath = filePath;
    }
}
exports.ConfigJsonValidateError = ConfigJsonValidateError;
class ProgramRuleError extends Error {
    constructor(rule, paths) {
        super(`${JSON.stringify(rule)}, deep: ${paths.length}, rule did not passed`);
        this.rule = rule;
        this.paths = paths;
    }
}
exports.ProgramRuleError = ProgramRuleError;
class ProgramInvalidPathError extends Error {
    constructor(path) {
        super(`${path}, was not validated`);
        this.path = path;
    }
}
exports.ProgramInvalidPathError = ProgramInvalidPathError;
