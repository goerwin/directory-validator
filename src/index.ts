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

export function run(files: string[], configObject: Types.FileDirectoryArray) {
  let newFiles = files.map(el => ({ name: path.normalize(el), isValidated: false }));

  function validateRules(rules: Types.FileDirectoryArray, paths: (string | RegExp)[] = ['.']) {
    if (rules.length === 0) { return; }

    rules.forEach((rule, idx) => {
      if (rule.type === 'directory') {
        const canDirHaveFiles = newFiles.some(el =>
          canFileBelongToThisDir(el.name, paths.concat(rule.name))
        );

        if (!canDirHaveFiles && !rule.isOptional) {
          throw new Error(`${JSON.stringify(rule)}, deep: ${paths.length}, rule did not passed`);
        }

        // If dir rule can multimatch we iterate all possible dirs
        // until validation throws or there are no more files to validate!
        while (rule.name instanceof RegExp || getMultimatchName(rule.name)) {
          try {
            if (newFiles.length === 0) { break; }
            validateRules(rule.rules || [], [...paths, rule.name]);
          } catch (err) {
            break;
          }
        }

        if (rule.isRecursive) {
          // We force rule to optional so we avoid recursively looking for
          // this rule. (It's only needed the first time)
          rule.isOptional = true;

          if (canDirHaveFiles) {
            validateRules([rule], [...paths, rule.name]);
          } else {
            rule.isRecursive = false;
          }
        }

        if (!rule.isOptional || canDirHaveFiles) {
          validateRules(rule.rules || [], [...paths, rule.name]);
        }

        return;
      }

      // File Rule validation

      const filesThatCanBelongToThisDir =
        newFiles.filter(file => canFileBelongToThisDir(file.name, paths));

      const fileRulePassed = filesThatCanBelongToThisDir.reduce((result, file) => {
        const { base, name, ext } = path.parse(file.name);
        let isValid;

        if (!rule.extension) {
          isValid = isNameValid(rule.name, base);
        } else {
          isValid =
            isNameValid(rule.name, name) && isFileExtValid(rule.extension, ext.substring(1));
        }

        file.isValidated = file.isValidated || isValid;
        return result || isValid || !!rule.isOptional;
      }, newFiles.length === 0);

      if (!fileRulePassed) {
        throw new Error(`${JSON.stringify(rule)}, deep: ${paths.length}, rule did not passed`);
      }

      if (idx !== rules.length - 1) { return; }

      // Idea here is to remove all the files that were validated after all rules of
      // a particular directory successfully passed.
      // Since there can be multiple children matches from different dirs, we look for
      // the dirPath with more children validated so that we remove them from the files
      // to validate in the next iteration

      const parentPaths = _.groupBy(filesThatCanBelongToThisDir, el => {
        const pathFragments = el.name.split(path.sep);
        return pathFragments.slice(0, pathFragments.length - 1).join(path.sep);
      });

      const dirPathToRemove = _.keys(parentPaths).reduce((result, el) => {
        if (parentPaths[el].length <= result.length) { return result; }
        return { length: parentPaths[el].length, dirPath: el };
      }, { length: 0, dirPath: '' });

      newFiles = newFiles.filter(el =>
        !filesThatCanBelongToThisDir
          .filter(el => el.isValidated && el.name.indexOf(dirPathToRemove.dirPath) === 0)
          .some(el2 => el === el2)
      );
    });
  }

  validateRules(configObject);

  newFiles.forEach(el => {
    if (!el.isValidated) { throw new Error(`${el.name}, was not validated`); }
  });
}
