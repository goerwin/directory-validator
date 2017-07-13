import * as commander from 'commander';
import * as fs from 'fs';
import * as glob from 'glob';
import * as nodeHelpers from 'node-helpers';
import * as path from 'path';
import * as program from './program';
import * as Types from './types';

function getMainRules(dirPath: string, rulesPath: any): Types.FileDirectoryArray {
  if (typeof rulesPath === 'string') {
    try {
      const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
      return rules as any;
    } catch (err) {
      throw err;
    }
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

  const rules = getMainRules(dirPath, commander.rulesPath);
  console.log(rules);
  // program.run(files.map(el => el.path), rules);
}
