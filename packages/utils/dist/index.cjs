"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AggregateError: () => AggregateError,
  AsyncQueue: () => AsyncQueue,
  Batcher: () => Batcher,
  ConfigManager: () => ConfigManager,
  Configuration: () => Configuration,
  CustomError: () => CustomError,
  ErrorCollector: () => ErrorCollector,
  ErrorHandler: () => ErrorHandler,
  LRUCache: () => LRUCache,
  MemoryMonitor: () => MemoryMonitor,
  ObjectPool: () => ObjectPool,
  addTime: () => addTime,
  assertIsDefined: () => assertIsDefined,
  assertIsNumber: () => assertIsNumber,
  assertIsObject: () => assertIsObject,
  assertIsString: () => assertIsString,
  batchProcess: () => batchProcess,
  camelCase: () => camelCase,
  capitalize: () => capitalize,
  chunk: () => chunk,
  combineGuards: () => combineGuards,
  configureUtils: () => configureUtils,
  convertTimezone: () => convertTimezone,
  createConfigManager: () => createConfigManager,
  createError: () => createError,
  createGuard: () => createGuard,
  createMemoryPool: () => createMemoryPool,
  createObjectPool: () => createObjectPool,
  createUtilChain: () => createUtilChain,
  debounce: () => debounce,
  decodeBase64: () => decodeBase64,
  decodeUrl: () => decodeUrl,
  deepClone: () => deepClone,
  deepMerge: () => deepMerge,
  delay: () => delay,
  diffTime: () => diffTime,
  difference: () => difference,
  encodeBase64: () => encodeBase64,
  encodeUrl: () => encodeUrl,
  endOfDay: () => endOfDay,
  endOfMonth: () => endOfMonth,
  endOfWeek: () => endOfWeek,
  escapeHtml: () => escapeHtml,
  flatten: () => flatten,
  forceGC: () => forceGC,
  formatBytes: () => formatBytes,
  formatDate: () => formatDate,
  formatRelativeTime: () => formatRelativeTime,
  gc: () => gc,
  generateNonce: () => generateNonce,
  generateSalt: () => generateSalt,
  generateSecurePassword: () => generateSecurePassword,
  generateUUID: () => generateUUID,
  getBrowserInfo: () => getBrowserInfo,
  getConfig: () => getConfig,
  getConfigValue: () => getConfigValue,
  getDaysInMonth: () => getDaysInMonth,
  getEnvironment: () => getEnvironment,
  getNodeVersion: () => getNodeVersion,
  getPath: () => getPath,
  getPlatform: () => getPlatform,
  getTimezone: () => getTimezone,
  getV8Version: () => getV8Version,
  getWeekOfYear: () => getWeekOfYear,
  groupBy: () => groupBy,
  hasProperties: () => hasProperties,
  hasProperty: () => hasProperty,
  hashString: () => hashString,
  intersection: () => intersection,
  isAndroid: () => isAndroid,
  isArray: () => isArray,
  isArrayBuffer: () => isArrayBuffer,
  isArrayLike: () => isArrayLike,
  isArrayOf: () => isArrayOf,
  isAsyncIterable: () => isAsyncIterable,
  isBoolean: () => isBoolean,
  isBooleanArray: () => isBooleanArray,
  isBrowser: () => isBrowser,
  isDate: () => isDate,
  isDefined: () => isDefined,
  isDeno: () => isDeno,
  isDesktop: () => isDesktop,
  isEmpty: () => isEmpty,
  isEmptyString: () => isEmptyString,
  isEqual: () => isEqual,
  isError: () => isError,
  isErrorType: () => isErrorType,
  isExpired: () => isExpired,
  isFunction: () => isFunction,
  isIOS: () => isIOS,
  isInstanceOf: () => isInstanceOf,
  isInteger: () => isInteger,
  isIterable: () => isIterable,
  isLeapYear: () => isLeapYear,
  isLinux: () => isLinux,
  isMac: () => isMac,
  isMap: () => isMap,
  isMobile: () => isMobile,
  isNil: () => isNil,
  isNode: () => isNode,
  isNonEmptyString: () => isNonEmptyString,
  isNonNegativeNumber: () => isNonNegativeNumber,
  isNull: () => isNull,
  isNumber: () => isNumber,
  isNumberArray: () => isNumberArray,
  isObject: () => isObject2,
  isObjectWith: () => isObjectWith,
  isOneOf: () => isOneOf,
  isPlainObject: () => isPlainObject,
  isPositiveInteger: () => isPositiveInteger,
  isPositiveNumber: () => isPositiveNumber,
  isPrimitive: () => isPrimitive,
  isPromise: () => isPromise,
  isRegExp: () => isRegExp,
  isSerializable: () => isSerializable,
  isSet: () => isSet,
  isString: () => isString,
  isStringArray: () => isStringArray,
  isTablet: () => isTablet,
  isTypedArray: () => isTypedArray,
  isUndefined: () => isUndefined,
  isValidCreditCard: () => isValidCreditCard,
  isValidDate: () => isValidDate,
  isValidEmail: () => isValidEmail,
  isValidIPAddress: () => isValidIPAddress,
  isValidJSON: () => isValidJSON,
  isValidPhoneNumber: () => isValidPhoneNumber,
  isValidUUID: () => isValidUUID,
  isValidUrl: () => isValidUrl,
  isWeakMap: () => isWeakMap,
  isWeakSet: () => isWeakSet,
  isWebWorker: () => isWebWorker,
  isWindows: () => isWindows,
  kebabCase: () => kebabCase,
  maskString: () => maskString,
  memoize: () => memoize,
  memoizeAsync: () => memoizeAsync,
  omit: () => omit,
  parseDate: () => parseDate,
  partition: () => partition,
  pascalCase: () => pascalCase,
  pbkdf2: () => pbkdf2,
  pick: () => pick,
  processInChunks: () => processInChunks,
  promiseAll: () => promiseAll,
  promiseAllSettled: () => promiseAllSettled,
  race: () => race,
  resetConfig: () => resetConfig,
  retry: () => retry,
  safeAsync: () => safeAsync,
  safeSync: () => safeSync,
  sample: () => sample,
  sampleSize: () => sampleSize,
  sanitizeInput: () => sanitizeInput,
  sanitizeSQL: () => sanitizeSQL,
  setPath: () => setPath,
  shuffle: () => shuffle,
  snakeCase: () => snakeCase,
  sortBy: () => sortBy,
  startOfDay: () => startOfDay,
  startOfMonth: () => startOfMonth,
  startOfWeek: () => startOfWeek,
  subtractTime: () => subtractTime,
  supportsLocalStorage: () => supportsLocalStorage,
  supportsServiceWorker: () => supportsServiceWorker,
  supportsSessionStorage: () => supportsSessionStorage,
  supportsWebGL: () => supportsWebGL,
  supportsWebGL2: () => supportsWebGL2,
  supportsWorkers: () => supportsWorkers,
  throttle: () => throttle,
  timeout: () => timeout,
  trackMemoryUsage: () => trackMemoryUsage,
  truncate: () => truncate,
  unescapeHtml: () => unescapeHtml,
  union: () => union,
  uniq: () => uniq,
  uniqBy: () => uniqBy,
  validateSchema: () => validateSchema,
  wrapError: () => wrapError,
  zip: () => zip,
  zipWith: () => zipWith
});
module.exports = __toCommonJS(index_exports);

