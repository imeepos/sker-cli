export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export function isObject(value: unknown): value is object {
  return value !== null && typeof value === 'object';
}

export function isPlainObject(value: unknown): value is Record<string, any> {
  return isObject(value) && 
         Object.prototype.toString.call(value) === '[object Object]' &&
         !Array.isArray(value);
}

export function isArray(value: unknown): value is any[] {
  return Array.isArray(value);
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp;
}

export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function isPromise(value: unknown): value is Promise<any> {
  return isObject(value) && isFunction((value as any).then);
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isArrayOf<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is T[] {
  return isArray(value) && value.every(guard);
}

export function isObjectWith<T extends Record<string, any>>(
  value: unknown,
  shape: { [K in keyof T]: (val: unknown) => val is T[K] }
): value is T {
  if (!isPlainObject(value)) return false;
  
  for (const [key, guard] of Object.entries(shape)) {
    if (!guard((value as any)[key])) return false;
  }
  
  return true;
}

export function isOneOf<T extends readonly unknown[]>(
  value: unknown,
  options: T
): value is T[number] {
  return options.includes(value);
}

export function hasProperty<K extends string>(
  obj: unknown,
  prop: K
): obj is Record<K, unknown> {
  return isObject(obj) && prop in obj;
}

export function hasProperties<K extends string>(
  obj: unknown,
  props: K[]
): obj is Record<K, unknown> {
  if (!isObject(obj)) return false;
  return props.every(prop => prop in obj);
}

export function isInstanceOf<T>(
  value: unknown,
  constructor: new (...args: any[]) => T
): value is T {
  return value instanceof constructor;
}

export function isStringArray(value: unknown): value is string[] {
  return isArrayOf(value, isString);
}

export function isNumberArray(value: unknown): value is number[] {
  return isArrayOf(value, isNumber);
}

export function isBooleanArray(value: unknown): value is boolean[] {
  return isArrayOf(value, isBoolean);
}

export function isEmptyString(value: unknown): value is '' {
  return value === '';
}

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

export function isNonNegativeNumber(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}

export function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

export function isPositiveInteger(value: unknown): value is number {
  return isInteger(value) && value > 0;
}

export function isArrayLike(value: unknown): value is ArrayLike<any> {
  return isObject(value) && 
         hasProperty(value, 'length') && 
         isNumber(value.length) && 
         value.length >= 0;
}

export function isIterable(value: unknown): value is Iterable<any> {
  return isObject(value) && Symbol.iterator in value;
}

export function isAsyncIterable(value: unknown): value is AsyncIterable<any> {
  return isObject(value) && Symbol.asyncIterator in value;
}

export function isMap(value: unknown): value is Map<any, any> {
  return value instanceof Map;
}

export function isSet(value: unknown): value is Set<any> {
  return value instanceof Set;
}

export function isWeakMap(value: unknown): value is WeakMap<any, any> {
  return value instanceof WeakMap;
}

export function isWeakSet(value: unknown): value is WeakSet<any> {
  return value instanceof WeakSet;
}

export function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return value instanceof ArrayBuffer;
}

export function isTypedArray(value: unknown): value is ArrayBufferView {
  return ArrayBuffer.isView(value);
}

export type Primitive = string | number | boolean | null | undefined;

export function isPrimitive(value: unknown): value is Primitive {
  return value === null || 
         value === undefined || 
         typeof value === 'string' || 
         typeof value === 'number' || 
         typeof value === 'boolean';
}

export function isSerializable(value: unknown): boolean {
  if (isPrimitive(value)) return true;
  if (isArray(value)) return value.every(isSerializable);
  if (isPlainObject(value)) {
    return Object.values(value).every(isSerializable);
  }
  if (isDate(value)) return true;
  return false;
}

export function assertIsString(value: unknown): asserts value is string {
  if (!isString(value)) {
    throw new TypeError(`Expected string, got ${typeof value}`);
  }
}

export function assertIsNumber(value: unknown): asserts value is number {
  if (!isNumber(value)) {
    throw new TypeError(`Expected number, got ${typeof value}`);
  }
}

export function assertIsObject(value: unknown): asserts value is object {
  if (!isObject(value)) {
    throw new TypeError(`Expected object, got ${typeof value}`);
  }
}

export function assertIsDefined<T>(value: T | undefined | null): asserts value is T {
  if (!isDefined(value)) {
    throw new TypeError('Value is null or undefined');
  }
}

export function createGuard<T>(
  predicate: (value: unknown) => boolean
): (value: unknown) => value is T {
  return (value: unknown): value is T => predicate(value);
}

export type TypeGuard<T> = (value: unknown) => value is T;

export function combineGuards<T, U>(
  guard1: TypeGuard<T>,
  guard2: TypeGuard<U>
): TypeGuard<T & U> {
  return (value: unknown): value is T & U => {
    return guard1(value) && guard2(value);
  };
}