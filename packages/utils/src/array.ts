export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) return [];
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export function flatten<T>(array: (T | T[])[]): T[] {
  const result: T[] = [];
  for (const item of array) {
    if (Array.isArray(item)) {
      result.push(...flatten(item));
    } else {
      result.push(item);
    }
  }
  return result;
}

export function uniq<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function uniqBy<T>(array: T[], keyFn: (item: T) => any): T[] {
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function groupBy<T>(array: T[], key: keyof T | ((item: T) => string | number)): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    const groupName = String(groupKey);
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function sortBy<T>(array: T[], key: keyof T | ((item: T) => any)): T[] {
  return [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key];
    const bVal = typeof key === 'function' ? key(b) : b[key];
    
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });
}

export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];
  
  for (const item of array) {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  }
  
  return [truthy, falsy];
}

export function sample<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

export function sampleSize<T>(array: T[], size: number): T[] {
  if (size >= array.length) return shuffle([...array]);
  const shuffled = shuffle([...array]);
  return shuffled.slice(0, size);
}

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function zip<T, U>(array1: T[], array2: U[]): [T, U][] {
  const length = Math.min(array1.length, array2.length);
  const result: [T, U][] = [];
  for (let i = 0; i < length; i++) {
    result.push([array1[i]!, array2[i]!]);
  }
  return result;
}

export function zipWith<T, U, R>(
  array1: T[], 
  array2: U[], 
  fn: (a: T, b: U) => R
): R[] {
  const length = Math.min(array1.length, array2.length);
  const result: R[] = [];
  for (let i = 0; i < length; i++) {
    result.push(fn(array1[i]!, array2[i]!));
  }
  return result;
}

export function intersection<T>(...arrays: T[][]): T[] {
  if (arrays.length === 0) return [];
  if (arrays.length === 1) return [...arrays[0]!];
  
  return arrays.reduce((acc, array) => 
    acc.filter(item => array.includes(item))
  );
}

export function difference<T>(array: T[], ...others: T[][]): T[] {
  const otherItems = new Set(others.flat());
  return array.filter(item => !otherItems.has(item));
}

export function union<T>(...arrays: T[][]): T[] {
  return uniq(arrays.flat());
}