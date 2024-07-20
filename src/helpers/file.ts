import fs from 'node:fs';
import nodePath from 'node:path';

type File = {
  type: 'file';
  fullPath: string;
  path: string;
};

type Directory = {
  type: 'dir';
  fullPath: string;
  path: string;
  isEmpty: boolean;
};

export function generateFilesAndDirsFromPaths(filePaths: string[], emptyDirPaths: string[] = []) {
  const map = new Map<string, File | Directory>();

  filePaths.forEach((filePath) => {
    filePath.split('/').reduce((res, curr) => {
      const newRes = `${res}/${curr}`.replace(/^\//, '');
      const isFile = filePaths.includes(newRes);
      map.set(newRes, {
        path: newRes,
        fullPath: newRes,
        ...(isFile ? { type: 'file' } : { type: 'dir', isEmpty: false }),
      });

      return newRes;
    }, '');
  });

  emptyDirPaths.forEach((emptyDirPath) => {
    emptyDirPath.split('/').reduce((res, curr) => {
      const newRes = `${res}/${curr}`.replace(/^\//, '');
      map.set(newRes, {
        path: newRes,
        fullPath: newRes,
        type: 'dir',
        isEmpty: emptyDirPaths.includes(newRes),
      });
      return newRes;
    }, '');
  });

  return Array.from(map).map(([_, el]) => el);
}

// Favor this version over the one with recursive technique
export function getFilesAndDirectories(
  mainDirPath: string,
  options: { recursive: boolean; ignoreFilesAndDirectories?: string[] } = {
    recursive: true,
  },
): (File | Directory)[] {
  const result: (File | Directory)[] = [];
  const mainDirFullPath = nodePath.resolve(mainDirPath);
  const stack = [mainDirFullPath];

  while (stack.length > 0) {
    const dirPath = stack.pop();
    if (!dirPath) break;

    const items = fs.readdirSync(dirPath);
    const path = nodePath.relative(mainDirFullPath, dirPath);

    if (options.ignoreFilesAndDirectories?.includes(path)) continue;

    result.push({
      type: 'dir',
      fullPath: dirPath,
      path,
      isEmpty: items.length === 0,
    });

    for (const item of items) {
      const fullPath = nodePath.join(dirPath, item);
      const itemStat = fs.statSync(fullPath);
      const path = nodePath.relative(mainDirFullPath, fullPath);

      if (itemStat.isDirectory()) {
        if (options.recursive) stack.push(fullPath);
        else
          result.push({
            type: 'dir',
            fullPath,
            path,
            isEmpty: fs.readdirSync(fullPath).length === 0,
          });
      } else if (options.ignoreFilesAndDirectories?.includes(path)) continue;
      else result.push({ type: 'file', fullPath, path: path });
    }
  }

  return result;
}

export function getFilesAndDirectoriesWithRecursionTechnique(
  dirPath: string,
  options: {
    recursive: boolean;
    _initialPath?: string;
    ignoreFilesAndDirectories?: string[];
  } = { recursive: true },
): (File | Directory)[] {
  const items = fs.readdirSync(dirPath);
  options._initialPath = options._initialPath || dirPath;
  const lPath = nodePath.relative(options._initialPath, dirPath);

  if (options.ignoreFilesAndDirectories?.includes(lPath)) return [];

  const result: (File | Directory)[] = [
    {
      type: 'dir',
      fullPath: dirPath,
      path: lPath,
      isEmpty: items.length === 0,
    },
  ];

  for (const item of items) {
    const fullPath = nodePath.join(dirPath, item);
    const itemStat = fs.statSync(fullPath);
    const localPath = nodePath.relative(options._initialPath, fullPath);

    if (itemStat.isDirectory()) {
      if (!options.recursive) result.push({ type: 'dir', fullPath, path: localPath, isEmpty: false });
      else result.push(...getFilesAndDirectories(fullPath, options));
    } else {
      if (options.ignoreFilesAndDirectories?.includes(localPath)) continue;
      result.push({ type: 'file', fullPath, path: localPath });
    }
  }

  return result;
}
