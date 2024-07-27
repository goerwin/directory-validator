import Ajv from 'ajv';
import fs from 'node:fs';
import * as glob from 'glob';
import { generateAsciiTree } from 'goerwin-helpers/node/file';
import * as errors from './errors';
import schema from './resources/schema.json';
import type * as types from './types';
import * as validator from './validator';
import { getFilesAndDirectories } from './helpers/file';
import nodePath from 'node:path';

function getConfig(rulesPath: string): types.Config {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  let configJson: any;

  try {
    configJson = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
  } catch (err) {
    throw new errors.JsonParseError(err, rulesPath);
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const validateWithSchema = (configJson: any) => {
    const ajv = new Ajv();

    if (!ajv.validate(schema, configJson)) {
      let errorMessages: string[][] = [];

      if (ajv.errors) {
        errorMessages = ajv.errors.map(
          (el) => [`data${el.instancePath}`, `${el.message || ''}`],
          // TODO: Verify
          // [`data${el.dataPath}`, `${el.message || ''}`]
        );
      }

      throw new errors.ConfigJsonValidateError(errorMessages, rulesPath);
    }
  };

  const parseCommonRules = (rules: types.Rules): types.Rules => {
    return rules.map((rule) => {
      if (rule.type === 'common') {
        let parsedRule = configJson.commonRules[rule.key] as types.Rule | null;

        if (!parsedRule) {
          throw new errors.ConfigJsonValidateError([['Common Rule Invalid', JSON.stringify(rule)]], rulesPath);
        }

        parsedRule = structuredClone(parsedRule);
        parsedRule = parseCommonRules([parsedRule])[0] as types.Rule;
        parsedRule.isOptional =
          typeof parsedRule.isOptional === 'undefined' ? !!rule.isOptional : parsedRule.isOptional;

        return { ...parsedRule };
      }

      if (rule.type === 'directory') {
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
    rules: configJson.rules,
  };
}

export function run(
  dirPath: string,
  configPath: string,
  options: {
    ignoreDirsGlob?: string;
    ignoreFilesGlob?: string;
  } = {},
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

  const filesAndDirs = getFilesAndDirectories(dirPath, {
    recursive: true,
    ignoreFilesAndDirectories: [...newIgnoreFiles, ...newIgnoreDirs],
  });

  validator.run(filesAndDirs, rules);

  return {
    asciiTree: generateAsciiTree(
      dirPath,
      filesAndDirs
        .filter((el) => el.type === 'file')
        .map((el) => {
          const { ext, base, name } = nodePath.parse(el.path);
          return {
            ...el,
            name,
            base,
            ext,
            isIgnored: false,
          };
        }),
    ),
  };
}
