import * as types from '../../types';
import * as validator from '../../validator';

export function run() {
  describe('Directories:', () => {
    it('should validate a basic directory', () => {
      const files = ['./src/nice file.js', './src/blue.conf'];

      const configObject: types.Rules = [
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

    it('should validate dir if it does not have rules', () => {
      const files = ['./src/index.js'];

      const configObject: types.Rules = [
        {
          name: 'src',
          type: 'directory',
        },
      ];

      expect(() => validator.run(files, configObject)).not.toThrow();
    });

    it('should validate dir and subdirs if it does not have rules', () => {
      const files = ['./src/index.js', './src/lul/index.js'];

      const configObject: types.Rules = [
        {
          name: 'src',
          type: 'directory',
        },
      ];

      expect(() => validator.run(files, configObject)).not.toThrow();
    });

    it('should throw because wrong name of directory', () => {
      const files = ['./src/nice file.js', './src/blue.conf'];

      const configObject: types.Rules = [
        {
          name: 'lol',
          type: 'directory',
          rules: [
            { name: 'nice file.js', type: 'file' },
            { name: 'blue.conf', type: 'file' },
          ],
        },
      ];

      expect(() => validator.run(files, configObject)).toThrowError(
        `${JSON.stringify(configObject[0])}, deep: 1, rule did not passed`
      );
    });

    it('should validate because optional directory as first and as last rule', () => {
      const files = ['./index.js'];

      const configObject: types.Rules = [
        { name: 'index.js', type: 'file' },
        {
          name: 'src',
          type: 'directory',
          isOptional: true,
          rules: [{ name: 'blue.conf', type: 'file' }],
        },
      ];

      const configObject2: types.Rules = [
        {
          name: 'src',
          type: 'directory',
          isOptional: true,
          rules: [{ name: 'blue.conf', type: 'file' }],
        },
        { name: 'index.js', type: 'file' },
      ];

      expect(() => {
        validator.run(files, configObject);
        validator.run(files, configObject2);
      }).not.toThrow();
    });

    it('should work for > 1 level deep directory', () => {
      const files = ['a/b/c.js'];

      const configObject: types.Rules = [
        {
          name: 'a',
          type: 'directory',
          rules: [
            {
              name: 'b',
              type: 'directory',
              rules: [
                {
                  type: 'file',
                  name: 'c.js',
                },
              ],
            },
          ],
        },
      ];

      expect(() => validator.run(files, configObject)).not.toThrow();
    });

    it('should work for > 1 level deep optional directory', () => {
      const files = ['a/b/c.js'];

      const configObject: types.Rules = [
        {
          name: 'a',
          type: 'directory',
          rules: [
            {
              name: 'b',
              type: 'directory',
              isOptional: true,
              rules: [
                {
                  type: 'file',
                  name: 'c.js',
                },
              ],
            },
          ],
        },
      ];

      expect(() => validator.run(files, configObject)).not.toThrow();
    });

    it('should throw because an optional dir rule fails', () => {
      const files = ['src/a.js'];

      const configObject: types.Rules = [
        {
          name: 'src',
          type: 'directory',
          isOptional: true,
          rules: [{ name: 'index.js', type: 'file' }],
        },
      ];

      expect(() => validator.run(files, configObject)).toThrowError(
        '}, deep: 2, rule did not passed'
      );
    });

    it('should throw if dir rule fails', () => {
      const files: string[] = [];
      const configObject: types.Rules = [
        {
          name: 'lol',
          type: 'directory',
        },
      ];

      expect(() => validator.run(files, configObject)).toThrowError(
        `${JSON.stringify(configObject[0])}, deep: 1, rule did not passed`
      );
    });

    it('should validate if dir rule fails but is optional', () => {
      const files: string[] = [];
      const configObject: types.Rules = [
        {
          name: 'lol',
          type: 'directory',
          isOptional: true,
        },
      ];

      expect(() => validator.run(files, configObject)).not.toThrow();
    });

    it('should validate if multiname dir rule has no rules', () => {
      const files = ['src/index.js'];

      const configObject: types.Rules = [
        {
          name: '[camelCase]',
          type: 'directory',
        },
      ];

      expect(() => validator.run(files, configObject)).not.toThrow();
    });

    it('should validate if multiple dir rules match same dirs', () => {
      const files = [
        './src/index.js',
        './src/index2.js',
        './src2/index.js',
        './src2/index2.js',
      ];

      const configObject: types.Rules = [
        {
          name: '[camelCase]',
          type: 'directory',
          rules: [
            { name: 'index.js', type: 'file' },
            { name: 'index2.js', type: 'file' },
          ],
        },
        {
          name: 'src2',
          type: 'directory',
          rules: [
            { name: 'index.js', type: 'file' },
            { name: 'index2.js', type: 'file' },
          ],
        },
      ];

      expect(() => validator.run(files, configObject)).not.toThrow();
    });

    describe('EmptyDirs:', () => {
      it('should validate empty dir has no rules', () => {
        const files: string[] = [];
        const emptyDirs = ['src'];

        const configObject: types.Rules = [
          {
            name: 'src',
            type: 'directory',
          },
        ];

        expect(() =>
          validator.run(files, configObject, emptyDirs)
        ).not.toThrow();
      });

      it('should throw if empty dir has rules', () => {
        const files: string[] = [];
        const emptyDirs = ['src'];

        const configObject: types.Rules = [
          {
            name: 'src',
            type: 'directory',
            rules: [{ name: 'index.js', type: 'file' }],
          },
        ];

        expect(() =>
          validator.run(files, configObject, emptyDirs)
        ).toThrowError(
          `${JSON.stringify(configObject[0])}, deep: 1, rule did not passed`
        );
      });

      it('should throw if an empty dir is not validated', () => {
        const files: string[] = [];
        const emptyDirs = ['lol', 'src'];
        const configObject: types.Rules = [
          {
            name: 'lol',
            type: 'directory',
            isOptional: true,
          },
        ];

        expect(() =>
          validator.run(files, configObject, emptyDirs)
        ).toThrowError('src, was not validated');
      });
    });

    it('should work for > 1 level deep', () => {
      const files = ['a/b/c.js'];

      const configObject: types.Rules = [
        {
          name: 'a',
          type: 'directory',
          rules: [
            {
              name: 'b',
              type: 'directory',
              rules: [{ type: 'file', name: 'c.js' }],
            },
          ],
        },
      ];

      expect(() => validator.run(files, configObject)).not.toThrow();
    });

    it('should work for > 1 level deep and dir rule first', () => {
      const files = ['file.js', 'file2.js', 'a/b/c.js'];

      const configObject: types.Rules = [
        {
          name: 'a',
          type: 'directory',
          rules: [
            {
              name: 'b',
              type: 'directory',
              rules: [{ type: 'file', name: 'c.js' }],
            },
          ],
        },
        { type: 'file', name: '[camelCase].js' },
        { type: 'file', name: 'lol', isOptional: true },
      ];

      expect(() => validator.run(files, configObject)).not.toThrow();
    });

    it('should work for > 1 level deep and dir rule last', () => {
      const files = ['file.js', 'file2.js', 'a/b/c.js'];

      const configObject: types.Rules = [
        { type: 'file', name: '[camelCase].js' },
        { type: 'file', name: 'lol', isOptional: true },
        {
          name: 'a',
          type: 'directory',
          rules: [
            {
              name: 'b',
              type: 'directory',
              rules: [{ type: 'file', name: 'c.js' }],
            },
          ],
        },
      ];

      expect(() => validator.run(files, configObject)).not.toThrow();
    });

    it('should work for > 1 level deep and dir rule not first/last', () => {
      const files = ['file.js', 'file2.js', 'a/b/c.js'];

      const configObject: types.Rules = [
        { type: 'file', name: '[camelCase].js' },
        {
          name: 'a',
          type: 'directory',
          rules: [
            {
              name: 'b',
              type: 'directory',
              rules: [{ type: 'file', name: 'c.js' }],
            },
          ],
        },
        { type: 'file', name: 'lol', isOptional: true },
      ];

      expect(() => validator.run(files, configObject)).not.toThrow();
    });

    describe('*:', () => {
      it('should validate a basic directory', () => {
        const files = ['./src/file.js', './omg/file.js'];

        const configObject: types.Rules = [
          {
            name: '*',
            type: 'directory',
            rules: [{ name: 'file.js', type: 'file' }],
          },
        ];

        expect(() => validator.run(files, configObject)).not.toThrow();
      });

      it('should work for > 1 level deep', () => {
        const files = ['a/b/c.js'];

        const configObject: types.Rules = [
          {
            name: '*',
            type: 'directory',
            rules: [
              {
                name: '*',
                type: 'directory',
                rules: [
                  {
                    type: 'file',
                    name: 'c.js',
                  },
                ],
              },
            ],
          },
        ];

        expect(() => validator.run(files, configObject)).not.toThrow();
      });
    });
  });
}
