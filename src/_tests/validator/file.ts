import * as assert from 'assert';
import * as types from '../../types';
import * as validator from '../../validator';

export function run() {
  describe('Files:', () => {
    it('should validate using only filenames', () => {
      const files = ['./.gitignore', './package.json'];

      const configObject: types.Rules = [
        { name: 'package.json', type: 'file' },
        { name: '.gitignore', type: 'file' }
      ];

      assert.doesNotThrow(() => {
        validator.run(files, configObject);
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
          validator.run(files, configObject);
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
          validator.run(files, configObject);
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
          validator.run(files, configObject);
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
          validator.run(files, configObject);
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
          validator.run(files, configObject);
        });
      });

      it('should throw because wrong string extension', () => {
        const files = ['./.gitignore', './package.json'];

        const configObject: types.Rules = [
          { name: 'package', extension: '.json', type: 'file' },
          { name: '.gitignore', type: 'file' }
        ];

        assert.throws(
          () => { validator.run(files, configObject); },
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
          validator.run(files, configObject);
        });
      });

      it('should validate using regex as string', () => {
        const files = ['./.gitignore', './package.json'];

        const configObject: types.Rules = [
          { name: 'package', extension: '/(json|js)/', type: 'file' },
          { name: '.gitignore', type: 'file' }
        ];

        assert.doesNotThrow(() => {
          validator.run(files, configObject);
        });
      });

      it('should throw because wrong regex extension', () => {
        const files = ['./.gitignore', './package.json'];

        const configObject: types.Rules = [
          { name: 'package', extension: /.(json|js)/, type: 'file' },
          { name: '.gitignore', type: 'file' }
        ];

        assert.throws(
          () => { validator.run(files, configObject); },
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
          validator.run(files, configObject);
        });
      });

      it('should validate filenames ending camelcased', () => {
        const files = ['./_ERcamelizedNamedPogChamp'];

        const configObject: types.Rules = [
          { name: '_ER[camelCase]', type: 'file' }
        ];

        assert.doesNotThrow(() => {
          validator.run(files, configObject);
        });
      });

      it('should throw because one file is not camelcased as first/last', () => {
        const files = ['./camelizedNamedPogChamp.json', './package.json', './no-camelcase.js'];

        const configObject: types.Rules = [
          { name: '[camelCase].json', type: 'file' }
        ];

        assert.throws(
          () => {
            validator.run(files, configObject);
          },
          (err: Error) => err.message.includes('no-camelcase.js, was not validated')
        );

        const files2 = ['./no-camelcase.js', './camelizedNamedPogChamp.json', './package.json'];

        assert.throws(
          () => {
            validator.run(files2, configObject);
          },
          (err: Error) => err.message.includes('no-camelcase.js, was not validated')
        );
      });
    });

    describe('*:', () => {
      it('should validate all files', () => {
        const files = ['./.gitignore', './package.json'];

        const configObject: types.Rules = [
          { name: 'package.json', type: 'file' },
          { name: '.*', type: 'file' }
        ];

        assert.doesNotThrow(() => {
          validator.run(files, configObject);
        });
      });
    });

    describe('RegExp:', () => {
      it('should validate filenames', () => {
        const files = ['./index.js', './package.map'];

        const configObject: types.Rules = [
          { name: /[a-z]\.(js|map)/, type: 'file' }
        ];

        assert.doesNotThrow(() => {
          validator.run(files, configObject);
        });
      });

      it('should throw because one file does not match', () => {
        const files = ['./index.js', './package.map', 'rip8.js'];

        const configObject: types.Rules = [
          { name: /[a-z]\.(js|map)/, type: 'file' }
        ];

        assert.throws(
          () => { validator.run(files, configObject); },
          (err: Error) => err.message.includes('rip8.js, was not validated')
        );
      });
    });
  });
};