// src/string.ts
function camelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()).replace(/^[A-Z]/, (letter) => letter.toLowerCase());
}
function snakeCase(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, "");
}
function kebabCase(str) {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/^-/, "").replace(/_/g, "-");
}
function truncate(str, length, suffix = "...") {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}
function maskString(str, start, end, mask = "*") {
  if (str.length <= start + end) return str;
  const startPart = str.slice(0, start);
  const endPart = str.slice(-end);
  const maskLength = str.length - start - end;
  return startPart + mask.repeat(maskLength) + endPart;
}
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function pascalCase(str) {
  return camelCase(str).replace(/^[a-z]/, (letter) => letter.toUpperCase());
}
function escapeHtml(str) {
  const escapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  return str.replace(/[&<>"']/g, (match) => escapeMap[match]);
}
function unescapeHtml(str) {
  const unescapeMap = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'"
  };
  return str.replace(/&(amp|lt|gt|quot|#39);/g, (match) => unescapeMap[match]);
}

// src/object.ts
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  if (obj instanceof RegExp) return new RegExp(obj);
  if (typeof obj === "object") {
    const copy = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copy[key] = deepClone(obj[key]);
      }
    }
    return copy;
  }
  return obj;
}
function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return deepMerge(target, ...sources);
}
function getPath(obj, path, defaultValue) {
  const keys = path.split(".");
  let result = obj;
  for (const key of keys) {
    if (result === null || result === void 0) return defaultValue;
    result = result[key];
  }
  return result !== void 0 ? result : defaultValue;
}
function setPath(obj, path, value) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  let current = obj;
  for (const key of keys) {
    if (current[key] === void 0 || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }
  current[lastKey] = value;
  return obj;
}
function omit(obj, keys) {
  const result = { ...obj };
  for (const key of keys) {
    if (typeof key === "string" && key.includes(".")) {
      deletePath(result, key);
    } else {
      delete result[key];
    }
  }
  return result;
}
function pick(obj, keys) {
  const result = {};
  for (const key of keys) {
    if (typeof key === "string" && key.includes(".")) {
      const value = getPath(obj, key);
      if (value !== void 0) {
        setPath(result, key, value);
      }
    } else if (key in obj) {
      Reflect.set(result, key, obj[key]);
    }
  }
  return result;
}
function isEmpty(value) {
  if (value === null || value === void 0) return true;
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return false;
  if (typeof value === "string") return value.length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (value instanceof Date) return false;
  if (value instanceof RegExp) return false;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}
function isEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (a === void 0 || b === void 0) return a === b;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }
  if (typeof a === "object") {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => isEqual(a[key], b[key]));
  }
  return false;
}
function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}
function deletePath(obj, path) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  let current = obj;
  for (const key of keys) {
    if (current[key] === void 0 || current[key] === null) return;
    current = current[key];
  }
  delete current[lastKey];
}

// src/array.ts
function chunk(array, size) {
  if (size <= 0) return [];
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
function flatten(array) {
  const result = [];
  for (const item of array) {
    if (Array.isArray(item)) {
      result.push(...flatten(item));
    } else {
      result.push(item);
    }
  }
  return result;
}
function uniq(array) {
  return Array.from(new Set(array));
}
function uniqBy(array, keyFn) {
  const seen = /* @__PURE__ */ new Set();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const groupKey = typeof key === "function" ? key(item) : item[key];
    const groupName = String(groupKey);
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(item);
    return groups;
  }, {});
}
function sortBy(array, key) {
  return [...array].sort((a, b) => {
    const aVal = typeof key === "function" ? key(a) : a[key];
    const bVal = typeof key === "function" ? key(b) : b[key];
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });
}
function partition(array, predicate) {
  const truthy = [];
  const falsy = [];
  for (const item of array) {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  }
  return [truthy, falsy];
}
function sample(array) {
  if (array.length === 0) return void 0;
  return array[Math.floor(Math.random() * array.length)];
}
function sampleSize(array, size) {
  if (size >= array.length) return shuffle([...array]);
  const shuffled = shuffle([...array]);
  return shuffled.slice(0, size);
}
function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function zip(array1, array2) {
  const length = Math.min(array1.length, array2.length);
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push([array1[i], array2[i]]);
  }
  return result;
}
function zipWith(array1, array2, fn) {
  const length = Math.min(array1.length, array2.length);
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(fn(array1[i], array2[i]));
  }
  return result;
}
function intersection(...arrays) {
  if (arrays.length === 0) return [];
  if (arrays.length === 1) return [...arrays[0]];
  return arrays.reduce(
    (acc, array) => acc.filter((item) => array.includes(item))
  );
}
function difference(array, ...others) {
  const otherItems = new Set(others.flat());
  return array.filter((item) => !otherItems.has(item));
}
function union(...arrays) {
  return uniq(arrays.flat());
}

// src/async.ts
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function timeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
    promise.then(resolve).catch(reject).finally(() => clearTimeout(timer));
  });
}
async function retry(fn, options) {
  const { maxAttempts, delay: baseDelay = 1e3, backoff = "fixed", shouldRetry } = options;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
      if (shouldRetry && !shouldRetry(error, attempt)) break;
      const delayMs = calculateDelay(baseDelay, attempt, backoff);
      await delay(delayMs);
    }
  }
  throw lastError;
}
function debounce(fn, ms) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}
function throttle(fn, ms) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    }
  };
}
async function promiseAll(promises, options = {}) {
  const { concurrency = Infinity } = options;
  if (concurrency >= promises.length) {
    return Promise.all(promises.map((fn) => fn()));
  }
  const results = [];
  const executing = [];
  for (let i = 0; i < promises.length; i++) {
    const promise = promises[i]().then((result) => {
      results[i] = result;
    });
    executing.push(promise);
    if (executing.length >= concurrency) {
      await Promise.race(executing);
      const finishedIndex = executing.findIndex(
        (p) => Promise.resolve(p).then(() => true, () => true)
      );
      if (finishedIndex !== -1) {
        executing.splice(finishedIndex, 1);
      }
    }
  }
  await Promise.all(executing);
  return results;
}
async function promiseAllSettled(promises) {
  return Promise.all(
    promises.map(async (promise) => {
      try {
        const value = await promise;
        return { status: "fulfilled", value };
      } catch (reason) {
        return { status: "rejected", reason };
      }
    })
  );
}
function race(promises) {
  return Promise.race(promises);
}
function safeAsync(fn) {
  return fn().then((result) => [null, result]).catch((error) => [error, null]);
}
var AsyncQueue = class {
  queue = [];
  running = 0;
  concurrency;
  constructor(concurrency = 1) {
    this.concurrency = concurrency;
  }
  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });
      this.process();
    });
  }
  async process() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }
    this.running++;
    const fn = this.queue.shift();
    try {
      await fn();
    } finally {
      this.running--;
      this.process();
    }
  }
};
function calculateDelay(baseDelay, attempt, backoff) {
  switch (backoff) {
    case "linear":
      return baseDelay * attempt;
    case "exponential":
      return baseDelay * Math.pow(2, attempt - 1);
    default:
      return baseDelay;
  }
}

