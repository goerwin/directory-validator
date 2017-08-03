import * as nodeHelpers from 'ego-node-helpers';
import * as fs from 'fs';
import * as glob from 'glob';
import * as errors from './errors';
import * as types from './types';
import * as validator from './validator';

import Ajv = require('ajv');
const schema = require('../supportFiles/schema.json');

function getConfig(rulesPath: string): types.Config {
  let configJson: any;

  try {
    configJson = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
  } catch (err) {
    throw new errors.JsonParseError(err, rulesPath);
  }

  const validateWithSchema = (configJson: any) => {
    const ajv = new Ajv();

    if (!ajv.validate(schema, configJson)) {
      let errorMessages: string[][] = [];

      if (ajv.errors) {
        errorMessages = ajv.errors.map(el =>
          [`data${el.dataPath}`, `${el.message || ''}`]
        );
      }

      throw new errors.ConfigJsonValidateError(errorMessages, rulesPath);
    }
  };

  const parseCommonRules = (rules: types.Rules): types.Rules => {
    return rules.map(rule => {
      if (rule.type === 'common') {
        let parsedRule = configJson.commonRules[rule.key] as (types.Rule | null);

        if (!parsedRule) {
          throw new errors.ConfigJsonValidateError(
            [['Common Rule Invalid', JSON.stringify(rule)]],
            rulesPath
          );
        }

        parsedRule = parseCommonRules([parsedRule])[0] as types.Rule;
        parsedRule.isOptional = !!rule.isOptional;
        return { ...parsedRule };
      } else if (rule.type === 'directory') {
        rule.rules = parseCommonRules(rule.rules || []);
      }

      return rule;
    });
  };

  validateWithSchema(configJson);
  configJson.rules = parseCommonRules(configJson.rules);
  validateWithSchema(configJson);

  return {
    ignoreFiles: configJson.ignoreFiles,
    ignoreDirs: configJson.ignoreDirs,
    rules: configJson.rules
  };
}

export function run(
  dirPath: string,
  configPath: string, options: {
    ignoreDirsGlob?: string;
    ignoreFilesGlob?: string;
  } = {}
) {
  const { ignoreFiles, ignoreDirs, rules } = getConfig(configPath);

  let ignoreFilesGlob: string | undefined;
  if (ignoreFiles && ignoreFiles.length > 0) {
    ignoreFilesGlob = `{${[ignoreFiles[0], ...ignoreFiles].join(',')}}`;
  }

  ignoreFilesGlob = options.ignoreFilesGlob || ignoreFilesGlob;
  const newIgnoreFiles = ignoreFilesGlob ? glob.sync(ignoreFilesGlob, { cwd: dirPath }) : [];

  // Ignore Dirs
  let ignoreDirsGlob: string | undefined;
  if (ignoreDirs && ignoreDirs.length > 0) {
    ignoreDirsGlob = `{${[ignoreDirs[0], ...ignoreDirs].join(',')}}`;
  }
  ignoreDirsGlob = options.ignoreDirsGlob || ignoreDirsGlob;
  const newIgnoreDirs = ignoreDirsGlob ? glob.sync(ignoreDirsGlob, { cwd: dirPath }) : [];

  const files = nodeHelpers.file
    .getChildFiles(
      dirPath,
      { recursive: true, ignoreDirs: newIgnoreDirs, ignoreFiles: newIgnoreFiles }
    );

  const emptyDirs = nodeHelpers.file
    .getChildDirs(
      dirPath,
      { recursive: true, ignoreDirs: newIgnoreDirs, ignoreFiles: newIgnoreFiles }
    );

  validator.run(
    files.filter(el => !el.isIgnored).map(el => el.path),
    rules,
    emptyDirs.filter(el => !el.isIgnored && el.isEmpty).map(el => el.path)
  );

  return {
    asciiTree: nodeHelpers.file.generateAsciiTree(
      dirPath,
      [...files, ...emptyDirs.filter(el => el.isIgnored || el.isEmpty)]
    )
  };
}
