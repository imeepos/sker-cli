declare function camelCase(str: string): string;
declare function snakeCase(str: string): string;
declare function kebabCase(str: string): string;
declare function truncate(str: string, length: number, suffix?: string): string;
declare function maskString(str: string, start: number, end: number, mask?: string): string;
declare function isValidEmail(email: string): boolean;
declare function isValidUrl(url: string): boolean;
declare function capitalize(str: string): string;
declare function pascalCase(str: string): string;
declare function escapeHtml(str: string): string;
declare function unescapeHtml(str: string): string;

declare function deepClone<T>(obj: T): T;
declare function deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T;
declare function getPath(obj: any, path: string, defaultValue?: any): any;
declare function setPath(obj: any, path: string, value: any): any;
declare function omit<T extends Record<string, any>, K extends keyof T>(obj: T, keys: (K | string)[]): Omit<T, K>;
declare function pick<T extends Record<string, any>, K extends keyof T>(obj: T, keys: (K | string)[]): Pick<T, K>;
declare function isEmpty(value: any): boolean;
declare function isEqual(a: any, b: any): boolean;

declare function chunk<T>(array: T[], size: number): T[][];
declare function flatten<T>(array: (T | T[])[]): T[];
declare function uniq<T>(array: T[]): T[];
declare function uniqBy<T>(array: T[], keyFn: (item: T) => any): T[];
declare function groupBy<T>(array: T[], key: keyof T | ((item: T) => string | number)): Record<string, T[]>;
declare function sortBy<T>(array: T[], key: keyof T | ((item: T) => any)): T[];
declare function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]];
declare function sample<T>(array: T[]): T | undefined;
declare function sampleSize<T>(array: T[], size: number): T[];
declare function shuffle<T>(array: T[]): T[];
declare function zip<T, U>(array1: T[], array2: U[]): [T, U][];
declare function zipWith<T, U, R>(array1: T[], array2: U[], fn: (a: T, b: U) => R): R[];
declare function intersection<T>(...arrays: T[][]): T[];
declare function difference<T>(array: T[], ...others: T[][]): T[];
declare function union<T>(...arrays: T[][]): T[];

declare function delay(ms: number): Promise<void>;
declare function timeout<T>(promise: Promise<T>, ms: number): Promise<T>;
interface RetryOptions {
    maxAttempts: number;
    delay?: number;
    backoff?: 'fixed' | 'linear' | 'exponential';
    shouldRetry?: (error: any, attempt: number) => boolean;
}
declare function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T>;
declare function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): (...args: Parameters<T>) => void;
declare function throttle<T extends (...args: any[]) => any>(fn: T, ms: number): (...args: Parameters<T>) => void;
interface PromiseAllOptions {
    concurrency?: number;
}
declare function promiseAll<T>(promises: (() => Promise<T>)[], options?: PromiseAllOptions): Promise<T[]>;
interface SettledResult<T> {
    status: 'fulfilled' | 'rejected';
    value?: T;
    reason?: any;
}
declare function promiseAllSettled<T>(promises: Promise<T>[]): Promise<SettledResult<T>[]>;
declare function race<T>(promises: Promise<T>[]): Promise<T>;
declare function safeAsync<T>(fn: () => Promise<T>): Promise<[Error | null, T | null]>;
declare class AsyncQueue<T> {
    private queue;
    private running;
    private concurrency;
    constructor(concurrency?: number);
    add<R>(fn: () => Promise<R>): Promise<R>;
    private process;
}

declare function isValidUUID(uuid: string): boolean;
declare function isValidJSON(str: string): boolean;
declare function isValidDate(date: string | Date): boolean;
declare function isValidPhoneNumber(phone: string): boolean;
interface SchemaField {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    min?: number;
    max?: number;
    format?: 'email' | 'url' | 'uuid' | 'date' | 'phone';
    pattern?: RegExp;
    enum?: any[];
    items?: SchemaField;
    properties?: Record<string, SchemaField>;
}
interface ValidationResult {
    valid: boolean;
    errors: string[];
}
declare function validateSchema(data: any, schema: Record<string, SchemaField>): ValidationResult;
declare function sanitizeInput(input: string): string;
declare function sanitizeSQL(input: string): string;
declare function isValidCreditCard(cardNumber: string): boolean;
declare function isValidIPAddress(ip: string): boolean;

