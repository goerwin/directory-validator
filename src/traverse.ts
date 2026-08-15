import * as fs from 'node:fs';
import * as path from 'node:path';
import ignore, { type Ignore } from 'ignore';

export type TraversedFile = {
  name: string;
  base: string;
  ext: string;
  path: string;
  isIgnored: boolean;
};

export type TraversedDir = {
  name: string;
  path: string;
  isIgnored: boolean;
  isEmpty: boolean;
};

export type TraverseOptions = {
  ignoreFiles?: string[];
  ignoreDirs?: string[];
  useGitIgnore?: boolean;
};

export type TraverseResult = {
  files: TraversedFile[];
  dirs: TraversedDir[];
};

export type TraverseTree = {
  files: string[];
  dirs: Record<string, TraverseTree>;
  gitignore?: string;
};

export type TreeNode =
  | {
      type: 'file';
      name: string;
      base: string;
      ext: string;
      path: string;
      isIgnored: boolean;
    }
  | {
      type: 'directory';
      name: string;
      path: string;
      isIgnored: boolean;
      isEmpty: boolean;
      children: TreeNode[];
    };

type GitignoreContext = {
  base: string;
  ig: Ignore;
};

function isFile(dirPath: string, relPath: string, name: string) {
  try {
    // Broken symlinks can make this throw so that's why the try/catch
    return fs.statSync(path.join(dirPath, relPath, name)).isFile();
  } catch {
    return false;
  }
}

function isDirectory(dirPath: string, relPath: string, name: string) {
  try {
    // Broken symlinks can make this throw so that's why the try/catch
    return fs.statSync(path.join(dirPath, relPath, name)).isDirectory();
  } catch {
    return false;
  }
}

function loadGitignoreContexts(
  tree: TraverseTree,
  relPosixPath: string,
  parentContexts: GitignoreContext[],
): GitignoreContext[] {
  if (tree.gitignore === undefined) {
    return parentContexts;
  }

  const ig = ignore();
  ig.add(tree.gitignore.split(/\r?\n/));

  return [...parentContexts, { base: relPosixPath, ig }];
}

function isGitignored(relPosixPath: string, contexts: GitignoreContext[]) {
  for (let i = contexts.length - 1; i >= 0; i -= 1) {
    const { base, ig } = contexts[i];
    if (base !== '.' && !relPosixPath.startsWith(`${base}/`)) {
      continue;
    }

    const relToBase =
      base === '.' ? relPosixPath : relPosixPath.slice(base.length + 1);
    const result = ig.test(relToBase);

    if (result.ignored || result.unignored) {
      return result.ignored;
    }
  }

  return false;
}

function walkTree(
  tree: TraverseTree,
  relPath: string,
  relPosixPath: string,
  ignoreFiles: Set<string>,
  ignoreDirs: Set<string>,
  useGitIgnore: boolean,
  gitignoreContexts: GitignoreContext[],
): TraverseResult {
  const files: TraversedFile[] = [];
  const dirs: TraversedDir[] = [];

  tree.files.forEach((name) => {
    const childRelPath = path.normalize(path.join(relPath, name));
    const childRelPosixPath =
      relPosixPath === '.' ? name : `${relPosixPath}/${name}`;
    const parsed = path.parse(name);

    files.push({
      name: parsed.name,
      base: parsed.base,
      ext: parsed.ext,
      path: childRelPath,
      isIgnored:
        ignoreFiles.has(childRelPath) ||
        isGitignored(childRelPosixPath, gitignoreContexts),
    });
  });

  Object.keys(tree.dirs).forEach((name) => {
    const childTree = tree.dirs[name];
    const childRelPath = path.normalize(path.join(relPath, name));
    const childRelPosixPath =
      relPosixPath === '.' ? name : `${relPosixPath}/${name}`;

    const isIgnored =
      ignoreDirs.has(childRelPath) ||
      isGitignored(`${childRelPosixPath}/`, gitignoreContexts);
    const isEmpty =
      childTree.files.length === 0 && Object.keys(childTree.dirs).length === 0;

    dirs.push({ name, path: childRelPath, isIgnored, isEmpty });

    if (!isIgnored) {
      const childContexts = useGitIgnore
        ? loadGitignoreContexts(childTree, childRelPosixPath, gitignoreContexts)
        : gitignoreContexts;
      const childResult = walkTree(
        childTree,
        childRelPath,
        childRelPosixPath,
        ignoreFiles,
        ignoreDirs,
        useGitIgnore,
        childContexts,
      );
      files.push(...childResult.files);
      dirs.push(...childResult.dirs);
    }
  });

  return { files, dirs };
}

export function traverseTree(
  tree: TraverseTree,
  options: TraverseOptions = {},
): TraverseResult {
  const ignoreFiles = new Set(
    (options.ignoreFiles || []).map((el) => path.normalize(el)),
  );
  const ignoreDirs = new Set(
    (options.ignoreDirs || []).map((el) => {
      const normalized = path.normalize(el);
      return normalized[normalized.length - 1] === '/'
        ? normalized.substring(0, normalized.length - 1)
        : normalized;
    }),
  );
  const useGitIgnore = !!options.useGitIgnore;
  const gitignoreContexts = useGitIgnore
    ? loadGitignoreContexts(tree, '.', [])
    : [];

  return walkTree(
    tree,
    '',
    '.',
    ignoreFiles,
    ignoreDirs,
    useGitIgnore,
    gitignoreContexts,
  );
}

