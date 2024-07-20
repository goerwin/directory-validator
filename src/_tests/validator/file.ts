import { generateFilesAndDirsFromPaths } from '../../helpers/file';
import type * as types from '../../types';
import * as validator from '../../validator';

export function run() {
  describe('Files:', () => {
    it('should validate using only filenames', () => {
      const files = generateFilesAndDirsFromPaths(['.gitignore', 'package.json']);

      const configObject: types.Rules = [
        { name: 'package.json', type: 'file' },
        { name: '.gitignore', type: 'file' },
      ];

      expect(() => validator.run(files, configObject)).not.toThrow();
    });

    it('should throw because a rule did not passed', () => {
      const files = generateFilesAndDirsFromPaths(['.gitignore', 'package.lul']);

      const configObject: types.Rules = [
        { name: 'package.json', type: 'file' },
        { name: '.gitignore', type: 'file' },
      ];

      expect(() => validator.run(files, configObject)).toThrowError(
        `${JSON.stringify(configObject[0])}, deep: 0, rule did not passed`,
      );
    });

    it('should throw if it has invalid files', () => {
      const files = generateFilesAndDirsFromPaths(['.gitignore', 'package.json', 'extraneous.js']);

      const configObject: types.Rules = [
        { name: 'package', extension: /json/, type: 'file' },
        { name: '.gitignore', type: 'file' },
      ];

      expect(() => validator.run(files, configObject)).toThrowError('extraneous.js, was not validated');
    });

    it('should validate because rule is optional', () => {
      const files = generateFilesAndDirsFromPaths(['.gitignore', 'package.json']);

      const configObject: types.Rules = [
        { name: 'package.json', type: 'file' },
        { name: 'optional.js', type: 'file', isOptional: true },
        { name: '.gitignore', type: 'file' },
      ];

      expect(() => validator.run(files, configObject)).not.toThrow();
    });

    it('should throw because rule is not optional', () => {
      const files = generateFilesAndDirsFromPaths(['.gitignore', 'package.json']);

      const configObject: types.Rules = [
        { name: 'package.json', type: 'file' },
        { name: 'optional.js', type: 'file' },
        { name: '.gitignore', type: 'file' },
      ];

      expect(() => validator.run(files, configObject)).toThrowError(
        `${JSON.stringify(configObject[1])}, deep: 0, rule did not passed`,
      );
    });

    describe('Extension:', () => {
      it('should validate using string', () => {
        const files = generateFilesAndDirsFromPaths(['.gitignore', 'package.json']);

        const configObject: types.Rules = [
          { name: 'package', extension: 'json', type: 'file' },
          { name: '.gitignore', type: 'file' },
        ];

        expect(() => validator.run(files, configObject)).not.toThrow();
      });

      it('should throw because wrong string extension', () => {
        const files = generateFilesAndDirsFromPaths(['.gitignore', 'package.json']);

        const configObject: types.Rules = [
          { name: 'package', extension: '.json', type: 'file' },
          { name: '.gitignore', type: 'file' },
        ];

        expect(() => validator.run(files, configObject)).toThrowError(
          `${JSON.stringify(configObject[0])}, deep: 0, rule did not passed`,
        );
      });

      it('should validate using regex', () => {
        const files = generateFilesAndDirsFromPaths(['.gitignore', 'package.json']);

        const configObject: types.Rules = [
          { name: 'package', extension: /(json|js)/, type: 'file' },
          { name: '.gitignore', type: 'file' },
        ];

        expect(() => validator.run(files, configObject)).not.toThrow();
      });

      it('should validate using regex as string', () => {
        const files = generateFilesAndDirsFromPaths(['.gitignore', 'package.json']);

        const configObject: types.Rules = [
          { name: 'package', extension: '/(json|js)/', type: 'file' },
          { name: '.gitignore', type: 'file' },
        ];

        expect(() => validator.run(files, configObject)).not.toThrow();
      });

      it('should throw because wrong regex extension', () => {
        const files = generateFilesAndDirsFromPaths(['.gitignore', 'package.json']);

        const configObject: types.Rules = [
          { name: 'package', extension: /.(json|js)/, type: 'file' },
          { name: '.gitignore', type: 'file' },
        ];

        expect(() => validator.run(files, configObject)).toThrowError(
          `${JSON.stringify(configObject[0])}, deep: 0, rule did not passed`,
        );
      });
    });

    describe('[camelCase]:', () => {
      it('should validate filenames starting camelcased', () => {
        const files = generateFilesAndDirsFromPaths(['camelizedNamedPogChamp.json', 'package.json']);

        const configObject: types.Rules = [{ name: '[camelCase].json', type: 'file' }];

        expect(() => validator.run(files, configObject)).not.toThrow();
      });

      it('should validate filenames ending camelcased', () => {
        const files = generateFilesAndDirsFromPaths(['_ERcamelizedNamedPogChamp']);

        const configObject: types.Rules = [{ name: '_ER[camelCase]', type: 'file' }];

        expect(() => validator.run(files, configObject)).not.toThrow();
      });

      it('should throw because one file is not camelcased as first/last', () => {
        const files = generateFilesAndDirsFromPaths(['camelizedNamedPogChamp.json', 'package.json', 'no-camelcase.js']);

        const configObject: types.Rules = [{ name: '[camelCase].json', type: 'file' }];

        expect(() => validator.run(files, configObject)).toThrowError('no-camelcase.js, was not validated');

        const files2 = generateFilesAndDirsFromPaths([
          'no-camelcase.js',
          'camelizedNamedPogChamp.json',
          'package.json',
        ]);

        expect(() => validator.run(files2, configObject)).toThrowError('no-camelcase.js, was not validated');
      });
    });

    describe('*:', () => {
      it('should validate all files', () => {
        const files = generateFilesAndDirsFromPaths(['.gitignore', 'package.json']);

        const configObject: types.Rules = [
          { name: 'package.json', type: 'file' },
          { name: '.*', type: 'file' },
        ];

        expect(() => validator.run(files, configObject)).not.toThrow();
      });
    });

    describe('RegExp:', () => {
      it('should validate filenames', () => {
        const files = generateFilesAndDirsFromPaths(['index.js', 'package.map']);

        const configObject: types.Rules = [{ name: /[a-z]\.(js|map)/, type: 'file' }];

        expect(() => validator.run(files, configObject)).not.toThrow();
      });

      it('should throw because one file does not match', () => {
        const files = generateFilesAndDirsFromPaths(['index.js', 'package.map', 'rip8.js']);

        const configObject: types.Rules = [{ name: /[a-z]\.(js|map)/, type: 'file' }];

        expect(() => validator.run(files, configObject)).toThrowError('rip8.js, was not validated');
      });
    });
  });
}
