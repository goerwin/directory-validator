import path from 'node:path';
import * as errors from './errors';
import type * as types from './types';
import type { getFilesAndDirectories } from './helpers/file';
import { toCamelCase, toDashCase, toSnakeCase, toUpperCase } from './helpers/string';

function getCorrectStringRegexp(name: string | RegExp) {
  if (typeof name === 'string') {
    if (name[0] === '/' && name[name.length - 1] === '/' && name.length > 0) {
      return RegExp(name.substring(1, name.length - 1));
    }
  }

  return name;
}

function getMultimatchName(nameRule: string) {
  const specialNames: types.SpecialName[] = ['[camelCase]', '[UPPERCASE]', '[dash-case]', '[snake_case]', '*'];

  return specialNames.reduce(
    (result, el) => {
      if (result) {
        return result;
      }

      const ruleSegments = nameRule.split(el);
      if (ruleSegments.length === 2) {
        return {
          type: el,
          leftSide: ruleSegments[0],
          rightSide: ruleSegments[1],
        };
      }

      return result;
    },
    undefined as
      | {
          type: types.SpecialName;
          leftSide: string;
          rightSide: string;
        }
      | undefined,
  );
}

function isNameValid(nameRule: string | RegExp, name: string) {
  if (nameRule instanceof RegExp) {
    return nameRule.test(name);
  }

  const multimatchname = getMultimatchName(nameRule);
  if (multimatchname) {
    const { type, leftSide, rightSide } = multimatchname;
    const rightSideIndexOf = name.lastIndexOf(rightSide);

    if (name.indexOf(leftSide) !== 0) {
      return false;
    }
    if (rightSideIndexOf + rightSide.length !== name.length) {
      return false;
    }

    const filenameToValidate = name.substring(leftSide.length, rightSideIndexOf);
    if (filenameToValidate.length === 0 && type !== '*') {
      return false;
    }

    switch (type) {
      case '[camelCase]':
        return toCamelCase(filenameToValidate) === filenameToValidate;
      case '[UPPERCASE]':
        return toUpperCase(filenameToValidate) === filenameToValidate;
      case '[dash-case]':
        return toDashCase(filenameToValidate) === filenameToValidate;
      case '[snake_case]':
        return toSnakeCase(filenameToValidate) === filenameToValidate;
      case '*':
        return true;
      default:
        return false;
    }
  }

  return nameRule === name;
}

function isFileExtValid(fileExtRule: string | RegExp, ext: string) {
  if (fileExtRule instanceof RegExp) {
    return fileExtRule.test(ext);
  }
  return fileExtRule === ext;
}

function getRuleError(rule: types.FileRule | types.DirectoryRule, path: string) {
  return new errors.ValidatorRuleError(rule, path);
}

function validatePath(element: { path: string; isValid: boolean }) {
  if (!element.isValid) {
    throw new errors.ValidatorInvalidPathError(element.path);
  }
}

function isSelfOrChildrenOfFolder(folderPath: string, childPath: string) {
  return childPath.startsWith(folderPath);
}

function isDirectChildrenOfFolder(folderPath: string, childPath: string) {
  if (!isSelfOrChildrenOfFolder(folderPath, childPath)) return false;

  const childName = childPath.substring(folderPath.length + 1) || childPath;
  return Boolean(childName) && childName !== folderPath && !childName.includes(path.sep);
}

export function run(filesAndDirs: Readonly<ReturnType<typeof getFilesAndDirectories>>, mainRules: types.Rules) {
  if (mainRules.length === 0) {
    return;
  }

  const newFilesAndDirs = filesAndDirs.map((el) => ({ ...el, isValid: false }));

  function validateRules(rules: types.Rules = [], folderPath = '') {
    if (rules.length === 0) return;

    rules.forEach((rule) => {
      if (rule.type === 'common') return;

      rule.name = getCorrectStringRegexp(rule.name);

      const rulePassed = newFilesAndDirs.reduce((result, child) => {
        if (folderPath === '' && child.path === '') {
          child.isValid = true;
          return result;
        }

        if (!isDirectChildrenOfFolder(folderPath, child.path)) return result;

        if (child.type === 'file' && rule.type === 'file') {
          const { base, name, ext } = path.parse(child.path);
          const isValid = !rule.extension
            ? isNameValid(rule.name, base)
            : isNameValid(rule.name, name) && isFileExtValid(getCorrectStringRegexp(rule.extension), ext.substring(1));

          if (!isValid) return result;

          child.isValid = true;
          return true;
        }

        if (child.type === 'dir' && rule.type === 'directory') {
          const { base: dirName } = path.parse(child.path);

          const isValid = isNameValid(rule.name, dirName);

          if (!isValid) return result;

          const childDirPath = path.join(folderPath, dirName);

          if ((rule.rules ?? []).length > 0) {
            validateRules(rule.rules, childDirPath);

            child.isValid = true;
            return true;
          }

          // dir has no rules so mark all its children as valid
          for (const child of newFilesAndDirs) {
            if (!isSelfOrChildrenOfFolder(childDirPath, child.path)) continue;
            child.isValid = true;
          }

          return true;
        }

        return result;
      }, false);

      if (!rulePassed && rule.isOptional) return;

      if (!rulePassed && !rule.isOptional) throw getRuleError(rule, folderPath);
    });
  }

  validateRules(mainRules);

  newFilesAndDirs.forEach(validatePath);
}
