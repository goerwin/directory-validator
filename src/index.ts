#! /usr/bin/env node

import 'colors';
import { program as commanderProgram } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as errors from './errors';
import * as program from './program';

const initConfigFilename = '.directoryvalidator.json';

function getDefaultConfigFilePath(dirPath: string) {
  let absDirPath = path.resolve(dirPath);
  const homeDirPath = os.homedir();

  while (true) {
    const configPath = path.join(absDirPath, initConfigFilename);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
    if (absDirPath === homeDirPath) {
      break;
    }
    absDirPath = path.resolve(absDirPath, '..');
  }

  throw new Error('configuration file was not provided/found');
}

export function writeDefaultConfigFile(parentPath: string) {
  fs.copyFileSync(
    path.join(__dirname, './resources/defaultConfig.json'),
    parentPath
  );
}

commanderProgram.version(
  JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'))
    .version
);

commanderProgram
  .arguments('<dirPath>')
  .option('-i, --init', 'Create a configuration file')
  .option('-p, --print', 'Print the directory structure validated')
  .option(
    '-f, --ignore-files <files>',
    'Ignore files (glob string) eg: -f "*.js"'
  )
  .option(
    '-d, --ignore-dirs <dirs>',
    'Ignore directories (glob string) eg: -d "**/tests"'
  )
  .option('-c, --config-file <path>', 'Path to the configuration file')
  .parse(process.argv);

const selectedOptions = commanderProgram.opts();

if (selectedOptions.init) {
  fs.copyFileSync(
    path.join(__dirname, './resources/defaultConfig.json'),
    path.join(process.cwd(), initConfigFilename)
  );
  console.log('\n\t', initConfigFilename.red, 'created', '\n');
} else if (!commanderProgram.args.length) {
  commanderProgram.help();
} else {
  const dirPath = path.resolve(commanderProgram.args[0]);

  try {
    const configPath =
      (selectedOptions.configFile as string) ||
      getDefaultConfigFilePath(dirPath);

    const results = program.run(dirPath, configPath, {
      ignoreDirsGlob: selectedOptions.ignoreDirs,
      ignoreFilesGlob: selectedOptions.ignoreFiles,
    });

    console.log('Directory successfully validated!');

    if (selectedOptions.print && results.asciiTree) {
      console.log(
        '\n',
        results.asciiTree
          .replace(/\/fileIgnored/g, '[File Ignored]'.dim)
          .replace(/\/directoryIgnored/g, '[Directory Ignored]'.dim)
          .replace(/\/emptyDirectory/g, '[Empty Directory]'.dim)
      );
    }
  } catch (err) {
    const dash = '-'.bold;
    const errorTitle = '\n\t' + 'Error:'.red.underline;

    if (err instanceof errors.JsonParseError) {
      console.error(errorTitle, 'at config file:'.red, err.filePath);
      console.error('\t', dash, 'Could not parse/read the file');
      console.error('\t', dash, err.message);
    } else if (err instanceof errors.ConfigJsonValidateError) {
      console.error(errorTitle, 'at config file:'.red, err.filePath);
      err.messages.forEach((el) =>
        console.error('\t', dash, `${el[0].red}:`, el[1])
      );
    } else if (err instanceof errors.ValidatorRuleError) {
      console.error(errorTitle);
      const parentPath = err.paths.join(path.sep);
      const rule = JSON.stringify(err.rule);
      console.error(
        '\t',
        dash,
        'Rule',
        rule.red,
        'did not passed at:',
        parentPath.red
      );
    } else if (err instanceof errors.ValidatorInvalidPathError) {
      console.error(errorTitle);
      console.error('\t', dash, err.path.red, 'was not validated');
    } else if (errors.isError(err)) {
      console.error(errorTitle);
      console.error('\t', dash, err.message.red);
    } else {
      console.error('Unknown error');
    }

    process.exit(1);
  }
}
