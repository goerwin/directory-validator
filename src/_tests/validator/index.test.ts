import { describe, expect, it } from 'vitest';
import { generateFilesAndDirsFromPaths } from '../../helpers/file';
import * as validator from '../../validator';

describe('Validator:', () => {
  it('should validate if no rules passed', () => {
    expect(() => validator.run(generateFilesAndDirsFromPaths(['package.json', '.gitignore']), [])).not.toThrow();
  });

  it('should validate if no rules passed and no files passed', () => {
    expect(() => validator.run([], [])).not.toThrow();
  });
});
