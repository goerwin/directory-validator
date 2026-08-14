import { globSync, readFileSync } from 'node:fs';
import Ajv from 'ajv';
import {
  generateAsciiTree,
  getChildDirs,
  getChildFiles,
} from 'goerwin-helpers/node/file.js';
import * as errors from './errors.ts';
import schema from './resources/schema.json' with { type: 'json' };
import type * as types from './types.ts';
import * as validator from './validator.ts';

type ParsedConfig = {
  ignoreFiles?: string[];
  ignoreDirs?: string[];
  rules: types.Rules;
  commonRules?: Record<string, types.Rule>;
};

function markCommonKey(rule: types.Rule, key: string) {
  const existingKey = (rule as { __commonKey?: string }).__commonKey;
  if (existingKey) {
    return;
  }

  Object.defineProperty(rule, '__commonKey', { value: key, enumerable: false });

  if (rule.type === 'directory') {
    (rule.rules || []).forEach((el) => {
      markCommonKey(el, key);
    });
  }
}

function getConfig(rulesPath: string): types.Config {
  let configJson: ParsedConfig;

  try {
    configJson = JSON.parse(readFileSync(rulesPath, 'utf8'));
  } catch (err) {
    throw new errors.JsonParseError(err, rulesPath);
  }

  const validateWithSchema = (configJson: unknown) => {
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
        let parsedRule = configJson.commonRules?.[rule.key] as
          | types.Rule
          | undefined;

        if (!parsedRule) {
          throw new errors.ConfigJsonValidateError(
            [['Common Rule Invalid', JSON.stringify(rule)]],
            rulesPath,
          );
        }

        parsedRule = structuredClone(parsedRule);
        parsedRule = parseCommonRules([parsedRule])[0] as types.Rule;
        parsedRule.isOptional =
          typeof parsedRule.isOptional === 'undefined'
            ? !!rule.isOptional
            : parsedRule.isOptional;

        const resolvedRule = { ...parsedRule };
        markCommonKey(resolvedRule, rule.key);

        return resolvedRule;
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
  const newIgnoreFiles = ignoreFilesGlob
    ? globSync(ignoreFilesGlob, { cwd: dirPath })
    : [];

  // Ignore Dirs
  let ignoreDirsGlob: string | undefined;
  if (ignoreDirs && ignoreDirs.length > 0) {
    ignoreDirsGlob = `{${[ignoreDirs[0], ...ignoreDirs].join(',')}}`;
  }
  ignoreDirsGlob = options.ignoreDirsGlob || ignoreDirsGlob;
  const newIgnoreDirs = ignoreDirsGlob
    ? globSync(ignoreDirsGlob, { cwd: dirPath })
    : [];

  const files = getChildFiles(dirPath, {
    recursive: true,
    ignoreDirs: newIgnoreDirs,
    ignoreFiles: newIgnoreFiles,
  });

  const emptyDirs = getChildDirs(dirPath, {
    recursive: true,
    ignoreDirs: newIgnoreDirs,
    ignoreFiles: newIgnoreFiles,
  });

  validator.run(
    files.filter((el) => !el.isIgnored).map((el) => el.path),
    rules,
    emptyDirs.filter((el) => !el.isIgnored && el.isEmpty).map((el) => el.path),
  );

  return {
    asciiTree: generateAsciiTree(dirPath, [
      ...files,
      ...emptyDirs.filter((el) => el.isIgnored || el.isEmpty),
    ]),
  };
}
