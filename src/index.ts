#! /usr/bin/env node

import 'colors';
import * as commander from 'commander';
import * as fs from 'fs';
import * as glob from 'glob';
import * as nodeHelpers from 'node-helpers';
import * as path from 'path';
import * as errors from './errors';
import * as program from './program';
import * as Types from './types';

import Ajv = require('ajv');

function getConfigs(rulesPath: any, dirPath: string): Types.Config {
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
  .option('-f, --ignore-files <files>', 'Ignore files (glob string) eg: -f "*.js"')
  .option('-d, --ignore-dirs <dirs>', 'Ignore directories (glob string) eg: -d "**/tests"')
  .option('-r, --rules-path <path>', 'Path to the rules')
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
    if (err instanceof errors.JsonParseError) {
      console.log('\n\t', 'Error:'.bold.red.underline, 'at config file:'.red, err.rulesPath);
      console.log('\t', '-'.bold, 'Could not parse/read the file');
      console.log('\t', '-'.bold, err.message);
    } else if (err instanceof errors.ConfigJsonValidateError) {
      console.log('\n\t', 'Error:'.bold.red.underline, 'at config file:'.red, err.rulesPath);
      err.messages.forEach(el => console.log('\t', '-'.bold, `${el[0].red}:`, el[1]));
    } else {
      console.log('\n\t', 'Error:'.bold.red.underline);
      console.log('\t', err.message.red);
    }

    console.log();
    process.exit(1);
  }
}
