const stringifyBase = require('json-stable-stringify')
export const stringify = (obj: unknown): string => stringifyBase(obj, { space: 2 }) + '\n'
