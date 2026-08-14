const reSeparator = /[^a-zA-Z0-9]+/g;
const reLowerUpperBoundary = /([a-z0-9])([A-Z])/g;

function words(input: string): string[] {
  return input
    .replace(reLowerUpperBoundary, '$1 $2')
    .split(reSeparator)
    .filter(Boolean);
}

function upperFirst(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1);
}

export function camelCase(input: string): string {
  return words(input).reduce((result, word, index) => {
    const lowercased = word.toLowerCase();
    return result + (index ? upperFirst(lowercased) : lowercased);
  }, '');
}

export function kebabCase(input: string): string {
  return words(input)
    .map((word) => word.toLowerCase())
    .join('-');
}

export function snakeCase(input: string): string {
  return words(input)
    .map((word) => word.toLowerCase())
    .join('_');
}

export function upperCase(input: string): string {
  return words(input)
    .map((word) => word.toUpperCase())
    .join(' ');
}

export function groupBy<T>(
  collection: T[],
  iteratee: ((value: T) => string | number) | keyof T,
): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  collection.forEach((el) => {
    const key = String(
      typeof iteratee === 'function' ? iteratee(el) : el[iteratee],
    );
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(el);
  });
  return result;
}

function ansi(open: string, close: string) {
  return (input: string): string => `\x1b[${open}m${input}\x1b[${close}m`;
}

export const red = ansi('31', '39');
export const bold = ansi('1', '22');
export const dim = ansi('2', '22');
export const underline = ansi('4', '24');
