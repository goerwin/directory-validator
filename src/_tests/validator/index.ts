import * as assert from 'assert';
import * as types from '../../types';
import * as validator from '../../validator';
import * as directory from './directory';
import * as file from './file';
import * as fileDirectory from './file-directory';

describe('Validator:', () => {
  it('should validate if no rules passed', () => {
    assert.doesNotThrow(() => {
      validator.run(['package.json', '.gitignore'], []);
    });
  });

  it('should validate if no rules passed and no files passed', () => {
    assert.doesNotThrow(() => {
      validator.run([], []);
    });
  });

  file.run();
  directory.run();
  fileDirectory.run();
});
