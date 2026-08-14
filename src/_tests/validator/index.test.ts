import { describe, expect, it } from 'vitest';
import { run } from '../../validator';
import { runDirectoryTests } from './directory';
import { runFileTests } from './file';
import { runFileDirectoryTests } from './fileDirectory';

describe('Validator:', () => {
  it('should validate if no rules passed', () => {
    expect(() => run(['package.json', '.gitignore'], [])).not.toThrow();
  });

  it('should validate if no rules passed and no files passed', () => {
    expect(() => run([], [])).not.toThrow();
  });

  runFileTests();
  runDirectoryTests();
  runFileDirectoryTests();
});
