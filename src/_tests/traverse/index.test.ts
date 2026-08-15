import { describe, expect, it } from 'vitest';
import type { TraverseResult, TraverseTree } from '../../traverse';
import {
  generateAsciiTree,
  generateJsonTree,
  traverseTree,
} from '../../traverse';

const fileByPath = (result: TraverseResult, filePath: string) =>
  result.files.find((el) => el.path === filePath);
const dirByPath = (result: TraverseResult, dirPath: string) =>
  result.dirs.find((el) => el.path === dirPath);

describe('Traverse:', () => {
  it('lists files and dirs with their metadata', () => {
    const tree: TraverseTree = {
      files: ['README.md', 'keep.txt'],
      dirs: {
        src: { files: ['index.js'], dirs: {} },
        empty: { files: [], dirs: {} },
      },
    };

    const result = traverseTree(tree);

    expect(result.files).toEqual([
      expect.objectContaining({
        name: 'README',
        base: 'README.md',
        ext: '.md',
        path: 'README.md',
        isIgnored: false,
      }),
      expect.objectContaining({
        name: 'keep',
        base: 'keep.txt',
        ext: '.txt',
        path: 'keep.txt',
        isIgnored: false,
      }),
      expect.objectContaining({
        name: 'index',
        base: 'index.js',
        ext: '.js',
        path: 'src/index.js',
        isIgnored: false,
      }),
    ]);
    expect(result.dirs).toEqual([
      expect.objectContaining({
        name: 'src',
        path: 'src',
        isIgnored: false,
        isEmpty: false,
      }),
      expect.objectContaining({
        name: 'empty',
        path: 'empty',
        isIgnored: false,
        isEmpty: true,
      }),
    ]);
  });

  it('marks files matched by ignoreFiles', () => {
    const tree: TraverseTree = {
      files: ['keep.txt', 'skip.test.js'],
      dirs: {},
    };

    const result = traverseTree(tree, { ignoreFiles: ['skip.test.js'] });

    expect(fileByPath(result, 'keep.txt')?.isIgnored).toBe(false);
    expect(fileByPath(result, 'skip.test.js')?.isIgnored).toBe(true);
  });

  it('marks dirs matched by ignoreDirs and prunes them', () => {
    const tree: TraverseTree = {
      files: ['keep.txt'],
      dirs: {
        node_modules: { files: ['x.js'], dirs: {} },
      },
    };

    const result = traverseTree(tree, { ignoreDirs: ['node_modules'] });

    expect(dirByPath(result, 'node_modules')?.isIgnored).toBe(true);
    expect(fileByPath(result, 'node_modules/x.js')).toBeUndefined();
  });

  it('normalizes a trailing slash in ignoreDirs', () => {
    const tree: TraverseTree = {
      files: [],
      dirs: {
        dist: { files: ['a.js'], dirs: {} },
      },
    };

    const result = traverseTree(tree, { ignoreDirs: ['dist/'] });

    expect(dirByPath(result, 'dist')?.isIgnored).toBe(true);
  });

  it('does not ignore anything by default', () => {
    const tree: TraverseTree = {
      gitignore: '*.log',
      files: ['keep.txt', 'skip.log'],
      dirs: {},
    };

    const result = traverseTree(tree);

    expect(fileByPath(result, 'skip.log')?.isIgnored).toBe(false);
  });

  it('ignores files matched by the root gitignore', () => {
    const tree: TraverseTree = {
      gitignore: '*.log',
      files: ['keep.txt', 'skip.log'],
      dirs: {
        src: { files: ['a.log'], dirs: {} },
      },
    };

    const result = traverseTree(tree, { useGitIgnore: true });

    expect(fileByPath(result, 'keep.txt')?.isIgnored).toBe(false);
    expect(fileByPath(result, 'skip.log')?.isIgnored).toBe(true);
    expect(fileByPath(result, 'src/a.log')?.isIgnored).toBe(true);
  });

  it('ignores dirs matched by the root gitignore and prunes them', () => {
    const tree: TraverseTree = {
      gitignore: 'build/',
      files: ['keep.txt'],
      dirs: {
        build: { files: ['x.js'], dirs: {} },
      },
    };

    const result = traverseTree(tree, { useGitIgnore: true });

    expect(dirByPath(result, 'build')?.isIgnored).toBe(true);
    expect(fileByPath(result, 'build/x.js')).toBeUndefined();
  });

  it('re-includes files with a gitignore negation', () => {
    const tree: TraverseTree = {
      gitignore: '*.log\n!keep.log',
      files: ['keep.log', 'skip.log'],
      dirs: {},
    };

    const result = traverseTree(tree, { useGitIgnore: true });

    expect(fileByPath(result, 'keep.log')?.isIgnored).toBe(false);
    expect(fileByPath(result, 'skip.log')?.isIgnored).toBe(true);
  });

  it('lets a nested gitignore negation win over a root pattern', () => {
    const tree: TraverseTree = {
      gitignore: '*.log',
      files: ['keep.txt'],
      dirs: {
        sub: {
          gitignore: '!keep.log',
          files: ['keep.log', 'skip.log'],
          dirs: {},
        },
      },
    };

    const result = traverseTree(tree, { useGitIgnore: true });

    expect(fileByPath(result, 'sub/keep.log')?.isIgnored).toBe(false);
    expect(fileByPath(result, 'sub/skip.log')?.isIgnored).toBe(true);
  });

  it('does not read a gitignore inside a gitignored dir', () => {
    const tree: TraverseTree = {
      gitignore: 'dist/',
      files: [],
      dirs: {
        dist: {
          gitignore: '!keep.log',
          files: ['keep.log'],
          dirs: {},
        },
      },
    };

    const result = traverseTree(tree, { useGitIgnore: true });

    expect(fileByPath(result, 'dist/keep.log')).toBeUndefined();
  });

  it('renders ignored and empty items in the ascii tree', () => {
    const tree: TraverseTree = {
      gitignore: '*.log',
      files: ['keep.txt', 'a.log'],
      dirs: {
        node_modules: { files: ['x.js'], dirs: {} },
        empty: { files: [], dirs: {} },
      },
    };
    const { files, dirs } = traverseTree(tree, {
      ignoreDirs: ['node_modules'],
      useGitIgnore: true,
    });

    const asciiTree = generateAsciiTree('root', [
      ...files,
      ...dirs.filter((el) => el.isIgnored || el.isEmpty),
    ]);

    expect(asciiTree).toContain('a.log /fileIgnored');
    expect(asciiTree).toContain('node_modules /directoryIgnored');
    expect(asciiTree).toContain('empty /emptyDirectory');
    expect(asciiTree).toContain('keep.txt');
    expect(asciiTree).not.toContain('keep.txt /fileIgnored');
  });

  it('builds a json tree rooted at the given rootPath name', () => {
    const { files, dirs } = traverseTree({
      files: ['keep.txt'],
      dirs: {},
    });

    const jsonTree = generateJsonTree('root', [
      ...files,
      ...dirs.filter((el) => el.isIgnored || el.isEmpty),
    ]);

    expect(jsonTree?.type).toBe('directory');
    expect(jsonTree?.name).toBe('root');
  });
});
