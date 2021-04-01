import * as path from 'path';
import * as errors from '../../errors';
import * as program from '../../program';

const exampleProjectPath = path.join(__dirname, 'examples/project1');

describe('Program:', () => {
  it('should validate the config file', () => {
    const configFile = path.join(exampleProjectPath, 'conf.json');

    expect(() => program.run(exampleProjectPath, configFile)).not.toThrow();
  });

  it('should throw if config json path does not exist', () => {
    const configFile = 'thisdoesnotexist';

    expect(() => program.run(exampleProjectPath, configFile)).toThrowError(
      "no such file or directory, open 'thisdoesnotexist'"
    );
  });

  it('should throw if syntax error in JSON', () => {
    const configFile = path.join(exampleProjectPath, 'conf1.json');

    expect(() => program.run(exampleProjectPath, configFile)).toThrowError(
      errors.JsonParseError
    );
  });

  it('should throw if JSON with invalid schema', () => {
    const configFile = path.join(exampleProjectPath, 'conf2.json');

    expect(() => program.run(exampleProjectPath, configFile)).toThrowError(
      errors.ConfigJsonValidateError
    );
  });

  it('should throw because of invalid file', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project2');
    const configFile = path.join(exampleProjectPath, 'conf.json');

    expect(() => program.run(exampleProjectPath, configFile)).toThrowError(
      errors.ValidatorInvalidPathError
    );
  });

  it('should validate because of the option ignoreFiles', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project2');
    const configFile = path.join(exampleProjectPath, 'conf.json');
    const configFile2 = path.join(exampleProjectPath, 'conf2.json');

    expect(() => {
      program.run(exampleProjectPath, configFile, {
        ignoreFilesGlob: 'file1.jpg',
      });
      program.run(exampleProjectPath, configFile, {
        ignoreFilesGlob: '{file1.jpg,file2.jpg}',
      });
      program.run(exampleProjectPath, configFile2);
    }).not.toThrow();
  });

  it('should throw because of invalid dir', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project3');
    const configFile = path.join(exampleProjectPath, 'conf.json');

    expect(() => program.run(exampleProjectPath, configFile)).toThrowError(
      errors.ValidatorInvalidPathError
    );
  });

  it('should throw because of invalid dirs', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project3');
    const configFile = path.join(exampleProjectPath, 'conf.json');

    expect(() => program.run(exampleProjectPath, configFile)).toThrowError(
      errors.ValidatorInvalidPathError
    );
  });

  it('should validate because of the option ignoreDirs', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project3');
    const configFile = path.join(exampleProjectPath, 'conf.json');
    const configFile2 = path.join(exampleProjectPath, 'conf2.json');

    expect(() => {
      program.run(exampleProjectPath, configFile, { ignoreDirsGlob: 'dir1' });
      program.run(exampleProjectPath, configFile, {
        ignoreDirsGlob: '{dir1,dir2}',
      });
      program.run(exampleProjectPath, configFile2);
    }).not.toThrow();
  });

  it('should validate conf3.json in project3 because of common rule', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project3');
    const configFile = path.join(exampleProjectPath, 'conf3.json');

    expect(() => program.run(exampleProjectPath, configFile)).not.toThrow();
  });

  it('should throw because common rule in conf4.json in project3 not enough', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project3');
    const configFile = path.join(exampleProjectPath, 'conf4.json');

    expect(() => program.run(exampleProjectPath, configFile)).toThrowError(
      errors.ValidatorRuleError
    );
  });

  it('should validate because config file validates everything', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project3');
    const configFile = path.join(exampleProjectPath, 'conf5.json');

    expect(() => program.run(exampleProjectPath, configFile)).not.toThrow();
  });

  it('should throw if common rule not found', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project3');
    const configFile = path.join(exampleProjectPath, 'conf6.json');

    expect(() => program.run(exampleProjectPath, configFile)).toThrowError(
      errors.ConfigJsonValidateError
    );
  });

  it('should validate project4 conf.json', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project4');
    const configFile = path.join(exampleProjectPath, 'conf.json');

    expect(() => program.run(exampleProjectPath, configFile)).not.toThrow();
  });

  it('should validate project4 conf2.json because optional common rule', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project4');
    const configFile = path.join(exampleProjectPath, 'conf2.json');

    expect(() => program.run(exampleProjectPath, configFile)).not.toThrow();
  });

  it('should validate because inception rule', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project4');
    const configFile = path.join(exampleProjectPath, 'conf3.json');
    const configFile2 = path.join(exampleProjectPath, 'conf4.json');

    expect(() => {
      program.run(exampleProjectPath, configFile);
      program.run(exampleProjectPath, configFile2);
    }).not.toThrow();
  });

  it('should throw project4 confbad1.json', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project4');
    const configFile = path.join(exampleProjectPath, 'confbad1.json');

    expect(() => program.run(exampleProjectPath, configFile)).toThrowError(
      errors.ValidatorRuleError
    );
  });

  it('should throw project4 confbad2.json because of non optional common rule', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project4');
    const configFile = path.join(exampleProjectPath, 'confbad2.json');

    expect(() => program.run(exampleProjectPath, configFile)).toThrowError(
      errors.ValidatorRuleError
    );
  });
});
