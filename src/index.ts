import * as _ from 'lodash';
import * as path from 'path';
import '../types';

export default (files: string[], configObject: Types.FileDirectoryArray) => {
  const newFiles = files.map(el => ({ name: el, isValidated: false }));

  const validateChildren = (children: Types.FileDirectoryArray, paths: string[] = ['.']) => {
    if (children.length === 0) {
      return;
    }

    children.forEach(rule => {
      if (rule.type === 'directory') {
        const dirPath = paths.concat(rule.name).join('/');

        if (!rule.isOptional || newFiles.some(el => el.name.indexOf(dirPath) === 0)) {
          validateChildren(rule.children || [], [...paths, rule.name]);
        }

        return;
      }

      const filename = rule.name;
      const fileExt = rule.extension;
      let fileRulePassed = false;

      fileRulePassed = newFiles
        .filter(file => {
          const doesFileBelongsToThisDir = path.dirname(file.name) === paths.join('/');
          const isFileInCurrentDeep = file.name.split('/').length === paths.length + 1;
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
};
