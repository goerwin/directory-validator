import * as validator from '../../validator';
import * as directory from './directory';
import * as file from './file';
import * as fileDirectory from './fileDirectory';

describe('Validator:', () => {
  it('should validate if no rules passed', () => {
    expect(() =>
      validator.run(['package.json', '.gitignore'], [])
    ).not.toThrow();
  });

  it('should validate if no rules passed and no files passed', () => {
    expect(() => validator.run([], [])).not.toThrow();
  });

  file.run();
  directory.run();
  fileDirectory.run();
});