declare function generateUUID(): string;
declare function generateNonce(length?: number): string;
declare function hashString(str: string, algorithm?: 'sha1' | 'sha256' | 'sha512'): Promise<string>;
declare function encodeBase64(str: string): string;
declare function decodeBase64(encoded: string): string;
declare function encodeUrl(str: string): string;
declare function decodeUrl(encoded: string): string;
declare function generateSecurePassword(length?: number, options?: {
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
}): string;
declare function generateSalt(length?: number): string;
declare function pbkdf2(password: string, salt: string, iterations?: number): Promise<string>;

interface TimeUnit {
    years?: number;
    months?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
}
interface TimeDiff {
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
    totalMilliseconds: number;
}
declare function formatDate(date: Date, format: string): string;
declare function parseDate(dateString: string, format?: string): Date;
declare function addTime(date: Date, time: TimeUnit): Date;
declare function subtractTime(date: Date, time: TimeUnit): Date;
declare function diffTime(date1: Date, date2: Date): TimeDiff;
declare function isExpired(timestamp: number | Date, maxAge: number): boolean;
declare function getTimezone(): string;
declare function convertTimezone(date: Date, fromTimezone: string, toTimezone: string): Date;
declare function startOfDay(date: Date): Date;
declare function endOfDay(date: Date): Date;
declare function startOfWeek(date: Date, weekStartsOn?: number): Date;
declare function endOfWeek(date: Date, weekStartsOn?: number): Date;
declare function startOfMonth(date: Date): Date;
declare function endOfMonth(date: Date): Date;
declare function isLeapYear(year: number): boolean;
declare function getDaysInMonth(year: number, month: number): number;
declare function getWeekOfYear(date: Date): number;
declare function formatRelativeTime(date: Date, baseDate?: Date): string;

declare function isBrowser(): boolean;
declare function isNode(): boolean;
declare function isDeno(): boolean;
declare function isWebWorker(): boolean;
declare function isWindows(): boolean;
declare function isMac(): boolean;
declare function isLinux(): boolean;
declare function isIOS(): boolean;
declare function isAndroid(): boolean;
declare function isMobile(): boolean;
declare function isTablet(): boolean;
declare function isDesktop(): boolean;
interface Environment {
    runtime: 'browser' | 'node' | 'deno' | 'webworker' | 'unknown';
    version?: string;
    platform: string;
    arch?: string;
    userAgent?: string;
}
declare function getEnvironment(): Environment;
interface Platform {
    os: 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'unknown';
    arch?: 'x64' | 'x32' | 'arm64' | 'arm' | 'unknown';
    endianness?: 'BE' | 'LE';
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
}
declare function getPlatform(): Platform;
declare function getBrowserInfo(): {
    name: string;
    version: string;
    engine: string;
} | null;
declare function getNodeVersion(): string | null;
declare function getV8Version(): string | null;
declare function supportsWebGL(): boolean;
declare function supportsWebGL2(): boolean;
declare function supportsWorkers(): boolean;
declare function supportsServiceWorker(): boolean;
declare function supportsLocalStorage(): boolean;
declare function supportsSessionStorage(): boolean;

interface CacheOptions<K = any, V = any> {
    maxSize?: number;
    ttl?: number;
    onEvict?: (key: K, value: V) => void;
}
interface CacheEntry<T> {
    value: T;
    expiresAt?: number;
    lastAccessed: number;
}
declare class LRUCache<K, V> {
    private cache;
    private accessOrder;
    private accessCounter;
    private readonly maxSize;
    private readonly ttl?;
    private readonly onEvict?;
    constructor(options?: CacheOptions<K, V>);
    get(key: K): V | undefined;
    set(key: K, value: V): void;
    delete(key: K): boolean;
    clear(): void;
    has(key: K): boolean;
    size(): number;
    keys(): K[];
    values(): V[];
    entries(): [K, V][];
    private isExpired;
    private evictLeastRecentlyUsed;
}
declare function memoize<T extends (...args: any[]) => any>(fn: T, options?: CacheOptions<string, ReturnType<T>>): T;
declare function memoizeAsync<T extends (...args: any[]) => Promise<any>>(fn: T, options?: CacheOptions<string, ReturnType<T>>): T;