// src/validation.ts
function isValidEmail2(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function isValidUrl2(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}
function isValidDate(date) {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}
function isValidPhoneNumber(phone) {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
  return phoneRegex.test(cleanPhone);
}
function validateSchema(data, schema) {
  const errors = [];
  for (const [key, field] of Object.entries(schema)) {
    const value = data[key];
    if (field.required && (value === void 0 || value === null)) {
      errors.push(`Field '${key}' is required`);
      continue;
    }
    if (value === void 0 || value === null) continue;
    if (!validateFieldType(value, field.type)) {
      errors.push(`Field '${key}' must be of type ${field.type}`);
      continue;
    }
    if (field.min !== void 0) {
      if ((typeof value === "string" || Array.isArray(value)) && value.length < field.min) {
        errors.push(`Field '${key}' must have at least ${field.min} characters/items`);
      } else if (typeof value === "number" && value < field.min) {
        errors.push(`Field '${key}' must be at least ${field.min}`);
      }
    }
    if (field.max !== void 0) {
      if ((typeof value === "string" || Array.isArray(value)) && value.length > field.max) {
        errors.push(`Field '${key}' must have at most ${field.max} characters/items`);
      } else if (typeof value === "number" && value > field.max) {
        errors.push(`Field '${key}' must be at most ${field.max}`);
      }
    }
    if (field.format) {
      const formatError = validateFormat(value, field.format, key);
      if (formatError) errors.push(formatError);
    }
    if (field.pattern && typeof value === "string" && !field.pattern.test(value)) {
      errors.push(`Field '${key}' does not match required pattern`);
    }
    if (field.enum && !field.enum.includes(value)) {
      errors.push(`Field '${key}' must be one of: ${field.enum.join(", ")}`);
    }
    if (field.type === "array" && Array.isArray(value) && field.items) {
      for (let i = 0; i < value.length; i++) {
        if (!validateFieldType(value[i], field.items.type)) {
          errors.push(`Field '${key}[${i}]' must be of type ${field.items.type}`);
        }
      }
    }
    if (field.type === "object" && field.properties) {
      const nestedResult = validateSchema(value, field.properties);
      errors.push(...nestedResult.errors.map((err) => `${key}.${err}`));
    }
  }
  return {
    valid: errors.length === 0,
    errors
  };
}
function sanitizeInput(input) {
  const htmlEntities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;"
  };
  return input.replace(/[&<>"'/]/g, (match) => htmlEntities[match]);
}
function sanitizeSQL(input) {
  return input.replace(/['";\\]/g, "\\$&");
}
function isValidCreditCard(cardNumber) {
  const cleanNumber = cardNumber.replace(/\D/g, "");
  if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}
function isValidIPAddress(ip) {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}
function validateFieldType(value, type) {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && !isNaN(value);
    case "boolean":
      return typeof value === "boolean";
    case "array":
      return Array.isArray(value);
    case "object":
      return typeof value === "object" && value !== null && !Array.isArray(value);
    default:
      return false;
  }
}
function validateFormat(value, format, fieldName) {
  if (typeof value !== "string") return null;
  switch (format) {
    case "email":
      return !isValidEmail2(value) ? `Field '${fieldName}' must be a valid email` : null;
    case "url":
      return !isValidUrl2(value) ? `Field '${fieldName}' must be a valid URL` : null;
    case "uuid":
      return !isValidUUID(value) ? `Field '${fieldName}' must be a valid UUID` : null;
    case "date":
      return !isValidDate(value) ? `Field '${fieldName}' must be a valid date` : null;
    case "phone":
      return !isValidPhoneNumber(value) ? `Field '${fieldName}' must be a valid phone number` : null;
    default:
      return null;
  }
}

// src/crypto.ts
function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
function generateNonce(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return result;
}
async function hashString(str, algorithm = "sha256") {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest(algorithm.toUpperCase(), data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return simpleHash(str);
}
function encodeBase64(str) {
  if (typeof btoa !== "undefined") {
    return btoa(unescape(encodeURIComponent(str)));
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf8").toString("base64");
  }
  return manualBase64Encode(str);
}
function decodeBase64(encoded) {
  if (typeof atob !== "undefined") {
    return decodeURIComponent(escape(atob(encoded)));
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(encoded, "base64").toString("utf8");
  }
  return manualBase64Decode(encoded);
}
function encodeUrl(str) {
  return encodeURIComponent(str);
}
function decodeUrl(encoded) {
  return decodeURIComponent(encoded);
}
function generateSecurePassword(length = 12, options = {}) {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true
  } = options;
  let charset = "";
  if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
  if (includeNumbers) charset += "0123456789";
  if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";
  if (!charset) throw new Error("At least one character type must be included");
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}
function generateSalt(length = 16) {
  return generateNonce(length);
}
async function pbkdf2(password, salt, iterations = 1e4) {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const derived = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: encoder.encode(salt),
        iterations,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );
    const hashArray = Array.from(new Uint8Array(derived));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return simpleHash(password + salt);
}
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
function manualBase64Encode(str) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let i = 0;
  while (i < str.length) {
    const a = str.charCodeAt(i++);
    const b = i < str.length ? str.charCodeAt(i++) : 0;
    const c = i < str.length ? str.charCodeAt(i++) : 0;
    const bitmap = a << 16 | b << 8 | c;
    result += chars.charAt(bitmap >> 18 & 63);
    result += chars.charAt(bitmap >> 12 & 63);
    result += i - 2 < str.length ? chars.charAt(bitmap >> 6 & 63) : "=";
    result += i - 1 < str.length ? chars.charAt(bitmap & 63) : "=";
  }
  return result;
}
function manualBase64Decode(encoded) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let i = 0;
  while (i < encoded.length) {
    const a = chars.indexOf(encoded.charAt(i++));
    const b = chars.indexOf(encoded.charAt(i++));
    const c = chars.indexOf(encoded.charAt(i++));
    const d = chars.indexOf(encoded.charAt(i++));
    const bitmap = a << 18 | b << 12 | c << 6 | d;
    result += String.fromCharCode(bitmap >> 16 & 255);
    if (c !== 64) result += String.fromCharCode(bitmap >> 8 & 255);
    if (d !== 64) result += String.fromCharCode(bitmap & 255);
  }
  return result;
}

