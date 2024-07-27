export function toCamelCase(str: string): string {
  if (/^[a-z][a-zA-Z0-9]*$/.test(str)) {
    return str;
  }
  return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_match, chr) => chr.toUpperCase());
}

export function toUpperCase(str: string): string {
  return str.toUpperCase();
}

export function toDashCase(str: string): string {
  if (/^[a-z]+(-[a-z]+)*$/.test(str)) {
    return str;
  }
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

export function toSnakeCase(str: string): string {
  if (/^[a-z]+(_[a-z]+)*$/.test(str)) {
    return str;
  }
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/\s+/g, '_')
    .toLowerCase();
}
