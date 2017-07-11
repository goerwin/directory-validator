import * as assert from 'assert';
import 'mocha';
import '../types';
import program from './';

describe('Module src', () => {
  describe('files', () => {
    it('should validate using only filenames', () => {
      const files = ['./.gitignore', './package.json'];

      const configObject: Types.FileDirectoryArray = [
        { name: 'package.json', type: 'file' },
        { name: '.gitignore', type: 'file' }
      ];

      assert.doesNotThrow(() => {
        program(files, configObject);
      }, () => null);
    });

    it('should validate using name/extension(string) combo', () => {
      const files = ['./.gitignore', './package.json'];

      const configObject: Types.FileDirectoryArray = [
        { name: 'package', extension: 'json', type: 'file' },
        { name: '.gitignore', type: 'file' }
      ];

      assert.doesNotThrow(() => {
        program(files, configObject);
      }, () => null);
    });

    it('should validate using name/extension(regex) combo', () => {
      const files = ['./.gitignore', './package.json'];

      const configObject: Types.FileDirectoryArray = [
        { name: 'package', extension: /json/, type: 'file' },
        { name: '.gitignore', type: 'file' }
      ];

      assert.doesNotThrow(() => {
        program(files, configObject);
      }, () => null);
    });

    it('should throw because a rule did not passed', () => {
      const files = ['./.gitignore', './package.lul'];

      const configObject: Types.FileDirectoryArray = [
        { name: 'package.json', type: 'file' },
        { name: '.gitignore', type: 'file' }
      ];

      assert.throws(
        () => {
          program(files, configObject);
        },
        (err: Error) =>
          err.message.includes(`${JSON.stringify(configObject[0])}, rule did not passed`)
      );
    });

    it('should throw if it has invalid files', () => {
      const files = ['./.gitignore', './package.json', 'extraneous.js'];

      const configObject: Types.FileDirectoryArray = [
        { name: 'package', extension: /json/, type: 'file' },
        { name: '.gitignore', type: 'file' }
      ];

      assert.throws(
        () => {
          program(files, configObject);
        },
        (err: Error) => err.message.includes('extraneous.js, was not validated')
      );
    });

    it('should validate because rule is optional', () => {
      const files = ['./.gitignore', './package.json'];

      const configObject: Types.FileDirectoryArray = [
        { name: 'package.json', type: 'file' },
        { name: 'optional.js', type: 'file', isOptional: true },
        { name: '.gitignore', type: 'file' }
      ];

      assert.doesNotThrow(
        () => {
          program(files, configObject);
        }, () => null
      );
    });

    it('should throw because rule is not optional', () => {
      const files = ['./.gitignore', './package.json'];

      const configObject: Types.FileDirectoryArray = [
        { name: 'package.json', type: 'file' },
        { name: 'optional.js', type: 'file' },
        { name: '.gitignore', type: 'file' }
      ];

      assert.throws(
        () => {
          program(files, configObject);
        },
        (err: Error) =>
          err.message.includes(`${JSON.stringify(configObject[1])}, rule did not passed`)
      );
    });
  });

  describe('Directories', () => {
    it('should validate an basic directory', () => {
      const files = ['./src/nice file.js', './src/blue.conf'];

      const configObject: Types.FileDirectoryArray = [
        {
          name: 'package.json',
          type: 'directory',
          children: [
            { name: 'nice file.js', type: 'file' },
            { name: 'blue.conf', type: 'file' }
          ]
        }
      ];

      assert.doesNotThrow(() => {
        program(files, configObject);
      }, () => null);
    });
    /**
     * if recursive is true and optional is not, only
     * the first iteration should be required, children will
     * be optional
     */
    it('should work if recursive is true but optional is not');
    it('should work with camelCase names');
    it('should throw with camelCase names');
  });
});

    // const files = [
    //   './.gitignore',
    //   './package.json',
    //   './src/landingPages/index.js'
    // ];

    // const configObject: Types.FileDirectoryArray = [
    //   {
    //     name: 'src',
    //     type: 'directory',
    //     children: [
    //       {
    //         name: '[camelCase]',
    //         type: 'directory',
    //         isOptional: true,
    //         isRecursive: true,
    //         children: [
    //           {
    //             name: 'index.js',
    //             type: 'file'
    //           }
    //         ]
    //       }
    //     ]
    //   },
    //   {
    //     name: 'package.json',
    //     type: 'file'
    //   },
    //   {
    //     name: '.gitignore',
    //     type: 'file'
    //   }
    // ];

    // assert.doesNotThrow(() => {
    //   program(files, configObject);
    // });