// src/time.ts
function formatDate(date, format) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const milliseconds = date.getMilliseconds();
  return format.replace(/yyyy/g, year.toString()).replace(/yy/g, year.toString().slice(-2)).replace(/MM/g, month.toString().padStart(2, "0")).replace(/M/g, month.toString()).replace(/dd/g, day.toString().padStart(2, "0")).replace(/d/g, day.toString()).replace(/HH/g, hours.toString().padStart(2, "0")).replace(/H/g, hours.toString()).replace(/mm/g, minutes.toString().padStart(2, "0")).replace(/m/g, minutes.toString()).replace(/ss/g, seconds.toString().padStart(2, "0")).replace(/s/g, seconds.toString()).replace(/SSS/g, milliseconds.toString().padStart(3, "0"));
}
function parseDate(dateString, format) {
  if (!format) {
    return new Date(dateString);
  }
  const formatTokens = format.match(/yyyy|yy|MM?|dd?|HH?|mm?|ss?|SSS/g) || [];
  const dateTokens = dateString.match(/\d+/g) || [];
  if (formatTokens.length !== dateTokens.length) {
    throw new Error("Date string does not match format");
  }
  let year = (/* @__PURE__ */ new Date()).getFullYear();
  let month = 0;
  let day = 1;
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let milliseconds = 0;
  formatTokens.forEach((token, index) => {
    const value = parseInt(dateTokens[index]);
    switch (token) {
      case "yyyy":
        year = value;
        break;
      case "yy":
        year = 2e3 + value;
        break;
      case "MM":
      case "M":
        month = value - 1;
        break;
      case "dd":
      case "d":
        day = value;
        break;
      case "HH":
      case "H":
        hours = value;
        break;
      case "mm":
      case "m":
        minutes = value;
        break;
      case "ss":
      case "s":
        seconds = value;
        break;
      case "SSS":
        milliseconds = value;
        break;
    }
  });
  return new Date(year, month, day, hours, minutes, seconds, milliseconds);
}
function addTime(date, time) {
  const result = new Date(date);
  if (time.milliseconds) result.setMilliseconds(result.getMilliseconds() + time.milliseconds);
  if (time.seconds) result.setSeconds(result.getSeconds() + time.seconds);
  if (time.minutes) result.setMinutes(result.getMinutes() + time.minutes);
  if (time.hours) result.setHours(result.getHours() + time.hours);
  if (time.days) result.setDate(result.getDate() + time.days);
  if (time.months) result.setMonth(result.getMonth() + time.months);
  if (time.years) result.setFullYear(result.getFullYear() + time.years);
  return result;
}
function subtractTime(date, time) {
  const negativeTime = {};
  for (const [key, value] of Object.entries(time)) {
    if (typeof value === "number") {
      negativeTime[key] = -value;
    }
  }
  return addTime(date, negativeTime);
}
function diffTime(date1, date2) {
  const totalMilliseconds = Math.abs(date1.getTime() - date2.getTime());
  let remaining = totalMilliseconds;
  const years = Math.floor(remaining / (365.25 * 24 * 60 * 60 * 1e3));
  remaining -= years * (365.25 * 24 * 60 * 60 * 1e3);
  const months = Math.floor(remaining / (30.44 * 24 * 60 * 60 * 1e3));
  remaining -= months * (30.44 * 24 * 60 * 60 * 1e3);
  const days = Math.floor(remaining / (24 * 60 * 60 * 1e3));
  remaining -= days * (24 * 60 * 60 * 1e3);
  const hours = Math.floor(remaining / (60 * 60 * 1e3));
  remaining -= hours * (60 * 60 * 1e3);
  const minutes = Math.floor(remaining / (60 * 1e3));
  remaining -= minutes * (60 * 1e3);
  const seconds = Math.floor(remaining / 1e3);
  const milliseconds = remaining % 1e3;
  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
    totalMilliseconds
  };
}
function isExpired(timestamp, maxAge) {
  const time = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  return Date.now() - time > maxAge;
}
function getTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
function convertTimezone(date, fromTimezone, toTimezone) {
  const fromOffset = getTimezoneOffset(date, fromTimezone);
  const toOffset = getTimezoneOffset(date, toTimezone);
  const diffOffset = toOffset - fromOffset;
  return new Date(date.getTime() + diffOffset);
}
function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}
function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}
function startOfWeek(date, weekStartsOn = 0) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  result.setDate(result.getDate() - diff);
  return startOfDay(result);
}
function endOfWeek(date, weekStartsOn = 0) {
  const result = startOfWeek(date, weekStartsOn);
  result.setDate(result.getDate() + 6);
  return endOfDay(result);
}
function startOfMonth(date) {
  const result = new Date(date);
  result.setDate(1);
  return startOfDay(result);
}
function endOfMonth(date) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  return endOfDay(result);
}
function isLeapYear(year) {
  return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
}
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getWeekOfYear(date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffInMs = date.getTime() - startOfYear.getTime();
  const diffInDays = Math.floor(diffInMs / (24 * 60 * 60 * 1e3));
  return Math.ceil((diffInDays + startOfYear.getDay() + 1) / 7);
}
function formatRelativeTime(date, baseDate = /* @__PURE__ */ new Date()) {
  const diff = diffTime(date, baseDate);
  const isPast = date < baseDate;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (diff.years > 0) {
    return rtf.format(isPast ? -diff.years : diff.years, "year");
  } else if (diff.months > 0) {
    return rtf.format(isPast ? -diff.months : diff.months, "month");
  } else if (diff.days > 0) {
    return rtf.format(isPast ? -diff.days : diff.days, "day");
  } else if (diff.hours > 0) {
    return rtf.format(isPast ? -diff.hours : diff.hours, "hour");
  } else if (diff.minutes > 0) {
    return rtf.format(isPast ? -diff.minutes : diff.minutes, "minute");
  } else {
    return rtf.format(isPast ? -diff.seconds : diff.seconds, "second");
  }
}
function getTimezoneOffset(date, timezone) {
  const utc = date.getTime() + date.getTimezoneOffset() * 6e4;
  const targetTime = new Date(utc + getTimezoneOffsetMinutes(timezone) * 6e4);
  return targetTime.getTime() - date.getTime();
}
function getTimezoneOffsetMinutes(timezone) {
  const now = /* @__PURE__ */ new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 6e4;
  const targetTime = new Date(utcTime);
  try {
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
    const parts = formatter.formatToParts(targetTime);
    const localTime = new Date(
      parseInt(parts.find((p) => p.type === "year")?.value || "0"),
      parseInt(parts.find((p) => p.type === "month")?.value || "1") - 1,
      parseInt(parts.find((p) => p.type === "day")?.value || "1"),
      parseInt(parts.find((p) => p.type === "hour")?.value || "0"),
      parseInt(parts.find((p) => p.type === "minute")?.value || "0"),
      parseInt(parts.find((p) => p.type === "second")?.value || "0")
    );
    return (localTime.getTime() - utcTime) / 6e4;
  } catch {
    return 0;
  }
}

