import * as commander from 'commander';
import * as fs from 'fs';
import * as glob from 'glob';
import * as nodeHelpers from 'node-helpers';
import * as path from 'path';
import * as program from './program';
import * as Types from './types';

import Ajv = require('ajv');

function getRulesFromJsonFile(rulesPath: any, dirPath: string): Types.FileDirectoryArray {
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

    return configJson.rules as Types.FileDirectoryArray;
  }

  return [];
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

  const ignoreFilesGlob: string | undefined = commander.ignoreFiles;
  const ignoreDirsGlob: string | undefined = commander.ignoreDirs;
  const ignoreFiles = ignoreFilesGlob ? glob.sync(ignoreFilesGlob, { cwd: dirPath }) : [];
  const ignoreDirs = ignoreDirsGlob ? glob.sync(ignoreDirsGlob, { cwd: dirPath }) : [];

  const files = nodeHelpers.file.getChildFiles(
    dirPath,
    { recursive: true, ignoreDirs, ignoreFiles }
  );
  const dirs = nodeHelpers.file.getChildDirs(
    dirPath,
    { recursive: true, ignoreDirs, ignoreFiles }
  );

  const rules = getRulesFromJsonFile(commander.rulesPath, dirPath);
  program.run(files.map(el => el.path), rules);
}
