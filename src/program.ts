import * as _ from 'lodash';
import * as nodeHelpers from 'node-helpers';
import * as path from 'path';
import * as Types from './types';

function getMultimatchName(nameRule: string) {
  return ['[camelCase]', '[UPPERCASE]', '[dash-case]', '[snake_case]']
    .reduce((result, el) => {
      if (result) { return result; }

      const ruleSegments = nameRule.split(el);
      if (ruleSegments.length === 2) {
        return { type: el, leftSide: ruleSegments[0], rightSide: ruleSegments[1] };
      }

      return result;
    }, undefined) as {
      type: '[camelCase]' | '[UPPERCASE]' | '[dash-case]' | '[snake_case]';
      leftSide: string;
      rightSide: string;
    } | undefined;
}

function canFileBelongToThisDir(filePath: string, parentPaths: (string | RegExp)[]) {
  let pathSegments = filePath.split(path.sep);
  pathSegments = pathSegments.slice(0, pathSegments.length - 1);
  parentPaths = parentPaths.slice(1, parentPaths.length);

  if (parentPaths.length !== pathSegments.length) { return false; }
  return pathSegments.every((el, i) => isNameValid(parentPaths[i], el));
}

function isNameValid(nameRule: string | RegExp, name: string) {
  if (nameRule instanceof RegExp) {
    return nameRule.test(name);
  }

  const multimatchname = getMultimatchName(nameRule);
  if (multimatchname) {
    const { type, leftSide, rightSide } = multimatchname;
    const rightSideIndexOf = name.lastIndexOf(rightSide);

    if (name.indexOf(leftSide) !== 0) { return false; }
    if ((rightSideIndexOf + rightSide.length) !== name.length) { return false; }

    const filenameToValidate = name.substring(leftSide.length, rightSideIndexOf);
    if (filenameToValidate.length === 0) { return false; }

    switch (type) {
      case '[camelCase]': return _.camelCase(filenameToValidate) === filenameToValidate;
      case '[UPPERCASE]': return _.upperCase(filenameToValidate) === filenameToValidate;
      case '[dash-case]': return _.kebabCase(filenameToValidate) === filenameToValidate;
      case '[snake_case]': return _.snakeCase(filenameToValidate) === filenameToValidate;
      default: return false;
    }
  }

  return nameRule === name;
}

function isFileExtValid(fileExtRule: string | RegExp, ext: string) {
  if (fileExtRule instanceof RegExp) { return fileExtRule.test(ext); }
  return fileExtRule === ext;
}

function canDirExist(paths: (string | RegExp)[], files: string[]) {
  return files.some(el => canFileBelongToThisDir(el, paths));
}

function getFilePathsGroupedByParent(files: { path: string }[]) {
  return _.groupBy(files, el => {
    const pathFragments = el.path.split(path.sep);
    return pathFragments.slice(0, pathFragments.length - 1).join(path.sep);
  });
}

export function run(files: string[], mainRules: Types.FileDirectoryArray) {
  if (files.length === 0) { return; }
  if (mainRules.length === 0) { return; }

  const newFiles = files
    .map(el => ({ path: path.normalize(el), isGood: false, isValidated: false }));

  function validateRules(
    rules: Types.FileDirectoryArray = [],
    paths: (string | RegExp)[] = ['.']
  ) {
    if (rules.length === 0) { return; }

    rules.forEach((rule, idx) => {
      if (rule.type === 'file') {
        const filesThatCanBelongToThisDir =
          newFiles.filter(file => canFileBelongToThisDir(file.path, paths));

        // IF more than one file matches the rule then it passes
        const fileRulePassed = filesThatCanBelongToThisDir.reduce((result, file) => {
          const { base, name, ext } = path.parse(file.path);
          let isFileValid;

          if (!rule.extension) {
            isFileValid = isNameValid(rule.name, base);
          } else {
            isFileValid =
              isNameValid(rule.name, name) && isFileExtValid(rule.extension, ext.substring(1));
          }

          file.isValidated = file.isValidated || isFileValid;
          return result || isFileValid;
        }, newFiles.length === 0);

        if (!fileRulePassed && !rule.isOptional) {
          throw new Error(`${JSON.stringify(rule)}, deep: ${paths.length}, rule did not passed`);
        }

        // Idea here is to remove all the files that were validated after all rules of
        // a particular directory successfully passed.
        // Since there can be multiple children matches from different dirs, we look for
        // the dirPath with more children validated so that we remove them from the files
        // to validate in the next iteration
        if (rules.slice(idx + 1).some(el => el.type === 'file')) { return; }

        const parentPaths = getFilePathsGroupedByParent(filesThatCanBelongToThisDir);

        const dirPathToRemove = _.keys(parentPaths).reduce((result, el) => {
          if (parentPaths[el].length <= result.length) { return result; }
          return { length: parentPaths[el].length, dirPath: el };
        }, { length: 0, dirPath: '' });

        filesThatCanBelongToThisDir
          .filter(el => el.isValidated && el.path.indexOf(dirPathToRemove.dirPath) === 0)
          .forEach(el => { el.isGood = true; });

        newFiles.forEach(el => { el.isValidated = false; });

        return;
      }

      // Directory Rule

      const filesThatCanBelongToThisDir = newFiles
        .filter(el => canFileBelongToThisDir(el.path, [...paths, rule.name]));

      const canThisDirExist = canDirExist([...paths, rule.name], newFiles.map(el => el.path));

      if (!canThisDirExist) {
        rule.isRecursive = false;
        if (rule.isOptional) { return; }
        throw new Error(`${JSON.stringify(rule)}, deep: ${paths.length}, rule did not passed`);
      }

      if ((rule.rules || []).length === 0) {
        filesThatCanBelongToThisDir.forEach(el => { el.isGood = true; });
        return;
      }

      if (filesThatCanBelongToThisDir.length === 0) {
        throw new Error(`${JSON.stringify(rule)}, deep: ${paths.length}, rule did not passed`);
      }

      if (rule.isRecursive) {
        // We force rule to optional so we avoid recursively looking for
        // this rule. (It's only needed the first time)
        rule.isOptional = true;

        validateRules([rule], [...paths, rule.name]);
        validateRules(rule.rules, [...paths, rule.name]);
        return;
      }

      // If dir rule can multimatch we iterate all possible dirs
      // until validation throws or there are no more files to validate!

      if (rule.name instanceof RegExp || getMultimatchName(rule.name)) {
        const parentPaths = getFilePathsGroupedByParent(filesThatCanBelongToThisDir);
        const parentPathsArray = _.keys(parentPaths);

        for (let i = 0; i < parentPathsArray.length; i += 1) {
          validateRules(rule.rules, [...paths, parentPathsArray[i]]);
        }

        return;
      }

      if (!rule.isOptional) {
        validateRules(rule.rules, [...paths, rule.name]);
      }
    });
  }

  validateRules(mainRules);

  newFiles.forEach(el => {
    if (!el.isGood) { throw new Error(`${el.path}, was not validated`); }
  });
}
