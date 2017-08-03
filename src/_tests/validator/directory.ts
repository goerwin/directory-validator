import * as assert from 'assert';
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
            { name: 'blue.conf', type: 'file' }
          ]
        }
      ];

      assert.doesNotThrow(() => {
        validator.run(files, configObject);
      });
    });

    it('should validate dir if it does not have rules', () => {
      const files = ['./src/index.js'];

      const configObject: types.Rules = [
        {
          name: 'src',
          type: 'directory'
        }
      ];

      assert.doesNotThrow(() => {
        validator.run(files, configObject);
      });
    });

    it('should validate dir and subdirs if it does not have rules', () => {
      const files = ['./src/index.js', './src/lul/index.js'];

      const configObject: types.Rules = [
        {
          name: 'src',
          type: 'directory'
        }
      ];

      assert.doesNotThrow(() => {
        validator.run(files, configObject);
      });
    });

    it('should throw because wrong name of directory', () => {
      const files = ['./src/nice file.js', './src/blue.conf'];

      const configObject: types.Rules = [
        {
          name: 'lol',
          type: 'directory',
          rules: [
            { name: 'nice file.js', type: 'file' },
            { name: 'blue.conf', type: 'file' }
          ]
        }
      ];

      assert.throws(
        () => { validator.run(files, configObject); },
        (err: Error) =>
          err.message.includes(
            `${JSON.stringify(configObject[0])}, deep: 1, rule did not passed`
          )
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
          rules: [
            { name: 'blue.conf', type: 'file' }
          ]
        }
      ];

      const configObject2: types.Rules = [
        {
          name: 'src',
          type: 'directory',
          isOptional: true,
          rules: [
            { name: 'blue.conf', type: 'file' }
          ]
        },
        { name: 'index.js', type: 'file' }
      ];

      assert.doesNotThrow(() => {
        validator.run(files, configObject);
        validator.run(files, configObject2);
      });
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
                  name: 'c.js'
                }
              ]
            }
          ]
        }
      ];

      assert.doesNotThrow(() => {
        validator.run(files, configObject);
      }, () => null);
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
                  name: 'c.js'
                }
              ]
            }
          ]
        }
      ];

      assert.doesNotThrow(() => {
        validator.run(files, configObject);
      }, () => null);
    });

    it('should throw because an optional dir rule fails', () => {
      const files = ['src/a.js'];

      const configObject: types.Rules = [
        {
          name: 'src',
          type: 'directory',
          isOptional: true,
          rules: [
            { name: 'index.js', type: 'file' }
          ]
        }
      ];

      assert.throws(
        () => { validator.run(files, configObject); },
        (err: Error) => err.message.includes('}, deep: 2, rule did not passed')
      );
    });

    it('should throw if dir rule fails', () => {
      const configObject: types.Rules = [
        {
          name: 'lol',
          type: 'directory'
        }
      ];

      assert.throws(
        () => { validator.run([], configObject); },
        (err: Error) =>
          err.message.includes(`${JSON.stringify(configObject[0])}, deep: 1, rule did not passed`)
      );
    });

    it('should validate if dir rule fails but is optional', () => {
      const configObject: types.Rules = [
        {
          name: 'lol',
          type: 'directory',
          isOptional: true
        }
      ];

      assert.doesNotThrow(() => {
        validator.run([], configObject);
      });
    });

    it('should validate if multiname dir rule has no rules', () => {
      const files = ['src/index.js'];

      const configObject: types.Rules = [
        {
          name: '[camelCase]',
          type: 'directory'
        }
      ];

      assert.doesNotThrow(() => {
        validator.run(files, configObject);
      });
    });

    it('should validate if multiple dir rules match same dirs', () => {
      const files = [
        './src/index.js',
        './src/index2.js',
        './src2/index.js',
        './src2/index2.js'
      ];

      const configObject: types.Rules = [
        {
          name: '[camelCase]',
          type: 'directory',
          rules: [
            { name: 'index.js', type: 'file' },
            { name: 'index2.js', type: 'file' }
          ]
        },
        {
          name: 'src2',
          type: 'directory',
          rules: [
            { name: 'index.js', type: 'file' },
            { name: 'index2.js', type: 'file' }
          ]
        }
      ];

      assert.doesNotThrow(() => {
        validator.run(files, configObject);
      });
    });

    describe('EmptyDirs:', () => {
      it('should validate empty dir has no rules', () => {
        const emptyDirs = ['src'];

        const configObject: types.Rules = [
          {
            name: 'src',
            type: 'directory'
          }
        ];

        assert.doesNotThrow(() => {
          validator.run([], configObject, emptyDirs);
        });
      });

      it('should throw if empty dir has rules', () => {
        const emptyDirs = ['src'];

        const configObject: types.Rules = [
          {
            name: 'src',
            type: 'directory',
            rules: [
              { name: 'index.js', type: 'file' }
            ]
          }
        ];

        assert.throws(
          () => { validator.run([], configObject, emptyDirs); },
          (err: Error) =>
            err.message.includes(
              `${JSON.stringify(configObject[0])}, deep: 1, rule did not passed`
            )
        );
      });

      it('should throw if an empty dir is not validated', () => {
        const emptyDirs = ['lol', 'src'];

        const configObject: types.Rules = [
          {
            name: 'lol',
            type: 'directory',
            isOptional: true
          }
        ];

        assert.throws(
          () => { validator.run([], configObject, emptyDirs); },
          (err: Error) =>
            err.message.includes('src, was not validated')
        );
      });
    });

    describe('*:', () => {
      it('should validate a basic directory', () => {
        const files = ['./src/file.js', './omg/file.js'];

        const configObject: types.Rules = [
          {
            name: '*',
            type: 'directory',
            rules: [
              { name: 'file.js', type: 'file' }
            ]
          }
        ];

        assert.doesNotThrow(() => {
          validator.run(files, configObject);
        });
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
                    name: 'c.js'
                  }
                ]
              }
            ]
          }
        ];

        assert.doesNotThrow(() => {
          validator.run(files, configObject);
        }, () => null);
      });
    });
  });
}