// src/environment.ts
function isBrowser() {
  return typeof window !== "undefined" && typeof window.document !== "undefined";
}
function isNode() {
  return typeof process !== "undefined" && process.versions != null && process.versions.node != null;
}
function isDeno() {
  return typeof Deno !== "undefined";
}
function isWebWorker() {
  return typeof self !== "undefined" && typeof importScripts === "function" && typeof navigator !== "undefined";
}
function isWindows() {
  if (isBrowser()) {
    return navigator.platform.indexOf("Win") > -1;
  }
  if (isNode()) {
    return process.platform === "win32";
  }
  return false;
}
function isMac() {
  if (isBrowser()) {
    return navigator.platform.indexOf("Mac") > -1;
  }
  if (isNode()) {
    return process.platform === "darwin";
  }
  return false;
}
function isLinux() {
  if (isBrowser()) {
    return navigator.platform.indexOf("Linux") > -1;
  }
  if (isNode()) {
    return process.platform === "linux";
  }
  return false;
}
function isIOS() {
  if (!isBrowser()) return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}
function isAndroid() {
  if (!isBrowser()) return false;
  return /Android/.test(navigator.userAgent);
}
function isMobile() {
  if (!isBrowser()) return false;
  return /Mobi|Android/i.test(navigator.userAgent);
}
function isTablet() {
  if (!isBrowser()) return false;
  return /Tablet|iPad/i.test(navigator.userAgent);
}
function isDesktop() {
  return !isMobile() && !isTablet();
}
function getEnvironment() {
  if (isBrowser()) {
    return {
      runtime: "browser",
      platform: navigator.platform,
      userAgent: navigator.userAgent
    };
  }
  if (isNode()) {
    return {
      runtime: "node",
      version: process.versions.node,
      platform: process.platform,
      arch: process.arch
    };
  }
  if (isDeno()) {
    return {
      runtime: "deno",
      version: Deno.version.deno,
      platform: Deno.build.os,
      arch: Deno.build.arch
    };
  }
  if (isWebWorker()) {
    return {
      runtime: "webworker",
      platform: navigator.platform,
      userAgent: navigator.userAgent
    };
  }
  return {
    runtime: "unknown",
    platform: "unknown"
  };
}
function getPlatform() {
  let os = "unknown";
  let arch = "unknown";
  if (isWindows()) os = "windows";
  else if (isMac()) os = "macos";
  else if (isLinux()) os = "linux";
  else if (isIOS()) os = "ios";
  else if (isAndroid()) os = "android";
  if (isNode()) {
    switch (process.arch) {
      case "x64":
        arch = "x64";
        break;
      case "ia32":
        arch = "x32";
        break;
      case "arm64":
        arch = "arm64";
        break;
      case "arm":
        arch = "arm";
        break;
    }
  } else if (isBrowser()) {
    if (navigator.userAgent.includes("x86_64") || navigator.userAgent.includes("x64")) {
      arch = "x64";
    } else if (navigator.userAgent.includes("arm64") || navigator.userAgent.includes("aarch64")) {
      arch = "arm64";
    } else if (navigator.userAgent.includes("arm")) {
      arch = "arm";
    }
  }
  return {
    os,
    arch,
    endianness: getEndianness(),
    isMobile: isMobile(),
    isTablet: isTablet(),
    isDesktop: isDesktop()
  };
}
function getBrowserInfo() {
  if (!isBrowser()) return null;
  const ua = navigator.userAgent;
  let name = "Unknown";
  let version = "Unknown";
  let engine = "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edge")) {
    name = "Chrome";
    const match = ua.match(/Chrome\/([0-9.]+)/);
    version = match ? match[1] : "Unknown";
    engine = "Blink";
  } else if (ua.includes("Firefox")) {
    name = "Firefox";
    const match = ua.match(/Firefox\/([0-9.]+)/);
    version = match ? match[1] : "Unknown";
    engine = "Gecko";
  } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
    name = "Safari";
    const match = ua.match(/Version\/([0-9.]+)/);
    version = match ? match[1] : "Unknown";
    engine = "WebKit";
  } else if (ua.includes("Edge")) {
    name = "Edge";
    const match = ua.match(/Edge\/([0-9.]+)/);
    version = match ? match[1] : "Unknown";
    engine = "EdgeHTML";
  }
  return { name, version, engine };
}
function getNodeVersion() {
  return isNode() ? process.versions.node : null;
}
function getV8Version() {
  return isNode() ? process.versions.v8 : null;
}
function supportsWebGL() {
  if (!isBrowser()) return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}
function supportsWebGL2() {
  if (!isBrowser()) return false;
  try {
    const canvas = document.createElement("canvas");
    return !!canvas.getContext("webgl2");
  } catch {
    return false;
  }
}
function supportsWorkers() {
  return typeof Worker !== "undefined";
}
function supportsServiceWorker() {
  return isBrowser() && "serviceWorker" in navigator;
}
function supportsLocalStorage() {
  if (!isBrowser()) return false;
  try {
    localStorage.setItem("test", "test");
    localStorage.removeItem("test");
    return true;
  } catch {
    return false;
  }
}
function supportsSessionStorage() {
  if (!isBrowser()) return false;
  try {
    sessionStorage.setItem("test", "test");
    sessionStorage.removeItem("test");
    return true;
  } catch {
    return false;
  }
}
function getEndianness() {
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(0, 256, true);
  return new Int16Array(buffer)[0] === 256 ? "LE" : "BE";
}

// src/cache.ts
var LRUCache = class {
  cache = /* @__PURE__ */ new Map();
  accessOrder = /* @__PURE__ */ new Map();
  accessCounter = 0;
  maxSize;
  ttl;
  onEvict;
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl;
    this.onEvict = options.onEvict;
  }
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return void 0;
    if (this.isExpired(entry)) {
      this.delete(key);
      return void 0;
    }
    entry.lastAccessed = Date.now();
    this.accessOrder.set(key, ++this.accessCounter);
    return entry.value;
  }
  set(key, value) {
    const now = Date.now();
    const expiresAt = this.ttl ? now + this.ttl : void 0;
    if (this.cache.has(key)) {
      const entry = this.cache.get(key);
      entry.value = value;
      entry.expiresAt = expiresAt;
      entry.lastAccessed = now;
      this.accessOrder.set(key, ++this.accessCounter);
      return;
    }
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }
    this.cache.set(key, {
      value,
      expiresAt,
      lastAccessed: now
    });
    this.accessOrder.set(key, ++this.accessCounter);
  }
  delete(key) {
    const entry = this.cache.get(key);
    if (entry && this.onEvict) {
      this.onEvict(key, entry.value);
    }
    this.accessOrder.delete(key);
    return this.cache.delete(key);
  }
  clear() {
    if (this.onEvict) {
      for (const [key, entry] of this.cache) {
        this.onEvict(key, entry.value);
      }
    }
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    return true;
  }
  size() {
    return this.cache.size;
  }
  keys() {
    return Array.from(this.cache.keys());
  }
  values() {
    return Array.from(this.cache.values()).map((entry) => entry.value);
  }
  entries() {
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value]);
  }
  isExpired(entry) {
    return entry.expiresAt !== void 0 && Date.now() > entry.expiresAt;
  }
  evictLeastRecentlyUsed() {
    let lruKey;
    let lruAccess = Infinity;
    for (const [key, accessCount] of this.accessOrder) {
      if (accessCount < lruAccess) {
        lruAccess = accessCount;
        lruKey = key;
      }
    }
    if (lruKey !== void 0) {
      this.delete(lruKey);
    }
  }
};
function memoize(fn, options = {}) {
  const cache = new LRUCache(options);
  return ((...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  });
}
function memoizeAsync(fn, options = {}) {
  const cache = new LRUCache(options);
  const pendingCache = /* @__PURE__ */ new Map();
  const ret = ((...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return Promise.resolve(cache.get(key));
    }
    if (pendingCache.has(key)) {
      return pendingCache.get(key);
    }
    const promise = fn(...args).then(
      (result) => {
        cache.set(key, Promise.resolve(result));
        pendingCache.delete(key);
        return result;
      },
      (error) => {
        pendingCache.delete(key);
        throw error;
      }
    );
    pendingCache.set(key, promise);
    return promise;
  });
  return ret;
}

