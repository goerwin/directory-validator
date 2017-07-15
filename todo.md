
# TODO
- read config from passed file
- should have a config file directoryschemavalidator.json that
  should work like any config file
- rename it to directory-schema-validator
- better errors in console
- allow rules to be exclusive

# DONE
- allow dir rules to be inclusive
- commander
- program.run should accept an array of empty dirs
- right now if you pass no mainRules, it doesnt throw
  but if you dont pass rules to a subdirectory,
  it throws, what to do in this case?
  I think it should not throw
