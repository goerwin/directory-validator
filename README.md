# directory-validator

[![Package Version](https://img.shields.io/npm/v/directory-validator.svg)](https://www.npmjs.com/package/directory-validator)

CLI to validate that a directory matches a set of file and folder rules.

## Installation

```
$ npm install directory-validator
```

## Usage

Generate a `.directoryvalidator.json` config:

```
$ directory-validator --init
```

Validate a directory:

```
$ directory-validator .
```

The process exits with code `0` when the directory is valid and `1` when validation fails, the configuration is invalid, or the configuration file was not found.

### CLI Options

| Option | Description |
| --- | --- |
| `<dirPath>` | Directory to validate (needed unless using `--init`) |
| `-i, --init` | Create a `.directoryvalidator.json` file in the current directory |
| `-p, --print` | Print the validated directory structure |
| `-f, --ignore-files <files>` | Ignore files by glob, eg: `-f "*.js"` |
| `-d, --ignore-dirs <dirs>` | Ignore directories by glob, eg: `-d "**/tests"` |
| `-g, --gitignore` | Respect `.gitignore` files |
| `-c, --config-file <path>` | Path to the configuration file |
| `-V, --version` | Print the version |
| `-h, --help` | Show help |

## Configuration

`--init` writes a `.directoryvalidator.json` like this:

```json
{
  "ignoreFiles": [".gitignore"],
  "ignoreDirs": ["node_modules", ".git"],
  "useGitIgnore": false,
  "commonRules": {
    "rule_indexfile": {
      "type": "file",
      "name": "index.js"
    }
  },
  "rules": [
    {
      "type": "file",
      "name": "package.json"
    },
    {
      "type": "common",
      "key": "rule_indexfile"
    },
    {
      "type": "directory",
      "name": "src",
      "isOptional": true,
      "rules": [
        {
          "type": "common",
          "key": "rule_indexfile"
        }
      ]
    }
  ]
}
```

If `-c` / `--config-file` is omitted, the tool looks for `.directoryvalidator.json` in the target directory, then in each parent directory up to the home directory.

### Rules

`rules` is an array of file, directory, or common rules. Every file and directory must match at least one rule. If several rules match the same path, they all pass.

#### File

- `type` (required): `"file"`
- `name` (required): matcher for the file name (see [Name patterns](#name-patterns))
- `extension` (optional): extension without the dot. If set, `name` is matched against the name **without** the extension (`logo` for `logo.png`). If omitted, `name` is matched against the full filename.
- `isOptional` (optional, default `false`): allow the file to be absent

#### Directory

- `type` (required): `"directory"`
- `name` (required): same matchers as file names
- `isOptional` (optional, default `false`): allow the directory to be absent
- `isRecursive` (optional, default `false`): apply this directory's `rules` to nested directories with the same name
- `rules` (optional): nested file and directory rules. If empty or omitted, any contents are allowed.

With `isRecursive`, both `src/index.js` and `src/src/index.js` pass:

```json
{
  "type": "directory",
  "name": "src",
  "isRecursive": true,
  "rules": [{ "type": "file", "name": "index.js" }]
}
```

#### Common

Reusable file or directory rules, defined in `commonRules`. Keys must start with `rule_`.

- `type` (required): `"common"`
- `key` (required): a key in `commonRules`
- `isOptional` (optional, default `false`): allow the referenced rule to be absent

### Name patterns

`name` (and `extension`) can be a string or a RegExp. In JSON, wrap a RegExp in `/.../`.

Special string tokens: `[camelCase]`, `[UPPERCASE]`, `[dash-case]`, `[snake_case]`, `*`.

```jsonc
"package.json"
"[snake_case]"
"[camelCase].js"
".[UPPERCASE]"
".[dash-case].jpg"
"*.png"
"/index.(js|ts)/"
```

`extension` examples: `"js"`, `"png"`, `"/(png|jpg|gif)/"`.

For example, `{ "name": "index.js", "type": "file" }` and `{ "name": "[camelCase].js", "type": "file" }` both match `index.js`.

### Ignoring files and directories

`ignoreFiles` and `ignoreDirs` take glob strings:

```json
{
  "ignoreFiles": [".gitignore", "**/*.test.js", ".*"],
  "ignoreDirs": ["node_modules", ".git", "src/**/tests"]
}
```

The same globs can be passed on the CLI with `-f` / `-d`.

When `useGitIgnore` is `true` (or `-g` is passed), `.gitignore` rules at or below the target directory are applied: matching files are skipped and matching directories are not traversed. Disabled by default.

## Contributing

Requires Node.js 24+. `npm test`, `npm run lint`, `npm run build`. Publishing is automated on push to `main`. To release: `npm version patch|minor|major`, then `git push --follow-tags`.