// src/error.ts
var CustomError = class extends Error {
  code;
  context;
  timestamp;
  cause;
  constructor(code, message, context = {}, cause) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.timestamp = /* @__PURE__ */ new Date();
    this.cause = cause;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      cause: this.cause?.message
    };
  }
};
function createError(code, message, context = {}) {
  return new CustomError(code, message, context);
}
function wrapError(error, code, message, context = {}) {
  return new CustomError(code, message, context, error);
}
function isErrorType(error, type) {
  return error instanceof Error && (error.name === type || error.code === type);
}
var ErrorHandler = class {
  options;
  constructor(options = {}) {
    this.options = {
      onError: options.onError || (() => {
      }),
      retries: options.retries || 0,
      backoff: options.backoff || "fixed",
      delay: options.delay || 1e3,
      shouldRetry: options.shouldRetry || (() => true)
    };
  }
  wrap(fn) {
    return ((...args) => {
      return this.execute(() => fn(...args));
    });
  }
  async execute(fn) {
    let lastError;
    for (let attempt = 0; attempt <= this.options.retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        this.options.onError(lastError);
        if (attempt === this.options.retries) break;
        if (!this.options.shouldRetry(lastError, attempt + 1)) break;
        await this.delay(attempt + 1);
      }
    }
    throw lastError;
  }
  async delay(attempt) {
    let ms = this.options.delay;
    switch (this.options.backoff) {
      case "linear":
        ms *= attempt;
        break;
      case "exponential":
        ms *= Math.pow(2, attempt - 1);
        break;
    }
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};
function safeSync(fn) {
  try {
    const result = fn();
    return [null, result];
  } catch (error) {
    return [error, null];
  }
}
var ErrorCollector = class {
  errors = [];
  add(error) {
    this.errors.push(error);
  }
  addAll(errors) {
    this.errors.push(...errors);
  }
  hasErrors() {
    return this.errors.length > 0;
  }
  getErrors() {
    return [...this.errors];
  }
  getFirst() {
    return this.errors[0];
  }
  getLast() {
    return this.errors[this.errors.length - 1];
  }
  clear() {
    this.errors = [];
  }
  throwIfAny() {
    if (this.hasErrors()) {
      if (this.errors.length === 1) {
        throw this.errors[0];
      } else {
        throw new AggregateError(this.errors, `${this.errors.length} errors occurred`);
      }
    }
  }
  count() {
    return this.errors.length;
  }
};
var AggregateError = class extends Error {
  errors;
  constructor(errors, message) {
    super(message || `${errors.length} errors occurred`);
    this.name = "AggregateError";
    this.errors = errors;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errors: this.errors.map((err) => err.message),
      stack: this.stack
    };
  }
};

// src/batch.ts
async function batchProcess(items, processor, options = {}) {
  const {
    batchSize = 10,
    concurrency = 1,
    delay: delay2 = 0,
    onProgress,
    onError
  } = options;
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  const results = [];
  let processed = 0;
  const processBatch = async (batch, batchIndex) => {
    try {
      if (delay2 > 0 && batchIndex > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay2));
      }
      const batchResults = await processor(batch);
      processed += batch.length;
      if (onProgress) {
        onProgress(processed, items.length);
      }
      return batchResults;
    } catch (error) {
      if (onError) {
        batch.forEach((item, index) => {
          onError(error, item, batchIndex * batchSize + index);
        });
      }
      throw error;
    }
  };
  if (concurrency === 1) {
    for (let i = 0; i < batches.length; i++) {
      const batchResults = await processBatch(batches[i], i);
      results.push(...batchResults);
    }
  } else {
    const batchPromises = [];
    const semaphore = new Semaphore(concurrency);
    for (let i = 0; i < batches.length; i++) {
      const batchPromise = semaphore.acquire().then(async (release) => {
        try {
          return await processBatch(batches[i], i);
        } finally {
          release();
        }
      });
      batchPromises.push(batchPromise);
    }
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.flat());
  }
  return results;
}
var Batcher = class {
  queue = [];
  timer = null;
  processing = false;
  options;
  constructor(options) {
    this.options = {
      concurrency: 1,
      ...options
    };
  }
  add(item) {
    return new Promise((resolve, reject) => {
      this.queue.push(item);
      if (this.queue.length >= this.options.maxBatchSize) {
        this.flush().then(resolve).catch(reject);
      } else {
        if (!this.timer) {
          this.timer = setTimeout(() => {
            this.flush().then(resolve).catch(reject);
          }, this.options.maxWaitTime);
        }
      }
    });
  }
  async flush() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const itemsToProcess = this.queue.splice(0);
    try {
      await this.options.processor(itemsToProcess);
    } finally {
      this.processing = false;
    }
  }
  async close() {
    await this.flush();
  }
  size() {
    return this.queue.length;
  }
};
var Semaphore = class {
  permits;
  waitQueue = [];
  constructor(permits) {
    this.permits = permits;
  }
  async acquire() {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve(() => this.release());
      } else {
        this.waitQueue.push(() => {
          this.permits--;
          resolve(() => this.release());
        });
      }
    });
  }
  release() {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      next();
    }
  }
};
async function processInChunks(items, options) {
  const {
    chunkSize,
    processor,
    onChunkComplete,
    onError,
    concurrency = 1
  } = options;
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  const processChunk = async (chunk2, index) => {
    try {
      const result = await processor(chunk2);
      if (onChunkComplete) {
        onChunkComplete(result, index);
      }
      return result;
    } catch (error) {
      if (onError) {
        onError(error, index);
      }
      throw error;
    }
  };
  if (concurrency === 1) {
    const results = [];
    for (let i = 0; i < chunks.length; i++) {
      const result = await processChunk(chunks[i], i);
      results.push(result);
    }
    return results;
  } else {
    const semaphore = new Semaphore(concurrency);
    const promises = chunks.map(async (chunk2, index) => {
      const release = await semaphore.acquire();
      try {
        return await processChunk(chunk2, index);
      } finally {
        release();
      }
    });
    return Promise.all(promises);
  }
}

