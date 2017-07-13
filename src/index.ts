import * as _ from 'lodash';
import * as nodeHelpers from 'node-helpers';
import * as path from 'path';
import * as Types from './types';

function canFileBelongToThisDir(filePath: string, parentPaths: (string | RegExp)[]) {
  let pathSegments = filePath.split(path.sep);
  pathSegments = pathSegments.slice(0, pathSegments.length - 1);
  parentPaths = parentPaths.slice(1, parentPaths.length);

  if (parentPaths.length !== pathSegments.length) { return false; }
  return pathSegments.every((el, i) => isNameValid(parentPaths[i], el));
}

function isNameValid(nameRule: string | RegExp, name: string) {
  if (typeof nameRule === 'string') {
    const camelCaseRuleSegments = nameRule.split('[camelCase]');
    if (camelCaseRuleSegments.length === 2) {
      const leftSide = camelCaseRuleSegments[0];
      const rightSide = camelCaseRuleSegments[1];
      const rightSideIndexOf = name.lastIndexOf(rightSide);

      if (name.indexOf(leftSide) !== 0) { return false; }
      if ((rightSideIndexOf + rightSide.length) !== name.length) { return false; }

      const filenameToValidate = name.substring(leftSide.length, rightSideIndexOf);
      if (filenameToValidate.length === 0) { return false; }

      return _.camelCase(filenameToValidate) === filenameToValidate;
    }

    return nameRule === name;
  }

  return nameRule.test(name);
}

function isFileExtValid(fileExtRule: string | RegExp, ext: string) {
  if (fileExtRule instanceof RegExp) { return fileExtRule.test(ext); }
  return fileExtRule === ext;
}

export function run(files: string[], configObject: Types.FileDirectoryArray) {
  let newFiles = files.map(el => ({ name: path.normalize(el), isValidated: false }));

  function validateRules(rules: Types.FileDirectoryArray, paths: (string | RegExp)[] = ['.']) {
    if (rules.length === 0) { return; }

    rules.forEach(rule => {
      if (rule.type === 'directory') {
        const canDirHaveFiles = newFiles.some(el =>
          canFileBelongToThisDir(el.name, paths.concat(rule.name))
        );

        if (!canDirHaveFiles && !rule.isOptional) {
          throw new Error(`${JSON.stringify(rule)}, deep: ${paths.length}, rule did not passed`);
        }

        if (rule.name === '[camelCase]') {
          let isValidating = true;

          while (isValidating) {
            try {
              if (newFiles.length === 0) { break; }
              validateRules(rule.rules || [], [...paths, rule.name]);
            } catch (err) {
              isValidating = false;
            }
          }
        }

        if (rule.isRecursive) {
          if (canDirHaveFiles) {
            rule.isOptional = true;
            validateRules([rule], [...paths, rule.name]);
          } else {
            rule.isOptional = true;
            rule.isRecursive = false;
          }
        }

        if (!rule.isOptional || canDirHaveFiles) {
          // TODO: Change name children to rules
          validateRules(rule.rules || [], [...paths, rule.name]);
        }

        return;
      }

      const filenameRule = rule.name;
      const fileExtRule = rule.extension;

      const filesThatCanBelongToThisDir = newFiles
        .filter(file => canFileBelongToThisDir(file.name, paths));

      const fileRulePassed = filesThatCanBelongToThisDir.reduce((result, file) => {
        const { base, name, ext } = path.parse(file.name);

        if (!fileExtRule) {
          file.isValidated = isNameValid(filenameRule, base);
        } else {
          file.isValidated =
            isNameValid(filenameRule, name) && isFileExtValid(fileExtRule, ext.substring(1));
        }

        return result || file.isValidated || !!rule.isOptional;
      }, newFiles.length === 0);

      if (!fileRulePassed) {
        throw new Error(`${JSON.stringify(rule)}, deep: ${paths.length}, rule did not passed`);
      }

      const parentPaths = _.groupBy(filesThatCanBelongToThisDir, el => {
        const pathFragments = el.name.split(path.sep);
        return pathFragments.slice(0, pathFragments.length - 1).join(path.sep);
      });

      const dirPathToRemove = _.keys(parentPaths).reduce((result, el) => {
        if (parentPaths[el].length <= result.length) { return result; }
        return { length: parentPaths[el].length, dirPath: el };
      }, { length: 0, dirPath: '' });

      // Removing files validated
      newFiles = newFiles.filter(el =>
        !filesThatCanBelongToThisDir
          .filter(el => {
            return el.isValidated && el.name.indexOf(dirPathToRemove.dirPath) === 0;
          })
          .some(el2 => el === el2)
      );
    });
  }

  validateRules(configObject);

  newFiles.forEach(el => {
    if (!el.isValidated) { throw new Error(`${el.name}, was not validated`); }
  });
}
