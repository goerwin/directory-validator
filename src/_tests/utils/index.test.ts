import { describe, expect, it } from 'vitest';
import {
  camelCase,
  groupBy,
  kebabCase,
  snakeCase,
  upperCase,
} from '../../utils';

const cases: [string, string, string, string, string][] = [
  ['', '', '', '', ''],
  [' ', '', '', '', ''],
  ['foo', 'foo', 'FOO', 'foo', 'foo'],
  ['foo bar', 'fooBar', 'FOO BAR', 'foo-bar', 'foo_bar'],
  ['FOO BAR', 'fooBar', 'FOO BAR', 'foo-bar', 'foo_bar'],
  ['Foo Bar', 'fooBar', 'FOO BAR', 'foo-bar', 'foo_bar'],
  ['foo-bar', 'fooBar', 'FOO BAR', 'foo-bar', 'foo_bar'],
  ['foo_bar', 'fooBar', 'FOO BAR', 'foo-bar', 'foo_bar'],
  ['fooBar', 'fooBar', 'FOO BAR', 'foo-bar', 'foo_bar'],
  ['foo.bar', 'fooBar', 'FOO BAR', 'foo-bar', 'foo_bar'],
  ['foo bar baz', 'fooBarBaz', 'FOO BAR BAZ', 'foo-bar-baz', 'foo_bar_baz'],
  ['--foo-bar--', 'fooBar', 'FOO BAR', 'foo-bar', 'foo_bar'],
  ['__FOO_BAR__', 'fooBar', 'FOO BAR', 'foo-bar', 'foo_bar'],
  [
    'XMLHttpRequest',
    'xmlhttpRequest',
    'XMLHTTP REQUEST',
    'xmlhttp-request',
    'xmlhttp_request',
  ],
  ['XMLHttp', 'xmlhttp', 'XMLHTTP', 'xmlhttp', 'xmlhttp'],
  ['foo123bar', 'foo123bar', 'FOO123BAR', 'foo123bar', 'foo123bar'],
  ['123foo', '123foo', '123FOO', '123foo', '123foo'],
  ['foo 123 bar', 'foo123Bar', 'FOO 123 BAR', 'foo-123-bar', 'foo_123_bar'],
  ['a1b2c3', 'a1b2c3', 'A1B2C3', 'a1b2c3', 'a1b2c3'],
  ['1st', '1st', '1ST', '1st', '1st'],
  ['2nd', '2nd', '2ND', '2nd', '2nd'],
  ['3rd', '3rd', '3RD', '3rd', '3rd'],
  ['4th', '4th', '4TH', '4th', '4th'],
  ["don't", 'donT', 'DON T', 'don-t', 'don_t'],
  ['O\u2019Brien', 'oBrien', 'O BRIEN', 'o-brien', 'o_brien'],
  ['can\u2019t stop', 'canTStop', 'CAN T STOP', 'can-t-stop', 'can_t_stop'],
  ['foo:bar', 'fooBar', 'FOO BAR', 'foo-bar', 'foo_bar'],
  ['foo@bar', 'fooBar', 'FOO BAR', 'foo-bar', 'foo_bar'],
  ['foo\tbar', 'fooBar', 'FOO BAR', 'foo-bar', 'foo_bar'],
  ['foo\nbar', 'fooBar', 'FOO BAR', 'foo-bar', 'foo_bar'],
  ['  foo   bar  ', 'fooBar', 'FOO BAR', 'foo-bar', 'foo_bar'],
  [
    'lorem ipsum dolor sit amet',
    'loremIpsumDolorSitAmet',
    'LOREM IPSUM DOLOR SIT AMET',
    'lorem-ipsum-dolor-sit-amet',
    'lorem_ipsum_dolor_sit_amet',
  ],
  ['camelCase', 'camelCase', 'CAMEL CASE', 'camel-case', 'camel_case'],
  ['PascalCase', 'pascalCase', 'PASCAL CASE', 'pascal-case', 'pascal_case'],
  [
    'testThisThat',
    'testThisThat',
    'TEST THIS THAT',
    'test-this-that',
    'test_this_that',
  ],
  ['fooBAR', 'fooBar', 'FOO BAR', 'foo-bar', 'foo_bar'],
  ['FOO-bar', 'fooBar', 'FOO BAR', 'foo-bar', 'foo_bar'],
  ['a-b-c', 'aBC', 'A B C', 'a-b-c', 'a_b_c'],
  ['a_b_c', 'aBC', 'A B C', 'a-b-c', 'a_b_c'],
  ['caf\u00e9', 'caf', 'CAF', 'caf', 'caf'],
];

describe('utils:', () => {
  it.each(cases)('camelCase(%s)', (_input, camel) => {
    expect(camelCase(_input)).toBe(camel);
  });

  it.each(cases)('upperCase(%s)', (_input, _camel, upper) => {
    expect(upperCase(_input)).toBe(upper);
  });

  it.each(cases)('kebabCase(%s)', (_input, _camel, _upper, kebab) => {
    expect(kebabCase(_input)).toBe(kebab);
  });

  it.each(cases)('snakeCase(%s)', (_input, _camel, _upper, _kebab, snake) => {
    expect(snakeCase(_input)).toBe(snake);
  });

  it('groupBy with function iteratee', () => {
    const items = [
      { group: 'a', value: 1 },
      { group: 'b', value: 2 },
      { group: 'a', value: 3 },
    ];

    expect(groupBy(items, (el) => el.group)).toEqual({
      a: [items[0], items[2]],
      b: [items[1]],
    });
  });

  it('groupBy with property name iteratee', () => {
    const items = [
      { group: 'a', value: 1 },
      { group: 'b', value: 2 },
      { group: 'a', value: 3 },
    ];

    expect(groupBy(items, 'group')).toEqual({
      a: [items[0], items[2]],
      b: [items[1]],
    });
  });
});
