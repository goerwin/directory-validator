import fs from 'node:fs';
import path from 'node:path';

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

export function getFilesAndDirectories(
  dirPath: string,
  options: {
    recursive: boolean;
    _initialPath?: string;
    ignoreFilesAndDirectories?: string[];
  } = { recursive: true },
): (File | Directory)[] {
  const items = fs.readdirSync(dirPath);
  options._initialPath = options._initialPath || dirPath;
  const lPath = path.relative(options._initialPath, dirPath);

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
    const fullPath = path.join(dirPath, item);
    const itemStat = fs.statSync(fullPath);
    const localPath = path.relative(options._initialPath, fullPath);

    if (itemStat.isDirectory()) {
      if (!options.recursive)
        result.push({ type: 'dir', fullPath, path: localPath, isEmpty: false });
      else result.push(...getFilesAndDirectories(fullPath, options));
    } else {
      if (options.ignoreFilesAndDirectories?.includes(localPath)) continue;
      result.push({ type: 'file', fullPath, path: localPath });
    }
  }

  return result;
}
