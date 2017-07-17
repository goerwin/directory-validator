import * as assert from 'assert';
import * as path from 'path';
import * as errors from '../../errors';
import * as program from '../../program';
import * as types from '../../types';

const exampleProjectPath = path.join(__dirname, 'examples/project1');

describe('Program:', () => {
  it('should validate the config file', () => {
    const configFile = path.join(exampleProjectPath, 'conf.json');

    assert.doesNotThrow(() => {
      program.run(exampleProjectPath, configFile);
    });
  });

  it('should throw if config json path does not exist', () => {
    const configFile = 'thisdoesnotexist';

    assert.throws(
      () => { program.run(exampleProjectPath, configFile); },
      (err: Error) => err.message.includes('no such file or directory, open \'thisdoesnotexist\'')
    );
  });

  it('should throw if syntax error in JSON', () => {
    const configFile = path.join(exampleProjectPath, 'conf1.json');

    assert.throws(
      () => { program.run(exampleProjectPath, configFile); },
      (err: Error) => err instanceof errors.JsonParseError
    );
  });

  it('should throw if JSON with invalid schema', () => {
    const configFile = path.join(exampleProjectPath, 'conf2.json');

    assert.throws(
      () => { program.run(exampleProjectPath, configFile); },
      (err: Error) => err instanceof errors.ConfigJsonValidateError
    );
  });

  it('should throw because of invalid file', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project2');
    const configFile = path.join(exampleProjectPath, 'conf.json');

    assert.throws(
      () => { program.run(exampleProjectPath, configFile); },
      (err: Error) => err instanceof errors.ProgramInvalidPathError
    );
  });

  it('should validate because of the option ignoreFiles', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project2');
    const configFile = path.join(exampleProjectPath, 'conf.json');
    const configFile2 = path.join(exampleProjectPath, 'conf2.json');

    assert.doesNotThrow(() => {
      program.run(exampleProjectPath, configFile, { ignoreFilesGlob: 'file1.jpg' });
      program.run(exampleProjectPath, configFile, { ignoreFilesGlob: '{file1.jpg,file2.jpg}' });
      program.run(exampleProjectPath, configFile2);
    });
  });

  it('should throw because of invalid dir', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project3');
    const configFile = path.join(exampleProjectPath, 'conf.json');

    assert.throws(
      () => { program.run(exampleProjectPath, configFile); },
      (err: Error) => err instanceof errors.ProgramInvalidPathError
    );
  });

  it('should throw because of invalid dirs', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project3');
    const configFile = path.join(exampleProjectPath, 'conf.json');

    assert.throws(
      () => { program.run(exampleProjectPath, configFile); },
      (err: Error) => err instanceof errors.ProgramInvalidPathError
    );
  });

  it('should validate because of the option ignoreDirs', () => {
    const exampleProjectPath = path.join(__dirname, 'examples/project3');
    const configFile = path.join(exampleProjectPath, 'conf.json');
    const configFile2 = path.join(exampleProjectPath, 'conf2.json');

    assert.doesNotThrow(() => {
      program.run(exampleProjectPath, configFile, { ignoreDirsGlob: 'dir1' });
      program.run(exampleProjectPath, configFile, { ignoreDirsGlob: '{dir1,dir2}' });
      program.run(exampleProjectPath, configFile2);
    }, () => null);
  });
});
