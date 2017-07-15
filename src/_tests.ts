import * as assert from 'assert';
import * as program from './program';
import * as types from './types';

describe('Module src:', () => {
  it('should validate if no rules passed', () => {
    assert.doesNotThrow(() => {
      program.run(['package.json', '.gitignore'], []);
    });
  });

  it('should validate if no rules passed and no files passed', () => {
    assert.doesNotThrow(() => {
      program.run([], []);
    });
  });

  describe('Files:', () => {
    it('should validate using only filenames', () => {
      const files = ['./.gitignore', './package.json'];

      const configObject: types.Rules = [
        { name: 'package.json', type: 'file' },
        { name: '.gitignore', type: 'file' }
      ];

      assert.doesNotThrow(() => {
        program.run(files, configObject);
      });
    });

    it('should throw because a rule did not passed', () => {
      const files = ['./.gitignore', './package.lul'];

      const configObject: types.Rules = [
        { name: 'package.json', type: 'file' },
        { name: '.gitignore', type: 'file' }
      ];

      assert.throws(
        () => {
          program.run(files, configObject);
        },
        (err: Error) =>
          err.message.includes(`${JSON.stringify(configObject[0])}, deep: 1, rule did not passed`)
      );
    });

    it('should throw if it has invalid files', () => {
      const files = ['./.gitignore', './package.json', 'extraneous.js'];

      const configObject: types.Rules = [
        { name: 'package', extension: /json/, type: 'file' },
        { name: '.gitignore', type: 'file' }
      ];

      assert.throws(
        () => {
          program.run(files, configObject);
        },
        (err: Error) => err.message.includes(`${files[2]}, was not validated`)
      );
    });

    it('should validate because rule is optional', () => {
      const files = ['./.gitignore', './package.json'];

      const configObject: types.Rules = [
        { name: 'package.json', type: 'file' },
        { name: 'optional.js', type: 'file', isOptional: true },
        { name: '.gitignore', type: 'file' }
      ];

      assert.doesNotThrow(
        () => {
          program.run(files, configObject);
        }
      );
    });

    it('should throw because rule is not optional', () => {
      const files = ['./.gitignore', './package.json'];

      const configObject: types.Rules = [
        { name: 'package.json', type: 'file' },
        { name: 'optional.js', type: 'file' },
        { name: '.gitignore', type: 'file' }
      ];

      assert.throws(
        () => {
          program.run(files, configObject);
        },
        (err: Error) =>
          err.message.includes(`${JSON.stringify(configObject[1])}, deep: 1, rule did not passed`)
      );
    });

    describe('Extension:', () => {
      it('should validate using string', () => {
        const files = ['./.gitignore', './package.json'];

        const configObject: types.Rules = [
          { name: 'package', extension: 'json', type: 'file' },
          { name: '.gitignore', type: 'file' }
        ];

        assert.doesNotThrow(() => {
          program.run(files, configObject);
        });
      });

      it('should throw because wrong string extension', () => {
        const files = ['./.gitignore', './package.json'];

        const configObject: types.Rules = [
          { name: 'package', extension: '.json', type: 'file' },
          { name: '.gitignore', type: 'file' }
        ];

        assert.throws(
          () => { program.run(files, configObject); },
          (err: Error) => err.message.includes(
            `${JSON.stringify(configObject[0])}, deep: 1, rule did not passed`
          )
        );
      });

      it('should validate using regex', () => {
        const files = ['./.gitignore', './package.json'];

        const configObject: types.Rules = [
          { name: 'package', extension: /(json|js)/, type: 'file' },
          { name: '.gitignore', type: 'file' }
        ];

        assert.doesNotThrow(() => {
          program.run(files, configObject);
        });
      });

      it('should throw because wrong regex extension', () => {
        const files = ['./.gitignore', './package.json'];

        const configObject: types.Rules = [
          { name: 'package', extension: /.(json|js)/, type: 'file' },
          { name: '.gitignore', type: 'file' }
        ];

        assert.throws(
          () => { program.run(files, configObject); },
          (err: Error) => err.message.includes(
            `${JSON.stringify(configObject[0])}, deep: 1, rule did not passed`
          )
        );
      });
    });

    describe('[camelCase]:', () => {
      it('should validate filenames starting camelcased', () => {
        const files = ['./camelizedNamedPogChamp.json', './package.json'];

        const configObject: types.Rules = [
          { name: '[camelCase].json', type: 'file' }
        ];

        assert.doesNotThrow(() => {
          program.run(files, configObject);
        });
      });

      it('should validate filenames ending camelcased', () => {
        const files = ['./_ERcamelizedNamedPogChamp'];

        const configObject: types.Rules = [
          { name: '_ER[camelCase]', type: 'file' }
        ];

        assert.doesNotThrow(() => {
          program.run(files, configObject);
        });
      });

      it('should throw because one file is not camelcased as first/last', () => {
        const files = ['./camelizedNamedPogChamp.json', './package.json', './no-camelcase.js'];

        const configObject: types.Rules = [
          { name: '[camelCase].json', type: 'file' }
        ];

        assert.throws(
          () => {
            program.run(files, configObject);
          },
          (err: Error) => err.message.includes('no-camelcase.js, was not validated')
        );

        const files2 = ['./no-camelcase.js', './camelizedNamedPogChamp.json', './package.json'];

        assert.throws(
          () => {
            program.run(files2, configObject);
          },
          (err: Error) => err.message.includes('no-camelcase.js, was not validated')
        );
      });
    });

    describe('RegExp:', () => {
      it('should validate filenames', () => {
        const files = ['./index.js', './package.map'];

        const configObject: types.Rules = [
          { name: /[a-z]\.(js|map)/, type: 'file' }
        ];

        assert.doesNotThrow(() => {
          program.run(files, configObject);
        });
      });

      it('should throw because one file does not match', () => {
        const files = ['./index.js', './package.map', 'rip8.js'];

        const configObject: types.Rules = [
          { name: /[a-z]\.(js|map)/, type: 'file' }
        ];

        assert.throws(
          () => { program.run(files, configObject); },
          (err: Error) => err.message.includes('rip8.js, was not validated')
        );
      });
    });
  });

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
        program.run(files, configObject);
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
        program.run(files, configObject);
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
        program.run(files, configObject);
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
        () => { program.run(files, configObject); },
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
        program.run(files, configObject);
        program.run(files, configObject2);
      });
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
        () => { program.run(files, configObject); },
        (err: Error) => err.message.includes('src/a.js, was not validated')
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
        () => { program.run([], configObject); },
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
        program.run([], configObject);
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
        program.run(files, configObject);
      });
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
        program.run([], configObject, emptyDirs);
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
        () => { program.run([], configObject, emptyDirs); },
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
        () => { program.run([], configObject, emptyDirs); },
        (err: Error) =>
          err.message.includes('src, was not validated')
      );
    });
  });

  describe('Files/Directories:', () => {
    it('should validate basic directories/files mixed', () => {
      const files = [
        './package.json',
        './.gitignore',
        './src/nice file.js',
        './src/blue.conf'
      ];

      const configObject: types.Rules = [
        { name: '.gitignore', type: 'file' },
        { name: 'package.json', type: 'file' },
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
        program.run(files, configObject);
      });
    });

    it('should validate a complex tree with no recursion', () => {
      const files = [
        './src/nice file.js',
        './src/blue.conf',
        './src/dir2/index.js',
        './src/dir2/dir2-1/index.js',
        './src/dir2/dir2-2/index.js',
        './src/dir3/index.js',
        './src/dir4/index.js'
      ];

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
                  rules: [
                    { name: 'index.js', type: 'file' }
                  ]
                },
                {
                  name: 'dir2-2',
                  type: 'directory',
                  rules: [
                    { name: 'index.js', type: 'file' }
                  ]
                }
              ]
            },
            {
              name: 'dir3',
              type: 'directory',
              rules: [
                { name: 'index.js', type: 'file' }
              ]
            },
            {
              name: 'dir4',
              type: 'directory',
              rules: [
                { name: 'index.js', type: 'file' }
              ]
            }
          ]
        }
      ];

      assert.doesNotThrow(() => {
        program.run(files, configObject);
      });
    });

    it('should validate a simple tree with recursion', () => {
      const files = [
        './src/index.js',
        './src/src/index.js',
        './src/src/src/index.js',
        './src/src/src/src/index.js'
      ];

      const configObject: types.Rules = [
        {
          name: 'src',
          type: 'directory',
          isRecursive: true,
          rules: [
            { name: 'index.js', type: 'file' }
          ]
        }
      ];

      assert.doesNotThrow(() => {
        program.run(files, configObject);
      });
    });

    it('should not throw because recursive rule is optional', () => {
      const files = [
        './package.json'
      ];

      const configObject: types.Rules = [
        { name: 'package.json', type: 'file' },
        {
          name: 'src',
          type: 'directory',
          isRecursive: true,
          isOptional: true,
          rules: [
            { name: 'index.js', type: 'file' }
          ]
        }
      ];

      assert.doesNotThrow(() => {
        program.run(files, configObject);
      });
    });

    it(`should throw in a simple tree with
        recursion and optional because recursive folder not found`, () => {
        const files = ['./package.json', './.gitignore'];

        const configObject: types.Rules = [
          { name: '.gitignore', type: 'file' },
          { name: 'package.json', type: 'file' },
          {
            name: 'src',
            type: 'directory',
            isRecursive: true,
            rules: [
              { name: 'index.js', type: 'file' }
            ]
          }
        ];

        assert.throws(
          () => { program.run(files, configObject); },
          (err: Error) => err.message.includes(
            `${JSON.stringify(configObject[2])}, deep: 1, rule did not passed`
          )
        );
      });

    it('should throw a simple tree with recursion because random file', () => {
      const files = [
        'src/index.js',
        'src/src/index.js',
        'src/src/src/index.js',
        'src/src/src/index2.js',
        'src/src/src/src/index.js'
      ];

      const configObject: types.Rules = [
        {
          name: 'src',
          type: 'directory',
          isRecursive: true,
          rules: [
            { name: 'index.js', type: 'file' }
          ]
        }
      ];

      assert.throws(
        () => { program.run(files, configObject); },
        (err: Error) => err.message.includes(`${files[3]}, was not validated`)
      );
    });

    it(`should throw when files with same name in same level but
        different directories and one dir does not allow them`, () => {
        const files = [
          './src/nice file.js',
          './src/blue.conf',
          './src/dir2/index.js',
          './src/dir2/dir2-1/index.js',
          'src/dir2/dir2-2/index.js',
          './src/dir2/dir2-2/index2.js',
          './src/dir3/index.js',
          './src/dir4/index.js'
        ];

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
                    rules: [
                      { name: 'index.js', type: 'file' }
                    ]
                  },
                  {
                    name: 'dir2-2',
                    type: 'directory',
                    rules: [
                      { name: 'index2.js', type: 'file' }
                    ]
                  }
                ]
              },
              {
                name: 'dir3',
                type: 'directory',
                rules: [
                  { name: 'index.js', type: 'file' }
                ]
              },
              {
                name: 'dir4',
                type: 'directory',
                rules: [
                  { name: 'index.js', type: 'file' }
                ]
              }
            ]
          }
        ];

        assert.throws(
          () => { program.run(files, configObject); },
          (err: Error) => err.message.includes(`${files[4]}, was not validated`)
        );
      });

    it('*');
    it('[UPPERCASE]');
    it('[dash-case]');
    it('[snake_case]');

    describe('Edge Cases:', () => {
      it(`should throw when a rule matches 2 dirs (dirA, dirB), the rule first
          doesn't satisfiy dirA's children neither dirB's. But it satisfies
          them in conjunction`, () => {
        const files = [
          './dirA/index.js',
          './dirA/X.js',
          './dirB/index.js',
          './dirB/Y.js'
        ];

        const configObject: types.Rules = [
          {
            name: '[camelCase]',
            type: 'directory',
            rules: [
              { name: 'index.js', type: 'file' },
              { name: 'X.js', type: 'file' },
              { name: 'Y.js', type: 'file' }
            ]
          }
        ];

        assert.throws(
          () => { program.run(files, configObject); },
          (err: Error) =>
            err.message.includes(
              `${JSON.stringify((
                configObject[0] as types.DirectoryRule).rules![2]
              )}, deep: 2, rule did not passed`
            )
        );
      });

      it(`should throw when a rule matches 2 dirs (dirA, dirB), dirB's children
          are a subset of dirA's. the rule first satisfies dirA's children but does
          not for dirB's`, () => {
        const files = [
          './dirA/index.js',
          './dirA/X.js',
          './dirA/Y.js',
          './dirB/Y.js'
        ];

        const configObject: types.Rules = [
          {
            name: '[camelCase]',
            type: 'directory',
            rules: [
              { name: 'index.js', type: 'file' },
              { name: 'X.js', type: 'file' },
              { name: 'Y.js', type: 'file' }
            ]
          }
        ];

        assert.throws(
          () => { program.run(files, configObject); },
          (err: Error) =>
            err.message.includes(
              `${JSON.stringify((
                configObject[0] as types.DirectoryRule).rules![0]
              )}, deep: 2, rule did not passed`
            )
        );
      });

      it(`should throw when a rule matches 2 dirs (dirA, dirB), dirB's children
          are a subset of dirA's. the rule first satisfies dirB's children but does
          not for dirB's`, () => {
        const files = [
          './dirB/Y.js',
          './dirA/index.js',
          './dirA/X.js',
          './dirA/Y.js'
        ];
        it('do this with folders too');

        const configObject: types.Rules = [
          {
            name: '[camelCase]',
            type: 'directory',
            rules: [
              { name: 'index.js', type: 'file' },
              { name: 'X.js', type: 'file' },
              { name: 'Y.js', type: 'file' }
            ]
          }
        ];

        assert.throws(
          () => { program.run(files, configObject); },
          (err: Error) =>
            err.message.includes(
              `${JSON.stringify((
                configObject[0] as types.DirectoryRule).rules![0]
              )}, deep: 2, rule did not passed`
            )
        );
      });
    });

    describe('RegExp:', () => {
      it('should validate regexp dirnames', () => {
        const files = [
          './src/index.js',
          './.srcNice/index.js',
          './srcThisWorksToo/index.js'
        ];

        const configObject: types.Rules = [
          {
            name: /src.*/,
            type: 'directory',
            rules: [
              { name: 'index.js', type: 'file' }
            ]
          }
        ];

        assert.doesNotThrow(() => {
          program.run(files, configObject);
        });
      });

      it('should throw because a dirname does not match regex', () => {
        const files = [
          './src/index.js',
          './srrcNice/index.js',
          './srcThisWorksToo/index.js'
        ];

        const configObject: types.Rules = [
          {
            name: /src.*/,
            type: 'directory',
            rules: [
              { name: 'index.js', type: 'file' }
            ]
          }
        ];

        assert.throws(
          () => { program.run(files, configObject); },
          (err: Error) =>
            err.message.includes('srrcNice/index.js, was not validated')
        );
      });
    });

    describe('[camelCase]:', () => {
      it('should validate camelcase dirnames', () => {
        const files = [
          './src/index.js',
          './srcOmg/index.js',
          './srcLul/index.js'
        ];

        const configObject: types.Rules = [
          {
            name: '[camelCase]',
            type: 'directory',
            rules: [
              { name: 'index.js', type: 'file' }
            ]
          }
        ];

        assert.doesNotThrow(() => {
          program.run(files, configObject);
        });
      });

      it('should throw because one dirname is not camelcased', () => {
        const files = [
          './src/index.js',
          './SRC/index.js',
          './srcLul/index.js'
        ];

        const configObject: types.Rules = [
          {
            name: '[camelCase]',
            type: 'directory',
            rules: [
              { name: 'index.js', type: 'file' }
            ]
          }
        ];

        assert.throws(
          () => { program.run(files, configObject); },
          (err: Error) => err.message.includes('SRC/index.js, was not validated')
        );
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
        program.run(files, configObject);
      });
    });
  });
});
