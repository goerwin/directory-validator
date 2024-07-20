import { generateFilesAndDirsFromPaths } from '../../helpers/file';
import type * as types from '../../types';
import * as validator from '../../validator';

export function run() {
  describe('Files/Directories:', () => {
    it('should validate basic directories/files mixed', () => {
      const files = generateFilesAndDirsFromPaths(['package.json', '.gitignore', 'src/nice file.js', 'src/blue.conf']);

      const configObject: types.Rules = [
        { name: '.gitignore', type: 'file' },
        { name: 'package.json', type: 'file' },
        {
          name: 'src',
          type: 'directory',
          rules: [
            { name: 'nice file.js', type: 'file' },
            { name: 'blue.conf', type: 'file' },
          ],
        },
      ];

      expect(() => validator.run(files, configObject)).not.toThrow();
    });

    it('should validate a complex tree with no recursion', () => {
      const files = generateFilesAndDirsFromPaths([
        'src/nice file.js',
        'src/blue.conf',
        'src/dir2/index.js',
        'src/dir2/dir2-1/index.js',
        'src/dir2/dir2-2/index.js',
        'src/dir3/index.js',
        'src/dir4/index.js',
      ]);

      const configObject: types.Rules = [
        {
          name: 'src',
          type: 'directory',
          rules: [
            { name: 'nice file.js', type: 'file' },
            { name: 'blue.conf', type: 'file' },
            {
              name: 'dir2',
              type: 'directory',
              rules: [
                { name: 'index.js', type: 'file' },
                {
                  name: 'dir2-1',
                  type: 'directory',
                  rules: [{ name: 'index.js', type: 'file' }],
                },
                {
                  name: 'dir2-2',
                  type: 'directory',
                  rules: [{ name: 'index.js', type: 'file' }],
                },
              ],
            },
            {
              name: 'dir3',
              type: 'directory',
              rules: [{ name: 'index.js', type: 'file' }],
            },
            {
              name: 'dir4',
              type: 'directory',
              rules: [{ name: 'index.js', type: 'file' }],
            },
          ],
        },
      ];

      expect(() => validator.run(files, configObject)).not.toThrow();
    });

    it('should validate a simple tree with recursion', () => {
      const files = generateFilesAndDirsFromPaths([
        'src/index.js',
        'src/src/index.js',
        'src/src/src/index.js',
        'src/src/src/src/index.js',
      ]);

      const configObject: types.Rules = [
        {
          name: 'src',
          type: 'directory',
          isRecursive: true,
          rules: [{ name: 'index.js', type: 'file' }],
        },
      ];

      expect(() => validator.run(files, configObject)).not.toThrow();
    });

    it('should not throw because recursive rule is optional', () => {
      const files = generateFilesAndDirsFromPaths(['package.json']);

      const configObject: types.Rules = [
        { name: 'package.json', type: 'file' },
        {
          name: 'src',
          type: 'directory',
          isRecursive: true,
          isOptional: true,
          rules: [{ name: 'index.js', type: 'file' }],
        },
      ];

      expect(() => validator.run(files, configObject)).not.toThrow();
    });

    it(`should throw in a simple tree with
        recursion and optional because recursive folder not found`, () => {
      const files = generateFilesAndDirsFromPaths(['package.json', '.gitignore']);

      const configObject: types.Rules = [
        { name: '.gitignore', type: 'file' },
        { name: 'package.json', type: 'file' },
        {
          name: 'src',
          type: 'directory',
          isRecursive: true,
          rules: [{ name: 'index.js', type: 'file' }],
        },
      ];

      expect(() => validator.run(files, configObject)).toThrowError(
        `${JSON.stringify(configObject[2])}, deep: 0, rule did not passed`,
      );
    });

    it('should throw a simple tree with recursion because random file', () => {
      const files = generateFilesAndDirsFromPaths([
        'src/index.js',
        'src/src/index.js',
        'src/src/src/index.js',
        'src/src/src/index2.js',
        'src/src/src/src/index.js',
      ]);

      const configObject: types.Rules = [
        {
          name: 'src',
          type: 'directory',
          isRecursive: true,
          rules: [{ name: 'index.js', type: 'file' }],
        },
      ];

      expect(() => validator.run(files, configObject)).toThrowError('src/src/src/index2.js, was not validated');
    });

    it(`should throw when files with same name in same level but
        different directories and one dir does not allow them`, () => {
      const files = generateFilesAndDirsFromPaths([
        'src/nice file.js',
        'src/blue.conf',
        'src/dir2/index.js',
        'src/dir2/dir2-1/index.js',
        'src/dir2/dir2-2/index.js',
        'src/dir2/dir2-2/index2.js',
        'src/dir3/index.js',
        'src/dir4/index.js',
      ]);

      const configObject: types.Rules = [
        {
          name: 'src',
          type: 'directory',
          rules: [
            { name: 'nice file.js', type: 'file' },
            { name: 'blue.conf', type: 'file' },
            {
              name: 'dir2',
              type: 'directory',
              rules: [
                { name: 'index.js', type: 'file' },
                {
                  name: 'dir2-1',
                  type: 'directory',
                  rules: [{ name: 'index.js', type: 'file' }],
                },
                {
                  name: 'dir2-2',
                  type: 'directory',
                  rules: [{ name: 'index2.js', type: 'file' }],
                },
              ],
            },
            {
              name: 'dir3',
              type: 'directory',
              rules: [{ name: 'index.js', type: 'file' }],
            },
            {
              name: 'dir4',
              type: 'directory',
              rules: [{ name: 'index.js', type: 'file' }],
            },
          ],
        },
      ];

      expect(() => validator.run(files, configObject)).toThrowError('src/dir2/dir2-2/index.js, was not validated');
    });

    it.todo('[UPPERCASE]');
    it.todo('[dash-case]');
    it.todo('[snake_case]');

    describe('Edge Cases:', () => {
      it(`should throw when a rule matches 2 dirs (dirA, dirB), the rule first
          doesn't satisfiy dirA's children neither dirB's. But it satisfies
          them in conjunction`, () => {
        const files = generateFilesAndDirsFromPaths(['dirA/index.js', 'dirA/X.js', 'dirB/index.js', 'dirB/Y.js']);

        const configObject: types.Rules = [
          {
            name: '[camelCase]',
            type: 'directory',
            rules: [
              { name: 'index.js', type: 'file' },
              { name: 'X.js', type: 'file' },
              { name: 'Y.js', type: 'file' },
            ],
          },
        ];

        expect(() => validator.run(files, configObject)).toThrowError(
          `${JSON.stringify({ name: 'Y.js', type: 'file' })}, deep: 1, rule did not passed`,
        );
      });

      it(`should throw when a rule matches 2 dirs (dirA, dirB), dirB's children
          are a subset of dirA's. the rule first satisfies dirA's children but does
          not for dirB's`, () => {
        const files = generateFilesAndDirsFromPaths(['dirA/index.js', 'dirA/X.js', 'dirA/Y.js', 'dirB/Y.js']);

        const configObject: types.Rules = [
          {
            name: '[camelCase]',
            type: 'directory',
            rules: [
              { name: 'index.js', type: 'file' },
              { name: 'X.js', type: 'file' },
              { name: 'Y.js', type: 'file' },
            ],
          },
        ];

        expect(() => validator.run(files, configObject)).toThrowError(
          `${JSON.stringify({ name: 'index.js', type: 'file' })}, deep: 1, rule did not passed`,
        );
      });

      it(`should throw when a rule almost matches 2 dirs (dirA, dirB), dirB's children
          are a subset of dirA's. the rule first satisfies dirB's children but does
          not for dirB's`, () => {
        const files = generateFilesAndDirsFromPaths(['dirB/Y.js', 'dirA/index.js', 'dirA/X.js', 'dirA/Y.js']);

        const configObject: types.Rules = [
          {
            name: '[camelCase]',
            type: 'directory',
            rules: [
              { name: 'index.js', type: 'file' },
              { name: 'X.js', type: 'file' },
              { name: 'Y.js', type: 'file' },
            ],
          },
        ];

        expect(() => validator.run(files, configObject)).toThrowError(
          `${JSON.stringify({ name: 'index.js', type: 'file' })}, deep: 1, rule did not passed`,
        );
      });
    });

    describe('RegExp:', () => {
      it('should validate regexp (also as string) dirnames', () => {
        const files = generateFilesAndDirsFromPaths(['src/index.js', '.srcNice/index.js', 'srcThisWorksToo/index.js']);

        const configObject: types.Rules = [
          {
            name: /src.*/,
            type: 'directory',
            rules: [{ name: 'index.js', type: 'file' }],
          },
        ];

        const configObject2: types.Rules = [
          {
            name: '/src.*/',
            type: 'directory',
            rules: [{ name: 'index.js', type: 'file' }],
          },
        ];

        expect(() => {
          validator.run(files, configObject);
          validator.run(files, configObject2);
        }).not.toThrow();
      });

      it('should throw because a dirname does not match regex', () => {
        const files = generateFilesAndDirsFromPaths(['src/index.js', 'srrcNice/index.js', 'srcThisWorksToo/index.js']);

        const configObject: types.Rules = [
          {
            name: /src.*/,
            type: 'directory',
            rules: [{ name: 'index.js', type: 'file' }],
          },
        ];

        expect(() => validator.run(files, configObject)).toThrowError('srrcNice, was not validated');
      });
    });

    describe('[camelCase]:', () => {
      it('should validate camelcase dirnames', () => {
        const files = generateFilesAndDirsFromPaths(['src/index.js', 'srcOmg/index.js', 'srcLul/index.js']);

        const configObject: types.Rules = [
          {
            name: '[camelCase]',
            type: 'directory',
            rules: [{ name: 'index.js', type: 'file' }],
          },
        ];

        expect(() => validator.run(files, configObject)).not.toThrow();
      });

      it('should throw because one dirname is not camelcased', () => {
        const files = generateFilesAndDirsFromPaths(['src/index.js', 'SRC/index.js', 'srcLul/index.js']);

        const configObject: types.Rules = [
          {
            name: '[camelCase]',
            type: 'directory',
            rules: [{ name: 'index.js', type: 'file' }],
          },
        ];

        expect(() => validator.run(files, configObject)).toThrowError('SRC, was not validated');
      });
    });
  });
}
