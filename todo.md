
# TODO
- create bin file
- allow RegExp in names/extensions
- add a init option to create a config template
- should have a config file .directoryschema.json that
  should work like any config file
  -
- option to print the directory structure printed
- allow rules to be exclusive

# DONE
- what if you want 2 dirs in a directory and the rest can be whatever?
  - { name: * } should validate all the files/dirs recursively
- better errors in console
- rename it to directory-schema-validator
- read config from passed file
- allow dir rules to be inclusive
- commander
- program.run should accept an array of empty dirs
- right now if you pass no mainRules, it doesnt throw
  but if you dont pass rules to a subdirectory,
  it throws, what to do in this case?
  I think it should not throw
