#! /usr/bin/env node

import 'colors';
import * as commander from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as errors from './errors';
import * as program from './program';
import * as types from './types';

const initConfigFilename = '.directoryvalidator.json';

function getDefaultConfigFilePath(dirPath: string) {
  let absDirPath = path.resolve(dirPath);
  const homeDirPath = os.homedir();

  while (true) {
    const configPath = path.join(absDirPath, initConfigFilename);
    if (fs.existsSync(configPath)) { return configPath; }
    if (absDirPath === homeDirPath) { break; }
    absDirPath = path.resolve(absDirPath, '..');
  }

  throw new Error('configuration file was not provided/found');
}

export function writeDefaultConfigFile(parentPath: string) {
  try {
    const configFilePath = path.join(__dirname, '../supportFiles/defaultConfig.json');
    const data = fs.readFileSync(configFilePath, 'utf8');
    fs.writeFileSync(path.join(parentPath, initConfigFilename), data, 'utf8');
  } catch (err) {
    throw err;
  }
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

if (commander.init) {
  writeDefaultConfigFile(process.cwd());
  console.log('\n\t', initConfigFilename.red, 'created', '\n');
} else if (!commander.args.length) {
  commander.help();
} else {
  const dirPath = path.resolve(commander.args[0]);

  try {
    const configPath = (commander.configFile as string) || getDefaultConfigFilePath(dirPath);

    program.run(
      dirPath,
      configPath,
      { ignoreDirsGlob: commander.ignoreDirs, ignoreFilesGlob: commander.ignoreFiles }
    );
  } catch (err) {
    const dash = '-'.bold;
    const errorTitle = '\n\t' + 'Error:'.bold.red.underline;

    if (err instanceof errors.JsonParseError) {
      console.log(errorTitle, 'at config file:'.red, err.filePath);
      console.log('\t', dash, 'Could not parse/read the file');
      console.log('\t', dash, err.message);
    } else if (err instanceof errors.ConfigJsonValidateError) {
      console.log(errorTitle, 'at config file:'.red, err.filePath);
      err.messages.forEach(el => console.log('\t', dash, `${el[0].red}:`, el[1]));
    } else if (err instanceof errors.ValidatorRuleError) {
      console.log(errorTitle);
      const parentPath = err.paths.join(path.sep);
      const rule = JSON.stringify(err.rule);
      console.log('\t', dash, 'Rule', rule.red, 'did not passed at:', parentPath.red);
    } else if (err instanceof errors.ValidatorInvalidPathError) {
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
