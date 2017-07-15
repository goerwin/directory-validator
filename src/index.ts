#! /usr/bin/env node

import 'colors';
import * as commander from 'commander';
import * as fs from 'fs';
import * as glob from 'glob';
import * as nodeHelpers from 'node-helpers';
import * as path from 'path';
import * as errors from './errors';
import * as program from './program';
import * as types from './types';

import Ajv = require('ajv');

function getConfigs(rulesPath: any, dirPath: string): types.Config {
  if (typeof rulesPath === 'string') {
    const rulesSchema = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../schema.json'), 'utf8')
    );

    let configJson;

    try {
      configJson = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    } catch (err) {
      throw new errors.JsonParseError(err, rulesPath);
    }

    const ajv = new Ajv();
    if (!ajv.validate(rulesSchema, configJson)) {
      let errorMessages: string[][] = [];

      if (ajv.errors) {
        errorMessages = ajv.errors.map(el =>
          [`data${el.dataPath}`, `${el.message || ''}`]
        );
      }

      throw new errors.ConfigJsonValidateError(errorMessages, rulesPath);
    }

    return {
      ignoreFiles: configJson.ignoreFiles,
      ignoreDirs: configJson.ignoreDirs,
      rules: configJson.rules
    };
  }

  return { rules: [] };
}

commander.version(
  JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')).version
);

commander
  .arguments('<dirPath>')
  .option('-i, --init', 'Create a configuration file')
  .option('-f, --ignore-files <files>', 'Ignore files (glob string) eg: -f "*.js"')
  .option('-d, --ignore-dirs <dirs>', 'Ignore directories (glob string) eg: -d "**/tests"')
  .option('-c, --config-file <path>', 'Path to the configuration file')
  .parse(process.argv);

if (!commander.args.length) {
  commander.help();
} else {
  const dirPath = path.resolve(commander.args[0]);

  try {
    const { ignoreFiles, ignoreDirs, rules } = getConfigs(commander.rulesPath, dirPath);

    let ignoreFilesGlob: string | undefined;
    if (ignoreFiles && ignoreFiles.length > 0) {
      ignoreFilesGlob = `{${[ignoreFiles[0], ...ignoreFiles].join(',')}}`;
    }
    ignoreFilesGlob = commander.ignoreFiles || ignoreFilesGlob;
    const newIgnoreFiles = ignoreFilesGlob ? glob.sync(ignoreFilesGlob, { cwd: dirPath }) : [];

    let ignoreDirsGlob: string | undefined;
    if (ignoreDirs && ignoreDirs.length > 0) {
      ignoreDirsGlob = `{${[ignoreDirs[0], ...ignoreDirs].join(',')}}`;
    }
    ignoreDirsGlob = commander.ignoreDirs || ignoreDirsGlob;
    const newIgnoreDirs = ignoreDirsGlob ? glob.sync(ignoreDirsGlob, { cwd: dirPath }) : [];

    const files = nodeHelpers.file
      .getChildFiles(dirPath, { recursive: true, ignoreDirs, ignoreFiles })
      .filter(el => !el.isIgnored)
      .map(el => el.path);

    const emptyDirs = nodeHelpers.file
      .getChildDirs(dirPath, { recursive: true, ignoreDirs, ignoreFiles })
      .filter(el => !el.isIgnored)
      .filter(el => el.isEmpty)
      .map(el => el.path);

    program.run(files, rules, emptyDirs);
  } catch (err) {
    const dash = '-'.bold;
    const errorTitle = '\n\t' + 'Error:'.bold.red.underline;

    if (err instanceof errors.JsonParseError) {
      console.log(errorTitle, 'at config file:'.red, err.rulesPath);
      console.log('\t', dash, 'Could not parse/read the file');
      console.log('\t', dash, err.message);
    } else if (err instanceof errors.ConfigJsonValidateError) {
      console.log(errorTitle, 'at config file:'.red, err.rulesPath);
      err.messages.forEach(el => console.log('\t', dash, `${el[0].red}:`, el[1]));
    } else if (err instanceof errors.ProgramRuleError) {
      console.log(errorTitle);
      const parentPath = err.paths.join(path.sep);
      const rule = JSON.stringify(err.rule);
      console.log('\t', dash, 'Rule', rule.red, 'did not passed at:', parentPath.red);
    } else if (err instanceof errors.ProgramInvalidPathError) {
      console.log(errorTitle);
      console.log('\t', dash, err.path.red, 'was not validated');
    } else {
      console.log(errorTitle);
      console.log('\t', dash, err.message.red);
    }

    console.log();
    process.exit(1);
  }
}