interface ErrorContext {
    [key: string]: any;
}
declare class CustomError extends Error {
    readonly code: string;
    readonly context: ErrorContext;
    readonly timestamp: Date;
    readonly cause: Error | undefined;
    constructor(code: string, message: string, context?: ErrorContext, cause?: Error);
    toJSON(): object;
}
declare function createError(code: string, message: string, context?: ErrorContext): CustomError;
declare function wrapError(error: Error, code: string, message: string, context?: ErrorContext): CustomError;
declare function isErrorType(error: any, type: string): boolean;
interface ErrorHandlerOptions {
    onError?: (error: Error) => void;
    retries?: number;
    backoff?: 'fixed' | 'linear' | 'exponential';
    delay?: number;
    shouldRetry?: (error: Error, attempt: number) => boolean;
}
declare class ErrorHandler {
    private options;
    constructor(options?: ErrorHandlerOptions);
    wrap<T extends (...args: any[]) => any>(fn: T): T;
    execute<T>(fn: () => T | Promise<T>): Promise<T>;
    private delay;
}
declare function safeSync<T>(fn: () => T): [Error | null, T | null];
declare class ErrorCollector {
    private errors;
    add(error: Error): void;
    addAll(errors: Error[]): void;
    hasErrors(): boolean;
    getErrors(): Error[];
    getFirst(): Error | undefined;
    getLast(): Error | undefined;
    clear(): void;
    throwIfAny(): void;
    count(): number;
}
declare class AggregateError extends Error {
    readonly errors: Error[];
    constructor(errors: Error[], message?: string);
    toJSON(): object;
}

interface BatchOptions {
    batchSize?: number;
    concurrency?: number;
    delay?: number;
    onProgress?: (processed: number, total: number) => void;
    onError?: (error: Error, item: any, index: number) => void;
}
declare function batchProcess<T, R>(items: T[], processor: (batch: T[]) => Promise<R[]>, options?: BatchOptions): Promise<R[]>;
interface BatcherOptions<T> {
    maxBatchSize: number;
    maxWaitTime: number;
    concurrency?: number;
    processor: (items: T[]) => Promise<any[]>;
}
declare class Batcher<T> {
    private queue;
    private timer;
    private processing;
    private readonly options;
    constructor(options: BatcherOptions<T>);
    add(item: T): Promise<void>;
    flush(): Promise<void>;
    close(): Promise<void>;
    size(): number;
}
interface ChunkProcessorOptions<T, R> {
    chunkSize: number;
    processor: (chunk: T[]) => Promise<R>;
    onChunkComplete?: (result: R, chunkIndex: number) => void;
    onError?: (error: Error, chunkIndex: number) => void;
    concurrency?: number;
}
declare function processInChunks<T, R>(items: T[], options: ChunkProcessorOptions<T, R>): Promise<R[]>;

interface ObjectPoolOptions<T> {
    maxSize?: number;
    createFn: () => T;
    resetFn?: (obj: T) => void;
    validateFn?: (obj: T) => boolean;
}
declare class ObjectPool<T> {
    private pool;
    private readonly maxSize;
    private readonly createFn;
    private readonly resetFn?;
    private readonly validateFn?;
    constructor(options: ObjectPoolOptions<T>);
    acquire(): T;
    release(obj: T): void;
    size(): number;
    clear(): void;
}
declare function createObjectPool<T>(createFn: () => T, resetFn?: (obj: T) => void, options?: Omit<ObjectPoolOptions<T>, 'createFn' | 'resetFn'>): ObjectPool<T>;
declare function createMemoryPool(bufferSize: number, poolSize?: number): ObjectPool<ArrayBuffer>;
interface MemoryTracker {
    getUsage(): MemoryUsage;
    track<T>(fn: () => T): {
        result: T;
        memoryDelta: number;
    };
    trackAsync<T>(fn: () => Promise<T>): Promise<{
        result: T;
        memoryDelta: number;
    }>;
}
interface MemoryUsage {
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
}
declare function trackMemoryUsage(): MemoryTracker;
declare class MemoryMonitor {
    private interval;
    private samples;
    private maxSamples;
    private onThreshold?;
    private threshold?;
    constructor(maxSamples?: number, options?: {
        threshold?: number;
        onThreshold?: (usage: MemoryUsage) => void;
    });
    start(intervalMs?: number): void;
    stop(): void;
    getSamples(): MemoryUsage[];
    getLatest(): MemoryUsage | undefined;
    getAverage(): MemoryUsage | undefined;
    getPeak(): MemoryUsage | undefined;
    clear(): void;
}
declare function formatBytes(bytes: number, decimals?: number): string;
declare function gc(): void;
declare function forceGC(): Promise<void>;

