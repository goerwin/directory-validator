#! /usr/bin/env node

import * as colors from 'colors/safe';
import * as commander from 'commander';
import * as fs from 'fs';
import * as glob from 'glob';
import * as nodeHelpers from 'node-helpers';
import * as path from 'path';
import * as program from './program';
import * as Types from './types';

import Ajv = require('ajv');

function getConfigs(rulesPath: any, dirPath: string): Types.Config {
  if (typeof rulesPath === 'string') {
    const rulesSchema = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../schema.json'), 'utf8')
    );

    const configJson = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    const ajv = new Ajv();

    if (!ajv.validate(rulesSchema, configJson)) {
      const error = new Error(ajv.errorsText(ajv.errors));
      throw error;
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

  try {
    program.run(files, rules, emptyDirs);
  } catch (err) {
    console.log('\n', colors.red(`Error: ${err.message}`), '\n');
    process.exit(1);
  }
}