function readTree(dirPath: string): TraverseTree {
  let entries: string[];
  try {
    entries = fs.readdirSync(dirPath);
  } catch {
    return { files: [], dirs: {} };
  }

  const files: string[] = [];
  const dirs: Record<string, TraverseTree> = {};
  entries.forEach((name) => {
    if (isFile(dirPath, '', name)) {
      files.push(name);
    } else if (isDirectory(dirPath, '', name)) {
      dirs[name] = readTree(path.join(dirPath, name));
    }
  });

  const gitignorePath = path.join(dirPath, '.gitignore');
  const gitignore = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, 'utf8')
    : undefined;

  return { files, dirs, gitignore };
}

export function traverse(
  dirPath: string,
  options: TraverseOptions = {},
): TraverseResult {
  return traverseTree(readTree(dirPath), options);
}

export function generateJsonTree(
  rootPath: string,
  items: Array<TraversedFile | TraversedDir>,
): TreeNode | undefined {
  const rootPathName = path.basename(rootPath);
  const isFileItem = (
    item: TraversedFile | TraversedDir,
  ): item is TraversedFile => 'base' in item;

  function childrenGenerator(
    item: TraversedFile | TraversedDir,
    parentDirDirs: string[],
    parentDirs: string[],
    siblings: TreeNode[] = [],
  ): TreeNode[] {
    if (parentDirs.length === 0) {
      return [
        ...siblings,
        isFileItem(item)
          ? {
              type: 'file',
              name: item.name,
              base: item.base,
              ext: item.ext,
              path: item.path,
              isIgnored: item.isIgnored,
            }
          : {
              type: 'directory',
              children: [],
              name: item.name,
              path: item.path,
              isIgnored: item.isIgnored,
              isEmpty: item.isEmpty,
            },
      ];
    }

    // Get the new Siblings for newItem
    const newParentPath = parentDirDirs
      .slice(0, parentDirDirs.length - (parentDirs.length - 1))
      .join('/');
    const newItem = siblings.find((el) => el.path === newParentPath);
    const newSiblings =
      (newItem && newItem.type === 'directory' && newItem.children) || [];
    return [
      ...siblings.filter((el) => el.path !== newParentPath),
      {
        type: 'directory',
        name: parentDirs[0],
        path: newParentPath,
        isEmpty: false,
        isIgnored: false,
        children: childrenGenerator(
          item,
          parentDirDirs,
          parentDirs.slice(1),
          newSiblings,
        ),
      },
    ];
  }

  return items
    .sort((item1, item2) => (item1.path < item2.path ? -1 : 1))
    .reduce<TreeNode[]>((result, item) => {
      const relativefilepath = path.relative(rootPath, item.path);
      const parentDir = path.dirname(relativefilepath);
      const parentDirDirs = [
        rootPathName,
        ...(parentDir === '.' ? [] : parentDir.split('/')),
      ];
      return childrenGenerator(item, parentDirDirs, parentDirDirs, result);
    }, [])[0];
}

export function generateAsciiTree(
  rootPath: string,
  items: Array<TraversedFile | TraversedDir>,
): string | null {
  const jsonTree = generateJsonTree(rootPath, items);

  function childrenTree(
    children: TreeNode[],
    levels = 0,
    continuationPipeLevels: number[] = [],
  ): string {
    if (children.length === 0) {
      return '';
    }

    let separator = '├──';
    if (children.length === 1) {
      separator = '└──';
    }

    let levelsSpaces = '';
    if (levels > 0) {
      for (let i = 0; i < levels * 4; i += 1) {
        levelsSpaces += ' ';
      }
      continuationPipeLevels.forEach((level) => {
        const idx = level * 4;
        levelsSpaces =
          levelsSpaces.substring(0, idx) +
          '│' +
          levelsSpaces.substring(idx + 1);
      });
    }

    const child = children[0];
    let childrensChildren: TreeNode[];
    let name: string;
    if (child.type === 'file') {
      name = child.base;
      childrensChildren = [];
      if (child.isIgnored) {
        name += ' /fileIgnored';
      }
    } else {
      name = child.name;
      childrensChildren = child.children;
      if (child.isEmpty) {
        name += ' /emptyDirectory';
      }
      if (child.isIgnored) {
        name += ' /directoryIgnored';
      }
    }

    const childrensChildrenTree = childrenTree(childrensChildren, levels + 1, [
      ...continuationPipeLevels,
      ...(children.length > 1 && childrensChildren.length ? [levels] : []),
    ]);
    return (
      `\n${levelsSpaces}${separator} ${name}` +
      `${childrensChildrenTree}` +
      `${childrenTree(children.slice(1), levels, continuationPipeLevels)}`
    );
  }

  if (!jsonTree || !(jsonTree.type === 'directory')) {
    return null;
  }
  return `${jsonTree.name}${childrenTree(jsonTree.children)}`;
}
