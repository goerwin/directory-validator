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
  const newFiles = files.map(el => ({ name: path.normalize(el), isValidated: false }));

  const validateChildren = (
    children: Types.FileDirectoryArray,
    paths: (string | RegExp)[] = ['.']
  ) => {
    if (children.length === 0) {
      return;
    }

    children.forEach(rule => {
      if (rule.type === 'directory') {
        const canDirHaveFiles = newFiles.some(el =>
          canFileBelongToThisDir(el.name, paths.concat(rule.name))
        );

        if (!canDirHaveFiles && !rule.isOptional) {
          throw new Error(`${JSON.stringify(rule)}, deep: ${paths.length}, rule did not passed`);
        }

        if (rule.isRecursive) {
          if (canDirHaveFiles) {
            rule.isOptional = true;
            validateChildren([rule], [...paths, rule.name]);
          } else {
            rule.isOptional = true;
            rule.isRecursive = false;
          }
        }

        if (!rule.isOptional || canDirHaveFiles) {
          validateChildren(rule.children || [], [...paths, rule.name]);
        }

        return;
      }

      const filenameRule = rule.name;
      const fileExtRule = rule.extension;
      let fileRulePassed = false;

      fileRulePassed = newFiles
        .filter(file => canFileBelongToThisDir(file.name, paths))
        .reduce((result, file) => {
          const { base, name, ext } = path.parse(file.name);
          const newExt = ext.substring(1);
          let isFileValid;

          if (!fileExtRule) {
            isFileValid = isNameValid(filenameRule, base);
          } else {
            isFileValid = isNameValid(filenameRule, name) && isFileExtValid(fileExtRule, newExt);
          }

          file.isValidated = file.isValidated || isFileValid || !!rule.isOptional;
          return result || isFileValid || !!rule.isOptional;
        }, false);

      if (!fileRulePassed) {
        throw new Error(`${JSON.stringify(rule)}, deep: ${paths.length}, rule did not passed`);
      }
    });
  };

  validateChildren(configObject);

  newFiles.forEach(el => {
    if (!el.isValidated) { throw new Error(`${el.name}, was not validated`); }
  });
}
