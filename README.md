# directory-validator

[![Package Version](https://img.shields.io/npm/v/directory-validator.svg)](https://www.npmjs.com/package/directory-validator)

CLI Tool to validate directory structures.
If you want to have control over what files/dirs a directory can have then this can be useful.

## Installation

```
$ npm install directory-validator
```

## Usage

Generate a configuration file `.directoryvalidator.json` to start with:

```
$ directory-validator --init
```

Run the validator on the current directory:

```
$ directory-validator .
```

The tool will evaluate the rules provided by the configuration file against the current directory and output errors if any.

## Configuration File

```jsonc
{
  "ignoreFiles": [".gitignore"],
  "ignoreDirs": ["node_modules", ".git"],
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

In this example:

- We ignore the file `.gitignore` and both `.node_modules` and `.git` directories from being analized
- We want to have one file name `package.json` and one file named `index.js`
- We want one directory `src` to have one file named `index.js`. Since it's optional,
  if the directory does not exist we ignore the rule, but if it does then it must only
  have one file `index.js`

### ignoreFiles:

A string or glob pattern. For example:

```jsonc
[
  "package.json",
  "**/*.test.js",
  ".*" // files starting with "."
]
```

### ignoreDirs:

A string or glob pattern. For example:

```jsonc
[
  "node_modules",
  "src/**/tests",
  ".*" // dirs starting with "."
]
```

### commonRules:

Define File, Directory and Common rules that can be reused in `rules`

```jsonc
{
  // key must start with "rule_"
  // Examples:
  "rule_indexfile": {
    "type": "file",
    "name": "index.js"
  },
  "rule_anotherrule": {
    "type": "directory",
    "name": "images",
    "rules": [
      {
        "type": "file",
        "name": "logo.png"
      }
    ]
  }
}
```

### rules:

Can contain File, Directory and Common Rules

#### File Rule

```jsonc
{
  // Required
  "type": "file",

  // Required
  // can be string or RegExp
  // if RegExp then it has to start and end with /
  // if string then it can contain one
  // special case: [camelCase], [UPPERCASE], [dash-case], [snake_case], *
  // Examples:
  "name": "package.json",
  "name": "[snake_case]",
  "name": "[camelCase].js",
  "name": ".[UPPERCASE]",
  "name": ".[dash-case].jpg",
  "name": "*.png",
  "name": "/index.(js|ts)/",

  // Optional
  // default: null
  // can be string or RegExp (do not include the dot)
  // if RegExp then it has to start and end with /
  // Examples:
  "extension": "js",
  "extension": "png",
  "extension": "/(png|jpg|gif)/",

  // Optional
  // default: false
  // Whether the file can be included
  "isOptional": false
}
```

#### Directory Rule

```jsonc
{
  // Required
  "type": "directory",

  // Required
  // Same options as file names
  // Examples:
  "name": "src",
  "name": "important-[dash-case]",

  // Optional
  // default: false
  // Whether the directory can be included
  "isOptional": false,

  // Optional
  // default: false
  // Whether the directory can be recursive
  // Adds the ability to check directory rules recursively
  "isRecursive": false,

  // Optional
  // An array containing file and directory rules
  // If empty or omitted then we don't validate dir content
  "rules": []
}
```

#### Common Rule

```jsonc
{
  // Required
  "type": "common",

  // Required
  // must match a key property inside "commonRules"
  // examples:
  "key": "rule_indexfile",
  "key": "rule_test2",
  "key": "rule_whatever",

  // Optional
  // default: false
  // Whether the directory can be included
  "isOptional": false
}
```

## Notes

- When you run `$ directory-validator ./` it will look for a `.directoryvalidator.json` file in the current directory, if it doesn't find one, it will try to look for one in the upper directory and so on until the home directory is reached. If no file is found then no rules are applied.

- Rules are inclusive, meaning that if multiple rules match the same files/dirs, they pass.
  - For example, the rules `{ "name": "index.js", "type": "file" }` and `{ "name": "[camelCase].js", "type": "file" }`, will match a file `index.js` so they both pass.
