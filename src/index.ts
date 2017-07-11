import * as _ from 'lodash';
import * as path from 'path';
import '../types';

export default (files: string[], configObject: Types.FileDirectoryArray) => {
  const newFiles = files.map(el => ({ name: el, isValidated: false }));

  const validateChildren = (children: Types.FileDirectoryArray) => {
    if (children.length === 0) {
      return;
    }

    children.forEach(el => {
      if (el.type === 'directory') { return validateChildren(el.children || []); }

      const filename = el.name;
      const fileExt = el.extension;
      let fileRulePassed = false;

      fileRulePassed = newFiles.some(file => {
        const { base, name, ext } = path.parse(file.name);
        const correctExt = ext.substring(1);

        if (!fileExt) {
          if (filename !== base) { return false; }
        } else {
          if (filename !== name) { return false; }

          if (fileExt instanceof RegExp) {
            if (!fileExt.test(correctExt)) { return false; }
          } else if (fileExt !== correctExt) { return false; }
        }

        file.isValidated = true;
        return true;
      });

      if (!fileRulePassed && !el.isOptional) {
        throw new Error(`${JSON.stringify(el)}, rule did not passed`);
      }
    });
  };

  validateChildren(configObject);

  newFiles.forEach(el => {
    if (!el.isValidated) { throw new Error(`${el.name}, was not validated`); }
  });

  // configObject.forEach((el, i) => {
  //   const filename = el.name;

  //   if (el.type === 'directory') {

  //   } else {
  //     const fileExt = el.extension;
  //     let fileRulePassed = false;

  //     fileRulePassed = newFiles.some(file => {
  //       const { base, name, ext } = path.parse(file.name);
  //       const correctExt = ext.substring(1);

  //       if (!fileExt) {
  //         if (filename !== base) { return false; }
  //       } else {
  //         if (filename !== name) { return false; }

  //         if (fileExt instanceof RegExp) {
  //           if (!fileExt.test(correctExt)) { return false; }
  //         } else if (fileExt !== correctExt) { return false; }
  //       }

  //       file.isValidated = true;
  //       return true;
  //     });

  //     if (!fileRulePassed && !el.isOptional) {
  //       throw new Error(`${JSON.stringify(el)}, rule did not passed`);
  //     }
  //   }
  // });

  // newFiles.forEach(el => {
  //   if (!el.isValidated) { throw new Error(`${el.name}, was not validated`); }
  // });
};
