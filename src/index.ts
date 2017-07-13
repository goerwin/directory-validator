import * as _ from 'lodash';
import * as nodeHelpers from 'node-helpers';
import * as path from 'path';

// TODO: Move this to an external types file
export interface File {
  type: 'file';
  name: string | RegExp;
  extension?: string | RegExp;
  isOptional?: boolean;
}

export interface Directory {
  type: 'directory';
  name: string;
  isOptional?: boolean;
  isRecursive?: boolean;
  children?: (Directory | File)[];
}

export type FileDirectoryArray = (File | Directory)[];

// function canFileBelongsToThisDir(elPath: string, parentPaths: string[]) {
//   const pathSegments = elPath.split(path.sep);
//   if (parentPaths.length !== pathSegments.length) { return false; }

//   // package.json
//   // .
//   pathSegments.slice(0, pathSegments.length - 1).every
//   // [package.json, src]
//   // [., src]
//   switch (elPath) {
//     case '[camelCase]': {

//     }
//   }
// }

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
  return fileExtRule !== ext;
}

export function run(files: string[], configObject: FileDirectoryArray) {
  const newFiles = files.map(el => ({ name: path.normalize(el), isValidated: false }));

  const validateChildren = (children: FileDirectoryArray, paths: string[] = ['.']) => {
    if (children.length === 0) {
      return;
    }

    children.forEach(rule => {
      if (rule.type === 'directory') {
        const dirPath = path.normalize(paths.concat(rule.name).join(path.sep));
        const areTherePossibleFiles = newFiles.some(el => el.name.indexOf(dirPath) === 0);

        if (!areTherePossibleFiles && !rule.isOptional) {
          throw new Error(`${JSON.stringify(rule)}, deep: ${paths.length}, rule did not passed`);
        }

        if (rule.isRecursive) {
          if (areTherePossibleFiles) {
            rule.isOptional = true;
            validateChildren([rule], [...paths, rule.name]);
          } else {
            rule.isOptional = true;
            rule.isRecursive = false;
          }
        }

        if (!rule.isOptional || areTherePossibleFiles) {
          validateChildren(rule.children || [], [...paths, rule.name]);
        }

        return;
      }

      const filenameRule = rule.name;
      const fileExtRule = rule.extension;
      let fileRulePassed = false;

      fileRulePassed = newFiles
        .filter(file => {
          const doesFileBelongsToThisDir =
            path.dirname(file.name) === path.normalize(paths.join(path.sep));
          // TODO: Get possible directories
          // canFileBelongsToThisDir(file.name, paths);

          const isFileInCurrentDeep = file.name.split(path.sep).length === paths.length;
          return doesFileBelongsToThisDir && isFileInCurrentDeep;
        })
        .reduce((result, file) => {
          const { base, name, ext } = path.parse(file.name);
          const correctExt = ext.substring(1);
          let isFileValid;

          if (!fileExtRule) {
            isFileValid = isNameValid(filenameRule, base);
          } else {
            isFileValid = isNameValid(filenameRule, name) && isFileExtValid(fileExtRule, ext);
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