// src/memory.ts
var ObjectPool = class {
  pool = [];
  maxSize;
  createFn;
  resetFn;
  validateFn;
  constructor(options) {
    this.maxSize = options.maxSize || 10;
    this.createFn = options.createFn;
    this.resetFn = options.resetFn;
    this.validateFn = options.validateFn;
  }
  acquire() {
    let obj = this.pool.pop();
    if (!obj) {
      obj = this.createFn();
    } else if (this.validateFn && !this.validateFn(obj)) {
      obj = this.createFn();
    }
    return obj;
  }
  release(obj) {
    if (this.pool.length >= this.maxSize) return;
    if (this.resetFn) {
      this.resetFn(obj);
    }
    if (!this.validateFn || this.validateFn(obj)) {
      this.pool.push(obj);
    }
  }
  size() {
    return this.pool.length;
  }
  clear() {
    this.pool = [];
  }
};
function createObjectPool(createFn, resetFn, options = {}) {
  return new ObjectPool({
    ...options,
    createFn,
    resetFn
  });
}
function createMemoryPool(bufferSize, poolSize = 10) {
  return createObjectPool(
    () => new ArrayBuffer(bufferSize),
    void 0,
    { maxSize: poolSize }
  );
}
function trackMemoryUsage() {
  const getMemoryUsage = () => {
    if (typeof process !== "undefined" && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        arrayBuffers: usage.arrayBuffers || 0
      };
    }
    if (typeof performance !== "undefined" && "memory" in performance) {
      const memory = performance.memory;
      return {
        heapUsed: memory.usedJSHeapSize,
        heapTotal: memory.totalJSHeapSize,
        external: memory.totalJSHeapSize - memory.usedJSHeapSize,
        arrayBuffers: 0
      };
    }
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0
    };
  };
  return {
    getUsage: getMemoryUsage,
    track(fn) {
      const beforeMemory = getMemoryUsage();
      const result = fn();
      const afterMemory = getMemoryUsage();
      const memoryDelta = afterMemory.heapUsed - beforeMemory.heapUsed;
      return { result, memoryDelta };
    },
    async trackAsync(fn) {
      const beforeMemory = getMemoryUsage();
      const result = await fn();
      const afterMemory = getMemoryUsage();
      const memoryDelta = afterMemory.heapUsed - beforeMemory.heapUsed;
      return { result, memoryDelta };
    }
  };
}
var MemoryMonitor = class {
  interval = null;
  samples = [];
  maxSamples;
  onThreshold;
  threshold;
  constructor(maxSamples = 100, options = {}) {
    this.maxSamples = maxSamples;
    this.threshold = options.threshold;
    this.onThreshold = options.onThreshold;
  }
  start(intervalMs = 1e3) {
    if (this.interval) return;
    const tracker = trackMemoryUsage();
    this.interval = setInterval(() => {
      const usage = tracker.getUsage();
      this.samples.push(usage);
      if (this.samples.length > this.maxSamples) {
        this.samples.shift();
      }
      if (this.threshold && usage.heapUsed > this.threshold && this.onThreshold) {
        this.onThreshold(usage);
      }
    }, intervalMs);
  }
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  getSamples() {
    return [...this.samples];
  }
  getLatest() {
    return this.samples[this.samples.length - 1];
  }
  getAverage() {
    if (this.samples.length === 0) return void 0;
    const totals = this.samples.reduce(
      (acc, usage) => ({
        heapUsed: acc.heapUsed + usage.heapUsed,
        heapTotal: acc.heapTotal + usage.heapTotal,
        external: acc.external + usage.external,
        arrayBuffers: acc.arrayBuffers + usage.arrayBuffers
      }),
      { heapUsed: 0, heapTotal: 0, external: 0, arrayBuffers: 0 }
    );
    const count = this.samples.length;
    return {
      heapUsed: Math.round(totals.heapUsed / count),
      heapTotal: Math.round(totals.heapTotal / count),
      external: Math.round(totals.external / count),
      arrayBuffers: Math.round(totals.arrayBuffers / count)
    };
  }
  getPeak() {
    if (this.samples.length === 0) return void 0;
    return this.samples.reduce((peak, usage) => ({
      heapUsed: Math.max(peak.heapUsed, usage.heapUsed),
      heapTotal: Math.max(peak.heapTotal, usage.heapTotal),
      external: Math.max(peak.external, usage.external),
      arrayBuffers: Math.max(peak.arrayBuffers, usage.arrayBuffers)
    }));
  }
  clear() {
    this.samples = [];
  }
};
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
function gc() {
  if (typeof global !== "undefined" && global.gc) {
    global.gc();
  } else if (typeof window !== "undefined" && window.gc) {
    window.gc();
  }
}
function forceGC() {
  return new Promise((resolve) => {
    gc();
    setTimeout(() => {
      gc();
      resolve();
    }, 100);
  });
}