declare function isString(value: unknown): value is string;
declare function isNumber(value: unknown): value is number;
declare function isBoolean(value: unknown): value is boolean;
declare function isFunction(value: unknown): value is Function;
declare function isObject(value: unknown): value is object;
declare function isPlainObject(value: unknown): value is Record<string, any>;
declare function isArray(value: unknown): value is any[];
declare function isDate(value: unknown): value is Date;
declare function isRegExp(value: unknown): value is RegExp;
declare function isError(value: unknown): value is Error;
declare function isPromise(value: unknown): value is Promise<any>;
declare function isNull(value: unknown): value is null;
declare function isUndefined(value: unknown): value is undefined;
declare function isNil(value: unknown): value is null | undefined;
declare function isDefined<T>(value: T | undefined | null): value is T;
declare function isArrayOf<T>(value: unknown, guard: (item: unknown) => item is T): value is T[];
declare function isObjectWith<T extends Record<string, any>>(value: unknown, shape: {
    [K in keyof T]: (val: unknown) => val is T[K];
}): value is T;
declare function isOneOf<T extends readonly unknown[]>(value: unknown, options: T): value is T[number];
declare function hasProperty<K extends string>(obj: unknown, prop: K): obj is Record<K, unknown>;
declare function hasProperties<K extends string>(obj: unknown, props: K[]): obj is Record<K, unknown>;
declare function isInstanceOf<T>(value: unknown, constructor: new (...args: any[]) => T): value is T;
declare function isStringArray(value: unknown): value is string[];
declare function isNumberArray(value: unknown): value is number[];
declare function isBooleanArray(value: unknown): value is boolean[];
declare function isEmptyString(value: unknown): value is '';
declare function isNonEmptyString(value: unknown): value is string;
declare function isPositiveNumber(value: unknown): value is number;
declare function isNonNegativeNumber(value: unknown): value is number;
declare function isInteger(value: unknown): value is number;
declare function isPositiveInteger(value: unknown): value is number;
declare function isArrayLike(value: unknown): value is ArrayLike<any>;
declare function isIterable(value: unknown): value is Iterable<any>;
declare function isAsyncIterable(value: unknown): value is AsyncIterable<any>;
declare function isMap(value: unknown): value is Map<any, any>;
declare function isSet(value: unknown): value is Set<any>;
declare function isWeakMap(value: unknown): value is WeakMap<any, any>;
declare function isWeakSet(value: unknown): value is WeakSet<any>;
declare function isArrayBuffer(value: unknown): value is ArrayBuffer;
declare function isTypedArray(value: unknown): value is ArrayBufferView;
type Primitive = string | number | boolean | null | undefined;
declare function isPrimitive(value: unknown): value is Primitive;
declare function isSerializable(value: unknown): boolean;
declare function assertIsString(value: unknown): asserts value is string;
declare function assertIsNumber(value: unknown): asserts value is number;
declare function assertIsObject(value: unknown): asserts value is object;
declare function assertIsDefined<T>(value: T | undefined | null): asserts value is T;
declare function createGuard<T>(predicate: (value: unknown) => boolean): (value: unknown) => value is T;
type TypeGuard<T> = (value: unknown) => value is T;
declare function combineGuards<T, U>(guard1: TypeGuard<T>, guard2: TypeGuard<U>): TypeGuard<T & U>;

interface UtilsConfig {
    dateFormat?: {
        default?: string;
        timezone?: string;
    };
    validation?: {
        strict?: boolean;
        throwOnError?: boolean;
    };
    cache?: {
        defaultTTL?: number;
        maxSize?: number;
    };
    errorHandling?: {
        includeStackTrace?: boolean;
        logErrors?: boolean;
    };
    async?: {
        defaultTimeout?: number;
        defaultRetries?: number;
        defaultConcurrency?: number;
    };
}
declare function configureUtils(config: UtilsConfig): void;
declare function getConfig(): Required<UtilsConfig>;
declare function getConfigValue<K extends keyof UtilsConfig>(key: K): Required<UtilsConfig>[K];
declare function resetConfig(): void;
declare class ConfigManager {
    private config;
    private listeners;
    set<T>(key: string, value: T): void;
    get<T>(key: string, defaultValue?: T): T | undefined;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    keys(): string[];
    values(): any[];
    entries(): [string, any][];
    size(): number;
    subscribe(key: string, listener: (value: any) => void): () => void;
    merge(config: Record<string, any>): void;
    toObject(): Record<string, any>;
    fromObject(obj: Record<string, any>): void;
    clone(): ConfigManager;
    private notifyListeners;
}
declare function createConfigManager(initialConfig?: Record<string, any>): ConfigManager;
interface ConfigurationOptions {
    required?: string[];
    defaults?: Record<string, any>;
    validation?: Record<string, (value: any) => boolean>;
    transform?: Record<string, (value: any) => any>;
}
declare class Configuration {
    private manager;
    private options;
    constructor(config?: Record<string, any>, options?: ConfigurationOptions);
    private initialize;
    private validateRequired;
    private validateValues;
    private transformValues;
    get<T>(key: string, defaultValue?: T): T | undefined;
    set<T>(key: string, value: T): void;
    has(key: string): boolean;
    subscribe(key: string, listener: (value: any) => void): () => void;
    toObject(): Record<string, any>;
}

