import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ConfigJsonValidateError,
  JsonParseError,
  ValidatorInvalidPathError,
  ValidatorRuleError,
} from '../../errors';
import { run } from '../../program';

const exampleProjectPath = join(__dirname, 'examples/project1');

describe('Program:', () => {
  it('should validate the config file', () => {
    const configFile = join(exampleProjectPath, 'conf.json');

    expect(() => run(exampleProjectPath, configFile)).not.toThrow();
  });

  it('should throw if config json path does not exist', () => {
    const configFile = 'thisdoesnotexist';

    expect(() => run(exampleProjectPath, configFile)).toThrowError(
      "no such file or directory, open 'thisdoesnotexist'",
    );
  });

  it('should throw if syntax error in JSON', () => {
    const configFile = join(exampleProjectPath, 'conf1.json');

    expect(() => run(exampleProjectPath, configFile)).toThrowError(
      JsonParseError,
    );
  });

  it('should throw if JSON with invalid schema', () => {
    const configFile = join(exampleProjectPath, 'conf2.json');

    expect(() => run(exampleProjectPath, configFile)).toThrowError(
      ConfigJsonValidateError,
    );
  });

  it('should throw because of invalid file', () => {
    const exampleProjectPath = join(__dirname, 'examples/project2');
    const configFile = join(exampleProjectPath, 'conf.json');

    expect(() => run(exampleProjectPath, configFile)).toThrowError(
      ValidatorInvalidPathError,
    );
  });

  it('should validate because of the option ignoreFiles', () => {
    const exampleProjectPath = join(__dirname, 'examples/project2');
    const configFile = join(exampleProjectPath, 'conf.json');
    const configFile2 = join(exampleProjectPath, 'conf2.json');

    expect(() => {
      run(exampleProjectPath, configFile, {
        ignoreFilesGlob: 'file1.jpg',
      });
      run(exampleProjectPath, configFile, {
        ignoreFilesGlob: '{file1.jpg,file2.jpg}',
      });
      run(exampleProjectPath, configFile2);
    }).not.toThrow();
  });

  it('should throw because of invalid dir', () => {
    const exampleProjectPath = join(__dirname, 'examples/project3');
    const configFile = join(exampleProjectPath, 'conf.json');

    expect(() => run(exampleProjectPath, configFile)).toThrowError(
      ValidatorInvalidPathError,
    );
  });

  it('should throw because of invalid dirs', () => {
    const exampleProjectPath = join(__dirname, 'examples/project3');
    const configFile = join(exampleProjectPath, 'conf.json');

    expect(() => run(exampleProjectPath, configFile)).toThrowError(
      ValidatorInvalidPathError,
    );
  });

  it('should validate because of the option ignoreDirs', () => {
    const exampleProjectPath = join(__dirname, 'examples/project3');
    const configFile = join(exampleProjectPath, 'conf.json');
    const configFile2 = join(exampleProjectPath, 'conf2.json');

    expect(() => {
      run(exampleProjectPath, configFile, { ignoreDirsGlob: 'dir1' });
      run(exampleProjectPath, configFile, {
        ignoreDirsGlob: '{dir1,dir2}',
      });
      run(exampleProjectPath, configFile2);
    }).not.toThrow();
  });

  it('should validate conf3.json in project3 because of common rule', () => {
    const exampleProjectPath = join(__dirname, 'examples/project3');
    const configFile = join(exampleProjectPath, 'conf3.json');

    expect(() => run(exampleProjectPath, configFile)).not.toThrow();
  });

  it('should throw because common rule in conf4.json in project3 not enough', () => {
    const exampleProjectPath = join(__dirname, 'examples/project3');
    const configFile = join(exampleProjectPath, 'conf4.json');

    expect(() => run(exampleProjectPath, configFile)).toThrowError(
      ValidatorRuleError,
    );
  });

  it('should validate because config file validates everything', () => {
    const exampleProjectPath = join(__dirname, 'examples/project3');
    const configFile = join(exampleProjectPath, 'conf5.json');

    expect(() => run(exampleProjectPath, configFile)).not.toThrow();
  });

  it('should throw if common rule not found', () => {
    const exampleProjectPath = join(__dirname, 'examples/project3');
    const configFile = join(exampleProjectPath, 'conf6.json');

    expect(() => run(exampleProjectPath, configFile)).toThrowError(
      ConfigJsonValidateError,
    );
  });

  it('should validate project4 conf.json', () => {
    const exampleProjectPath = join(__dirname, 'examples/project4');
    const configFile = join(exampleProjectPath, 'conf.json');

    expect(() => run(exampleProjectPath, configFile)).not.toThrow();
  });

  it('should validate project4 conf2.json because optional common rule', () => {
    const exampleProjectPath = join(__dirname, 'examples/project4');
    const configFile = join(exampleProjectPath, 'conf2.json');

    expect(() => run(exampleProjectPath, configFile)).not.toThrow();
  });

  it('should validate because inception rule', () => {
    const exampleProjectPath = join(__dirname, 'examples/project4');
    const configFile = join(exampleProjectPath, 'conf3.json');
    const configFile2 = join(exampleProjectPath, 'conf4.json');

    expect(() => {
      run(exampleProjectPath, configFile);
      run(exampleProjectPath, configFile2);
    }).not.toThrow();
  });

  it('should throw project4 confbad1.json', () => {
    const exampleProjectPath = join(__dirname, 'examples/project4');
    const configFile = join(exampleProjectPath, 'confbad1.json');

    expect(() => run(exampleProjectPath, configFile)).toThrowError(
      ValidatorRuleError,
    );
  });

  it('should throw project4 confbad2.json because of non optional common rule', () => {
    const exampleProjectPath = join(__dirname, 'examples/project4');
    const configFile = join(exampleProjectPath, 'confbad2.json');

    expect(() => run(exampleProjectPath, configFile)).toThrowError(
      ValidatorRuleError,
    );
  });
});
