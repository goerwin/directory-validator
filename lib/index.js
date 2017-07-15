"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander = require("commander");
const fs = require("fs");
const glob = require("glob");
const nodeHelpers = require("node-helpers");
const path = require("path");
const program = require("./program");
const Ajv = require("ajv");
function getRulesFromJsonFile(rulesPath, dirPath) {
    if (typeof rulesPath === 'string') {
        const rulesSchema = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../schema.json'), 'utf8'));
        const configJson = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
        const ajv = new Ajv();
        if (!ajv.validate(rulesSchema, configJson)) {
            const error = new Error(ajv.errorsText(ajv.errors));
            throw error;
        }
        return configJson.rules;
    }
    return [];
}
commander.version(JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')).version);
commander
    .arguments('<dirPath>')
    .option('-f, --ignore-files <files>', 'Ignore files (glob string) eg: -f "*.js"')
    .option('-d, --ignore-dirs <dirs>', 'Ignore directories (glob string) eg: -d "**/tests"')
    .option('-r, --rules-path <path>', 'Path to the rules')
    .parse(process.argv);
if (!commander.args.length) {
    commander.help();
}
else {
    const dirPath = path.resolve(commander.args[0]);
    const ignoreFilesGlob = commander.ignoreFiles;
    const ignoreDirsGlob = commander.ignoreDirs;
    const ignoreFiles = ignoreFilesGlob ? glob.sync(ignoreFilesGlob, { cwd: dirPath }) : [];
    const ignoreDirs = ignoreDirsGlob ? glob.sync(ignoreDirsGlob, { cwd: dirPath }) : [];
    const files = nodeHelpers.file
        .getChildFiles(dirPath, { recursive: true, ignoreDirs, ignoreFiles })
        .filter(el => !el.isIgnored)
        .map(el => el.path);
    const emptyDirs = nodeHelpers.file
        .getChildDirs(dirPath, { recursive: true, ignoreDirs, ignoreFiles })
        .filter(el => !el.isIgnored)
        .filter(el => el.isEmpty)
        .map(el => el.path);
    const rules = getRulesFromJsonFile(commander.rulesPath, dirPath);
    program.run(files, rules, emptyDirs);
}