// src/types.ts
function isString(value) {
  return typeof value === "string";
}
function isNumber(value) {
  return typeof value === "number" && !isNaN(value);
}
function isBoolean(value) {
  return typeof value === "boolean";
}
function isFunction(value) {
  return typeof value === "function";
}
function isObject2(value) {
  return value !== null && typeof value === "object";
}
function isPlainObject(value) {
  return isObject2(value) && Object.prototype.toString.call(value) === "[object Object]" && !Array.isArray(value);
}
function isArray(value) {
  return Array.isArray(value);
}
function isDate(value) {
  return value instanceof Date && !isNaN(value.getTime());
}
function isRegExp(value) {
  return value instanceof RegExp;
}
function isError(value) {
  return value instanceof Error;
}
function isPromise(value) {
  return isObject2(value) && isFunction(value.then);
}
function isNull(value) {
  return value === null;
}
function isUndefined(value) {
  return value === void 0;
}
function isNil(value) {
  return value === null || value === void 0;
}
function isDefined(value) {
  return value !== void 0 && value !== null;
}
function isArrayOf(value, guard) {
  return isArray(value) && value.every(guard);
}
function isObjectWith(value, shape) {
  if (!isPlainObject(value)) return false;
  for (const [key, guard] of Object.entries(shape)) {
    if (!guard(value[key])) return false;
  }
  return true;
}
function isOneOf(value, options) {
  return options.includes(value);
}
function hasProperty(obj, prop) {
  return isObject2(obj) && prop in obj;
}
function hasProperties(obj, props) {
  if (!isObject2(obj)) return false;
  return props.every((prop) => prop in obj);
}
function isInstanceOf(value, constructor) {
  return value instanceof constructor;
}
function isStringArray(value) {
  return isArrayOf(value, isString);
}
function isNumberArray(value) {
  return isArrayOf(value, isNumber);
}
function isBooleanArray(value) {
  return isArrayOf(value, isBoolean);
}
function isEmptyString(value) {
  return value === "";
}
function isNonEmptyString(value) {
  return isString(value) && value.length > 0;
}
function isPositiveNumber(value) {
  return isNumber(value) && value > 0;
}
function isNonNegativeNumber(value) {
  return isNumber(value) && value >= 0;
}
function isInteger(value) {
  return isNumber(value) && Number.isInteger(value);
}
function isPositiveInteger(value) {
  return isInteger(value) && value > 0;
}
function isArrayLike(value) {
  return isObject2(value) && hasProperty(value, "length") && isNumber(value.length) && value.length >= 0;
}
function isIterable(value) {
  return isObject2(value) && Symbol.iterator in value;
}
function isAsyncIterable(value) {
  return isObject2(value) && Symbol.asyncIterator in value;
}
function isMap(value) {
  return value instanceof Map;
}
function isSet(value) {
  return value instanceof Set;
}
function isWeakMap(value) {
  return value instanceof WeakMap;
}
function isWeakSet(value) {
  return value instanceof WeakSet;
}
function isArrayBuffer(value) {
  return value instanceof ArrayBuffer;
}
function isTypedArray(value) {
  return ArrayBuffer.isView(value);
}
function isPrimitive(value) {
  return value === null || value === void 0 || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
function isSerializable(value) {
  if (isPrimitive(value)) return true;
  if (isArray(value)) return value.every(isSerializable);
  if (isPlainObject(value)) {
    return Object.values(value).every(isSerializable);
  }
  if (isDate(value)) return true;
  return false;
}
function assertIsString(value) {
  if (!isString(value)) {
    throw new TypeError(`Expected string, got ${typeof value}`);
  }
}
function assertIsNumber(value) {
  if (!isNumber(value)) {
    throw new TypeError(`Expected number, got ${typeof value}`);
  }
}
function assertIsObject(value) {
  if (!isObject2(value)) {
    throw new TypeError(`Expected object, got ${typeof value}`);
  }
}
function assertIsDefined(value) {
  if (!isDefined(value)) {
    throw new TypeError("Value is null or undefined");
  }
}
function createGuard(predicate) {
  return (value) => predicate(value);
}
function combineGuards(guard1, guard2) {
  return (value) => {
    return guard1(value) && guard2(value);
  };
}

// src/config.ts
var defaultConfig = {
  dateFormat: {
    default: "yyyy-MM-dd HH:mm:ss",
    timezone: "UTC"
  },
  validation: {
    strict: false,
    throwOnError: false
  },
  cache: {
    defaultTTL: 3e5,
    // 5 minutes
    maxSize: 1e3
  },
  errorHandling: {
    includeStackTrace: true,
    logErrors: false
  },
  async: {
    defaultTimeout: 3e4,
    // 30 seconds
    defaultRetries: 3,
    defaultConcurrency: 5
  }
};
var currentConfig = { ...defaultConfig };
function configureUtils(config) {
  currentConfig = deepMergeConfig(currentConfig, config);
}
function getConfig() {
  return { ...currentConfig };
}
function getConfigValue(key) {
  return currentConfig[key];
}
function resetConfig() {
  currentConfig = { ...defaultConfig };
}
function deepMergeConfig(target, source) {
  const result = { ...target };
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];
    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      result[key] = {
        ...targetValue,
        ...sourceValue
      };
    } else if (isDefined(sourceValue)) {
      result[key] = sourceValue;
    }
  }
  return result;
}
var ConfigManager = class _ConfigManager {
  config = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Map();
  set(key, value) {
    const oldValue = this.config.get(key);
    this.config.set(key, value);
    if (oldValue !== value) {
      this.notifyListeners(key, value);
    }
  }
  get(key, defaultValue) {
    return this.config.has(key) ? this.config.get(key) : defaultValue;
  }
  has(key) {
    return this.config.has(key);
  }
  delete(key) {
    const deleted = this.config.delete(key);
    if (deleted) {
      this.notifyListeners(key, void 0);
    }
    return deleted;
  }
  clear() {
    const keys = Array.from(this.config.keys());
    this.config.clear();
    for (const key of keys) {
      this.notifyListeners(key, void 0);
    }
  }
  keys() {
    return Array.from(this.config.keys());
  }
  values() {
    return Array.from(this.config.values());
  }
  entries() {
    return Array.from(this.config.entries());
  }
  size() {
    return this.config.size;
  }
  subscribe(key, listener) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(listener);
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        const index = keyListeners.indexOf(listener);
        if (index !== -1) {
          keyListeners.splice(index, 1);
        }
        if (keyListeners.length === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }
  merge(config) {
    for (const [key, value] of Object.entries(config)) {
      this.set(key, value);
    }
  }
  toObject() {
    const result = {};
    for (const [key, value] of this.config.entries()) {
      result[key] = value;
    }
    return result;
  }
  fromObject(obj) {
    this.clear();
    this.merge(obj);
  }
  clone() {
    const clone = new _ConfigManager();
    clone.config = new Map(this.config);
    return clone;
  }
  notifyListeners(key, value) {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      for (const listener of keyListeners) {
        try {
          listener(value);
        } catch (error) {
          console.error(`Error in config listener for key "${key}":`, error);
        }
      }
    }
  }
};
function createConfigManager(initialConfig) {
  const manager = new ConfigManager();
  if (initialConfig) {
    manager.fromObject(initialConfig);
  }
  return manager;
}
var Configuration = class {
  manager;
  options;
  constructor(config = {}, options = {}) {
    this.manager = new ConfigManager();
    this.options = options;
    this.initialize(config);
  }
  initialize(config) {
    const mergedConfig = { ...this.options.defaults, ...config };
    this.validateRequired(mergedConfig);
    this.validateValues(mergedConfig);
    this.transformValues(mergedConfig);
    this.manager.fromObject(mergedConfig);
  }
  validateRequired(config) {
    if (this.options.required) {
      for (const key of this.options.required) {
        if (!(key in config) || config[key] === void 0 || config[key] === null) {
          throw new Error(`Required configuration key "${key}" is missing`);
        }
      }
    }
  }
  validateValues(config) {
    if (this.options.validation) {
      for (const [key, validator] of Object.entries(this.options.validation)) {
        if (key in config && !validator(config[key])) {
          throw new Error(`Invalid value for configuration key "${key}"`);
        }
      }
    }
  }
  transformValues(config) {
    if (this.options.transform) {
      for (const [key, transformer] of Object.entries(this.options.transform)) {
        if (key in config) {
          config[key] = transformer(config[key]);
        }
      }
    }
  }
  get(key, defaultValue) {
    return this.manager.get(key, defaultValue);
  }
  set(key, value) {
    if (this.options.validation && this.options.validation[key]) {
      if (!this.options.validation[key](value)) {
        throw new Error(`Invalid value for configuration key "${key}"`);
      }
    }
    let transformedValue = value;
    if (this.options.transform && this.options.transform[key]) {
      transformedValue = this.options.transform[key](value);
    }
    this.manager.set(key, transformedValue);
  }
  has(key) {
    return this.manager.has(key);
  }
  subscribe(key, listener) {
    return this.manager.subscribe(key, listener);
  }
  toObject() {
    return this.manager.toObject();
  }
};

// src/index.ts
function createUtilChain() {
  const middlewares = [];
  return {
    use(middleware) {
      middlewares.push(middleware);
      return this;
    },
    async execute(data) {
      let result = data;
      for (const middleware of middlewares) {
        result = await middleware(result);
      }
      return result;
    }
  };
}
//# sourceMappingURL=index.cjs.map