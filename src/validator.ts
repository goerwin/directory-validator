import _ from 'lodash';
import path from 'node:path';
import * as errors from './errors';
import type * as types from './types';
import type { getFilesAndDirectories } from './helpers/file';

function getCorrectStringRegexp(name: string | RegExp) {
  if (typeof name === 'string') {
    if (name[0] === '/' && name[name.length - 1] === '/' && name.length > 0) {
      return RegExp(name.substring(1, name.length - 1));
    }
  }

  return name;
}

function getMultimatchName(nameRule: string) {
  const specialNames: types.SpecialName[] = [
    '[camelCase]',
    '[UPPERCASE]',
    '[dash-case]',
    '[snake_case]',
    '*',
  ];

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

function getDirFiles(
  files: { path: string; type: 'file' | 'dir' }[],
  paths: (string | RegExp)[],
  isRecursive = false,
) {
  return files.filter((el) => {
    let pathSegments = el.path.split(path.sep);
    pathSegments = pathSegments.slice(0, pathSegments.length - 1);
    const parentPaths = paths.slice(1, paths.length);

    if (isRecursive) {
      if (parentPaths.length > pathSegments.length) {
        return false;
      }
    } else {
      if (parentPaths.length !== pathSegments.length) {
        return false;
      }
    }

    return parentPaths.every((el, i) => isNameValid(el, pathSegments[i]));
  });
}

function getDirChildren(
  filesAndDirs: { path: string; type: 'file' | 'dir' }[],
  dirPath: string,
) {
  return filesAndDirs.filter((item) => {
    if (item.path.indexOf(dirPath) !== 0) return false;
    if (item.path === dirPath) return false;
    return item.path.indexOf('/', dirPath.length + 1) === -1;
  });
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

    const filenameToValidate = name.substring(
      leftSide.length,
      rightSideIndexOf,
    );
    if (filenameToValidate.length === 0 && type !== '*') {
      return false;
    }

    switch (type) {
      case '[camelCase]':
        return _.camelCase(filenameToValidate) === filenameToValidate;
      case '[UPPERCASE]':
        return _.upperCase(filenameToValidate) === filenameToValidate;
      case '[dash-case]':
        return _.kebabCase(filenameToValidate) === filenameToValidate;
      case '[snake_case]':
        return _.snakeCase(filenameToValidate) === filenameToValidate;
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

function getFilesByParentDir(files: types.ValidatableFile[]) {
  return _.groupBy(files, (el) => {
    const pathFragments = el.path.split(path.sep);
    return pathFragments.slice(0, pathFragments.length - 1).join(path.sep);
  });
}

function getValidatableFiles(files: string[]): types.ValidatableFile[] {
  return files.map((el) => ({
    path: path.normalize(el),
    isGood: false,
    isValidated: false,
  }));
}

function getRuleError(
  rule: types.FileRule | types.DirectoryRule,
  paths: (string | RegExp)[],
) {
  return new errors.ValidatorRuleError(rule, paths);
}

function validatePath(element: { path: string; isValid: boolean }) {
  if (!element.isValid) {
    throw new errors.ValidatorInvalidPathError(element.path);
  }
}

export function run(
  filesAndDirs: ReturnType<typeof getFilesAndDirectories>,
  mainRules: types.Rules,
) {
  if (mainRules.length === 0) {
    return;
  }

  function validateRules(rules: types.Rules = [], dirPath = '') {
    if (rules.length === 0) return;

    const dirChildren = getDirChildren(filesAndDirs, dirPath);

    rules.forEach((rule) => {
      // todo: this should not ever be the case, common rules should be already be parsed
      if (rule.type === 'common') return;

      rule.name = getCorrectStringRegexp(rule.name);

      if (rule.type === 'file') {
        // IF at least one file matches the rule then it passes
        // also mark all files that were validated
        const fileRulePassed = dirChildren.reduce((result, child) => {
          if (child.type === 'dir') return result;

          const { base, name, ext } = path.parse(child.path);
          let isFileValid = false;

          if (!rule.extension) {
            isFileValid = isNameValid(rule.name, base);
          } else
            isFileValid =
              isNameValid(rule.name, name) &&
              isFileExtValid(
                getCorrectStringRegexp(rule.extension),
                ext.substring(1),
              );

          child.isValid = isFileValid;

          return result || isFileValid;
        }, false);

        if (!fileRulePassed && !rule.isOptional)
          throw getRuleError(rule, [dirPath]);

        // // Mark as good all files that were validated
        // dirFiles
        //   .filter((el) => el.isValidated)
        //   .forEach((el) => {
        //     el.isGood = true;
        //   });

        // newFiles.forEach((el) => {
        //   el.isValidated = false;
        // });

        return;
      }

      // Directory Rule

      // if at least one dir matches the rule then it passes
      const dirRulePassed = dirChildren.reduce((result, child) => {
        if (child.type === 'file') return result;

        const dirName = child.path.split('/').at(-1);
        if (!dirName) return result;

        const isValid = isNameValid(rule.name, dirName);

        child.isValid = isValid;

        return result || isValid;
      }, false);

      if (!dirRulePassed && !rule.isOptional)
        throw getRuleError(rule, [dirPath]);

      // const dirFiles = getDirFiles(newFiles, [...paths, rule.name], true);
      // const emptyDir = newEmptyDirs.find(
      //   (el) =>
      //     el.path === path.normalize([...paths, rule.name].join(path.sep)),
      // );

      // If no rules for this dir, it should mark all its children as valid
      // if ((rule.rules || []).length === 0) {
      //   dirChildren.forEach((child) => {
      //     child.isValid = true;
      //   });

      //   return;
      // }

      // If dir is empty or only has other dirs/folders
      // if (dirFiles.length === 0) {
      //   if (rule.isOptional) {
      //     return;
      //   }

      //   throw getRuleError(rule, paths);
      //   // validateRules(rule.rules, [...paths, rule.name]);
      //   // return;

      //   // throw getRuleError(rule, paths);
      // }

      // console.log('bb', 3, rule.rules);

      // if (rule.name instanceof RegExp || getMultimatchName(rule.name)) {
      //   const parentPaths = getFilesByParentDir(dirFiles);
      //   const parentPathsArray = _.keys(parentPaths);
      //   const nextDirNamesChecked: string[] = [];

      //   for (let i = 0; i < parentPathsArray.length; i += 1) {
      //     // Only look for the nextDirName (no recursively) to form the new path.
      //     // So in case we have a file 'a/b/c/d.js', we only iterate on [...paths, 'a']
      //     const nextDirName = parentPathsArray[i].split(path.sep)[
      //       paths.length - 1
      //     ];
      //     if (!nextDirNamesChecked.includes(nextDirName)) {
      //       nextDirNamesChecked.push(nextDirName);
      //       validateRules(rule.rules, [...paths, nextDirName]);
      //     }
      //   }

      //   return;
      // }

      // if (rule.isRecursive) {
      //   // We force rule to optional so we avoid recursively looking for
      //   // this rule. (It's only needed the first time)
      //   rule.isOptional = true;

      //   validateRules([rule], [...paths, rule.name]);
      //   validateRules(rule.rules, [...paths, rule.name]);
      //   return;
      // }

      // todo: implement recursive
      validateRules(rule.rules, [...paths, rule.name]);
    });
  }

  validateRules(mainRules);

  // at the end, check that all files were validated
  // filesAndDirs.forEach(validatePath);
}
