import * as assert from 'assert';
import * as program from './';

describe('Module src:', () => {
  describe('Files:', () => {
    it('should validate using only filenames', () => {
      const files = ['./.gitignore', './package.json'];

      const configObject: program.FileDirectoryArray = [
        { name: 'package.json', type: 'file' },
        { name: '.gitignore', type: 'file' }
      ];

      assert.doesNotThrow(() => {
        program.run(files, configObject);
      }, () => null);
    });

    it('should validate using name/extension(string) combo', () => {
      const files = ['./.gitignore', './package.json'];

      const configObject: program.FileDirectoryArray = [
        { name: 'package', extension: 'json', type: 'file' },
        { name: '.gitignore', type: 'file' }
      ];

      assert.doesNotThrow(() => {
        program.run(files, configObject);
      }, () => null);
    });

    it('should validate using name/extension(regex) combo', () => {
      const files = ['./.gitignore', './package.json'];

      const configObject: program.FileDirectoryArray = [
        { name: 'package', extension: /json/, type: 'file' },
        { name: '.gitignore', type: 'file' }
      ];

      assert.doesNotThrow(() => {
        program.run(files, configObject);
      }, () => null);
    });

    it('should throw because a rule did not passed', () => {
      const files = ['./.gitignore', './package.lul'];

      const configObject: program.FileDirectoryArray = [
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

      const configObject: program.FileDirectoryArray = [
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

      const configObject: program.FileDirectoryArray = [
        { name: 'package.json', type: 'file' },
        { name: 'optional.js', type: 'file', isOptional: true },
        { name: '.gitignore', type: 'file' }
      ];

      assert.doesNotThrow(
        () => {
          program.run(files, configObject);
        }, () => null
      );
    });

    it('should throw because rule is not optional', () => {
      const files = ['./.gitignore', './package.json'];

      const configObject: program.FileDirectoryArray = [
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

    describe('[camelCase]:', () => {
      it('should validate camelcased filenames', () => {
        const files = ['./camelizedNamedPogChamp.json', './package.json'];

        const configObject: program.FileDirectoryArray = [
          { name: '[camelCase].json', type: 'file' }
        ];

        assert.doesNotThrow(() => {
          program.run(files, configObject);
        }, () => null);
      });

      it('should throw because one file is not camelcased', () => {
        const files = ['./camelizedNamedPogChamp.json', './package.json', './no-camelcase.js'];

        const configObject: program.FileDirectoryArray = [
          { name: '[camelCase].json', type: 'file' }
        ];

        assert.throws(
          () => { program.run(files, configObject); },
          (err: Error) => err.message.includes('no-camelcase.js, was not validated')
        );
      });
    });

    describe('RegExp:', () => {
      it('should validate filenames', () => {
        const files = ['./index.js', './package.map'];

        const configObject: program.FileDirectoryArray = [
          { name: /[a-z]\.(js|map)/, type: 'file' }
        ];

        assert.doesNotThrow(() => {
          program.run(files, configObject);
        }, () => null);
      });

      it('should throw because one file does not match', () => {
        const files = ['./index.js', './package.map', 'rip8.js'];

        const configObject: program.FileDirectoryArray = [
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

      const configObject: program.FileDirectoryArray = [
        {
          name: 'src',
          type: 'directory',
          children: [
            { name: 'nice file.js', type: 'file' },
            { name: 'blue.conf', type: 'file' }
          ]
        }
      ];

      assert.doesNotThrow(() => {
        program.run(files, configObject);
      }, () => null);
    });

    it('should throw because wrong name of directory', () => {
      const files = ['./src/nice file.js', './src/blue.conf'];

      const configObject: program.FileDirectoryArray = [
        {
          name: 'lol',
          type: 'directory',
          children: [
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

    it('should validate because optional directory', () => {
      const files = ['./index.js'];

      const configObject: program.FileDirectoryArray = [
        { name: 'index.js', type: 'file' },
        {
          name: 'src',
          type: 'directory',
          isOptional: true,
          children: [
            { name: 'blue.conf', type: 'file' }
          ]
        }
      ];

      assert.doesNotThrow(() => {
        program.run(files, configObject);
      }, () => null);
    });

    it('should work with camelCase names');
    it('should throw with camelCase names');
  });

  describe('Files/Directories:', () => {
    it('should validate basic directories/files mixed', () => {
      const files = [
        './package.json',
        './.gitignore',
        './src/nice file.js',
        './src/blue.conf'
      ];

      const configObject: program.FileDirectoryArray = [
        { name: '.gitignore', type: 'file' },
        { name: 'package.json', type: 'file' },
        {
          name: 'src',
          type: 'directory',
          children: [
            { name: 'nice file.js', type: 'file' },
            { name: 'blue.conf', type: 'file' }
          ]
        }
      ];

      assert.doesNotThrow(() => {
        program.run(files, configObject);
      }, () => null);
    });

    it('should validate a complex tree with no recursion', () => {
      const files = [
        './package.json',
        './.gitignore',
        './src/nice file.js',
        './src/blue.conf',
        './src/dir2/index.js',
        './src/dir2/dir2-1/index.js',
        './src/dir2/dir2-2/index.js',
        './src/dir3/index.js',
        './src/dir4/index.js'
      ];

      const configObject: program.FileDirectoryArray = [
        { name: '.gitignore', type: 'file' },
        { name: 'package.json', type: 'file' },
        {
          name: 'src',
          type: 'directory',
          children: [
            { name: 'nice file.js', type: 'file' },
            { name: 'blue.conf', type: 'file' },
            {
              name: 'dir2',
              type: 'directory',
              children: [
                { name: 'index.js', type: 'file' },
                {
                  name: 'dir2-1',
                  type: 'directory',
                  children: [
                    { name: 'index.js', type: 'file' }
                  ]
                },
                {
                  name: 'dir2-2',
                  type: 'directory',
                  children: [
                    { name: 'index.js', type: 'file' }
                  ]
                }
              ]
            },
            {
              name: 'dir3',
              type: 'directory',
              children: [
                { name: 'index.js', type: 'file' }
              ]
            },
            {
              name: 'dir4',
              type: 'directory',
              children: [
                { name: 'index.js', type: 'file' }
              ]
            }
          ]
        }
      ];

      assert.doesNotThrow(() => {
        program.run(files, configObject);
      }, () => null);
    });

    it('should validate a simple tree with recursion', () => {
      const files = [
        './package.json',
        './.gitignore',
        './src/index.js',
        './src/src/index.js',
        './src/src/src/index.js',
        './src/src/src/src/index.js'
      ];

      const configObject: program.FileDirectoryArray = [
        { name: '.gitignore', type: 'file' },
        { name: 'package.json', type: 'file' },
        {
          name: 'src',
          type: 'directory',
          isRecursive: true,
          children: [
            { name: 'index.js', type: 'file' }
          ]
        }
      ];

      assert.doesNotThrow(() => {
        program.run(files, configObject);
      }, () => null);
    });

    it(`should throw in a simple tree with
        recursion and optional because recursive folder not found`, () => {
      const files = ['./package.json', './.gitignore'];

      const configObject: program.FileDirectoryArray = [
        { name: '.gitignore', type: 'file' },
        { name: 'package.json', type: 'file' },
        {
          name: 'src',
          type: 'directory',
          isRecursive: true,
          children: [
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
        './src/index.js',
        './src/src/index.js',
        './src/src/src/index.js',
        'src/src/src/index2.js',
        './src/src/src/src/index.js'
      ];

      const configObject: program.FileDirectoryArray = [
        {
          name: 'src',
          type: 'directory',
          isRecursive: true,
          children: [
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

      const configObject: program.FileDirectoryArray = [
        {
          name: 'src',
          type: 'directory',
          children: [
            { name: 'nice file.js', type: 'file' },
            { name: 'blue.conf', type: 'file' },
            {
              name: 'dir2',
              type: 'directory',
              children: [
                { name: 'index.js', type: 'file' },
                {
                  name: 'dir2-1',
                  type: 'directory',
                  children: [
                    { name: 'index.js', type: 'file' }
                  ]
                },
                {
                  name: 'dir2-2',
                  type: 'directory',
                  children: [
                    { name: 'index2.js', type: 'file' }
                  ]
                }
              ]
            },
            {
              name: 'dir3',
              type: 'directory',
              children: [
                { name: 'index.js', type: 'file' }
              ]
            },
            {
              name: 'dir4',
              type: 'directory',
              children: [
                { name: 'index.js', type: 'file' }
              ]
            }
          ]
        }
      ];

      console.log(`${files[4]}, was not validated`);
      assert.throws(
        () => { program.run(files, configObject); },
        (err: Error) => err.message.includes(`${files[4]}, was not validated`)
      );
    });

    it(`should throw when 2 dirs at same level have common files, their rules
        dont satisfy them individually but they do satisfy in conjuntion`, () => {
      const files = [
        './package.json',
        './.gitignore',
        './src/file2.js',
        './src2/file1.js'
      ];

      const configObject: program.FileDirectoryArray = [
        { name: '.gitignore', type: 'file' },
        { name: 'package.json', type: 'file' },
        {
          name: 'src',
          type: 'directory',
          children: [
            { name: 'file1.js', type: 'file' }
          ]
        },
        {
          name: 'src2',
          type: 'directory',
          children: [
            { name: 'file2.js', type: 'file' }
          ]
        }
      ];

      assert.throws(() => {
        program.run(files, configObject);
      });
    });
  });
});