interface UtilChain {
    use<T>(middleware: (data: T) => T | Promise<T>): UtilChain;
    execute<T>(data: T): Promise<T>;
}
declare function createUtilChain(): UtilChain;

export { AggregateError, AsyncQueue, type BatchOptions, Batcher, type BatcherOptions, type CacheEntry, type CacheOptions, type ChunkProcessorOptions, ConfigManager, Configuration, type ConfigurationOptions, CustomError, type Environment, ErrorCollector, type ErrorContext, ErrorHandler, type ErrorHandlerOptions, LRUCache, MemoryMonitor, type MemoryTracker, type MemoryUsage, ObjectPool, type ObjectPoolOptions, type Platform, type Primitive, type PromiseAllOptions, type RetryOptions, type SchemaField, type SettledResult, type TimeDiff, type TimeUnit, type TypeGuard, type UtilChain, type UtilsConfig, type ValidationResult, addTime, assertIsDefined, assertIsNumber, assertIsObject, assertIsString, batchProcess, camelCase, capitalize, chunk, combineGuards, configureUtils, convertTimezone, createConfigManager, createError, createGuard, createMemoryPool, createObjectPool, createUtilChain, debounce, decodeBase64, decodeUrl, deepClone, deepMerge, delay, diffTime, difference, encodeBase64, encodeUrl, endOfDay, endOfMonth, endOfWeek, escapeHtml, flatten, forceGC, formatBytes, formatDate, formatRelativeTime, gc, generateNonce, generateSalt, generateSecurePassword, generateUUID, getBrowserInfo, getConfig, getConfigValue, getDaysInMonth, getEnvironment, getNodeVersion, getPath, getPlatform, getTimezone, getV8Version, getWeekOfYear, groupBy, hasProperties, hasProperty, hashString, intersection, isAndroid, isArray, isArrayBuffer, isArrayLike, isArrayOf, isAsyncIterable, isBoolean, isBooleanArray, isBrowser, isDate, isDefined, isDeno, isDesktop, isEmpty, isEmptyString, isEqual, isError, isErrorType, isExpired, isFunction, isIOS, isInstanceOf, isInteger, isIterable, isLeapYear, isLinux, isMac, isMap, isMobile, isNil, isNode, isNonEmptyString, isNonNegativeNumber, isNull, isNumber, isNumberArray, isObject, isObjectWith, isOneOf, isPlainObject, isPositiveInteger, isPositiveNumber, isPrimitive, isPromise, isRegExp, isSerializable, isSet, isString, isStringArray, isTablet, isTypedArray, isUndefined, isValidCreditCard, isValidDate, isValidEmail, isValidIPAddress, isValidJSON, isValidPhoneNumber, isValidUUID, isValidUrl, isWeakMap, isWeakSet, isWebWorker, isWindows, kebabCase, maskString, memoize, memoizeAsync, omit, parseDate, partition, pascalCase, pbkdf2, pick, processInChunks, promiseAll, promiseAllSettled, race, resetConfig, retry, safeAsync, safeSync, sample, sampleSize, sanitizeInput, sanitizeSQL, setPath, shuffle, snakeCase, sortBy, startOfDay, startOfMonth, startOfWeek, subtractTime, supportsLocalStorage, supportsServiceWorker, supportsSessionStorage, supportsWebGL, supportsWebGL2, supportsWorkers, throttle, timeout, trackMemoryUsage, truncate, unescapeHtml, union, uniq, uniqBy, validateSchema, wrapError, zip, zipWith };
