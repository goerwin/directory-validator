# directory-validator

[![Build Status](https://travis-ci.org/erwingo/directory-validator.svg?branch=master)](https://travis-ci.org/erwingo/directory-validator)
[![Coverage Status](https://coveralls.io/repos/github/erwingo/directory-validator/badge.svg?branch=master)](https://coveralls.io/github/erwingo/directory-validator?branch=master)

Tool to validate directory structures.
If you want to have control over what files/dirs a directory can have then this can be useful.

## Installation

```
$ npm install -g directory-validator
```

## Usage

Generate a configuration file `.directoryschema.json` to start with:
```
$ directory-validator --init
```

Run the validator on the current directory:
```
$ directory-validator .
```

The tool will evaluate the rules provided by the configuration file against the current directory and output errors if any.

## Configuration File

```javascript
{
  "ignoreFiles": [
    ".gitignore"
  ],
  "ignoreDirs": [
    "node_modules"
  ],
  "rules": [
    {
      "type": "file",
      "name": "package.json"
    },
    {
      "type": "directory",
      "name": ".git",
      "rules": []
    }
  ]
}
```

In this example, we want our directory to have one file named `package.json` and one directory named `.git` and nothing else (`node_modules` and `.gitignore` were ignored).

If our directory has any file/dir other than the ones in the rules, the tool will throw an error.


### ignoreFiles

A string or glob pattern. For example:

```javascript
[
  "package.json",
  "**/*.test.js",
  ".*" // .gitignore file
]
```

### ignoreDirs

A string or glob pattern. For example:

```javascript
[
  "node_modules",
  "src/**/tests",
  ".*" // .git directory
]
```

### File Rules

File rules should have the following format:

```javascript
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

### Directory Rules

Directory rules should have the following format:

```javascript
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
  // If empty or omitted then we don't validate its content
  "rules": []
}
```

## Important Notes

* When you run `$ directory-validator ./` it will look for a `.directoryschema.json` file in the current directory, if it doesn't find one, it will try to look for one in the upper directory and so on until the home directory is reached. If no file is found then no rules are applied.

* Rules are inclusive, meaning that if multiple rules match the same files/dirs, they pass.

  For example, the rules `{ "name": "index.js", "type": "file" }` and `{ "name": "[camelCase].js", "type": "file" }`, will match a file `index.js` so they both pass.

## Examples

TODO: Provide some folder examples
* examples/basic
* examples/recursive-directories
* examples/multimatching-rules

## Contribute

TODO:
