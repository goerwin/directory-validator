import * as _ from 'lodash';
import * as nodeHelpers from 'node-helpers';
import * as path from 'path';

export interface File {
  type: 'file';
  name: string;
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

      const filename = rule.name;
      const fileExt = rule.extension;
      let fileRulePassed = false;

      fileRulePassed = newFiles
        .filter(file => {
          const doesFileBelongsToThisDir =
            path.dirname(file.name) === path.normalize(paths.join(path.sep));

          const isFileInCurrentDeep = file.name.split(path.sep).length === paths.length;
          return doesFileBelongsToThisDir && isFileInCurrentDeep;
        })
        .reduce((result, file) => {
          const { base, name, ext } = path.parse(file.name);
          const correctExt = ext.substring(1);
          let evaluation = true;

          if (!fileExt) {
            if (filename !== base) { evaluation = false; }
          } else if (filename !== name) {
            evaluation = false;
          } else if (fileExt instanceof RegExp) {
            if (!fileExt.test(correctExt)) { evaluation = false; }
          } else if (fileExt !== correctExt) {
            evaluation = false;
          }

          file.isValidated = file.isValidated || evaluation || !!rule.isOptional;
          return result || evaluation || !!rule.isOptional;
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
