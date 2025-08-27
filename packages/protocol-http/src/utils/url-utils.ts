/**
 * @fileoverview URL处理工具函数
 */

import { URL } from 'url';
import { HTTPQuery } from '../types/http-types.js';

/**
 * 解析URL
 */
export function parseURL(urlString: string, base?: string): URL {
  try {
    return new URL(urlString, base);
  } catch (error) {
    throw new Error(`Invalid URL: ${urlString}`);
  }
}

/**
 * 构建查询字符串
 */
export function buildQueryString(query: HTTPQuery): string {
  const params = new URLSearchParams();
  
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        for (const item of value) {
          params.append(key, item);
        }
      } else {
        params.append(key, value);
      }
    }
  }
  
  return params.toString();
}

/**
 * 合并URL路径
 */
export function joinPaths(...paths: string[]): string {
  return paths
    .filter(path => path && path.length > 0)
    .map(path => path.replace(/^\/+|\/+$/g, ''))
    .join('/')
    .replace(/\/+/g, '/');
}

/**
 * 规范化URL路径
 */
export function normalizePath(path: string): string {
  // 移除多余的斜杠
  let normalized = path.replace(/\/+/g, '/');
  
  // 移除末尾斜杠（除非是根路径）
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  // 确保以斜杠开头
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  
  return normalized;
}

/**
 * 提取URL的基础部分
 */
export function getBaseURL(urlString: string): string {
  try {
    const url = new URL(urlString);
    return `${url.protocol}//${url.host}`;
  } catch (error) {
    throw new Error(`Invalid URL: ${urlString}`);
  }
}

/**
 * 检查URL是否为绝对地址
 */
export function isAbsoluteURL(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

/**
 * 合并基础URL和相对路径
 */
export function resolveURL(base: string, relative: string): string {
  if (isAbsoluteURL(relative)) {
    return relative;
  }
  
  try {
    const baseURL = new URL(base);
    const resolved = new URL(relative, baseURL);
    return resolved.toString();
  } catch (error) {
    throw new Error(`Cannot resolve URL: ${base} + ${relative}`);
  }
}

/**
 * 提取文件扩展名
 */
export function getFileExtension(urlString: string): string {
  try {
    const url = new URL(urlString);
    const pathname = url.pathname;
    const lastDotIndex = pathname.lastIndexOf('.');
    
    if (lastDotIndex === -1 || lastDotIndex === pathname.length - 1) {
      return '';
    }
    
    return pathname.slice(lastDotIndex + 1);
  } catch {
    return '';
  }
}

/**
 * 检查路径是否匹配模式
 */
export function matchURLPattern(pattern: string, path: string): boolean {
  // 转换路径模式为正则表达式
  const regexPattern = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // 转义特殊字符
    .replace(/\\:\w+/g, '([^/]+)')          // 命名参数
    .replace(/\\\*/g, '(.*)');              // 通配符
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * 提取路径参数值
 */
export function extractPathParams(pattern: string, path: string): Record<string, string> {
  const params: Record<string, string> = {};
  
  // 提取参数名
  const paramNames: string[] = [];
  const paramRegex = /:(\w+)/g;
  let match;
  
  while ((match = paramRegex.exec(pattern)) !== null) {
    paramNames.push(match[1]!);
  }
  
  // 如果没有参数，直接返回
  if (paramNames.length === 0) {
    return params;
  }
  
  // 创建匹配正则
  const regexPattern = pattern.replace(/:(\w+)/g, '([^/]+)');
  const regex = new RegExp(`^${regexPattern}$`);
  const values = path.match(regex);
  
  if (values) {
    paramNames.forEach((name, index) => {
      params[name] = values[index + 1]!;
    });
  }
  
  return params;
}

/**
 * 编码URL组件
 */
export function encodeURLComponent(component: string): string {
  return encodeURIComponent(component)
    .replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
 * 解码URL组件
 */
export function decodeURLComponent(component: string): string {
  try {
    return decodeURIComponent(component);
  } catch (error) {
    // 如果解码失败，返回原字符串
    return component;
  }
}

/**
 * 清理URL查询参数
 */
export function cleanQuery(query: HTTPQuery): HTTPQuery {
  const cleaned: HTTPQuery = {};
  
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        const cleanedArray = value.filter(v => v !== undefined && v !== null && v !== '');
        if (cleanedArray.length > 0) {
          cleaned[key] = cleanedArray;
        }
      } else {
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
}

/**
 * 添加查询参数到URL
 */
export function addQueryToURL(urlString: string, query: HTTPQuery): string {
  try {
    const url = new URL(urlString);
    const cleanedQuery = cleanQuery(query);
    
    for (const [key, value] of Object.entries(cleanedQuery)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, item);
        }
      } else {
        url.searchParams.set(key, value as string);
      }
    }
    
    return url.toString();
  } catch (error) {
    throw new Error(`Cannot add query to URL: ${urlString}`);
  }
}

/**
 * 移除URL的查询参数
 */
export function removeQueryFromURL(urlString: string): string {
  try {
    const url = new URL(urlString);
    url.search = '';
    return url.toString();
  } catch (error) {
    throw new Error(`Cannot remove query from URL: ${urlString}`);
  }
}

/**
 * 获取URL的域名
 */
export function getDomain(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch (error) {
    throw new Error(`Cannot extract domain from URL: ${urlString}`);
  }
}

/**
 * 检查URL是否为同域
 */
export function isSameDomain(url1: string, url2: string): boolean {
  try {
    return getDomain(url1) === getDomain(url2);
  } catch {
    return false;
  }
}

/**
 * 获取URL的端口
 */
export function getPort(urlString: string): number | null {
  try {
    const url = new URL(urlString);
    return url.port ? parseInt(url.port, 10) : null;
  } catch {
    return null;
  }
}

/**
 * 检查URL是否使用HTTPS
 */
export function isHTTPS(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * 转换HTTP URL为HTTPS
 */
export function toHTTPS(urlString: string): string {
  try {
    const url = new URL(urlString);
    url.protocol = 'https:';
    return url.toString();
  } catch (error) {
    throw new Error(`Cannot convert URL to HTTPS: ${urlString}`);
  }
}

/**
 * 验证URL格式
 */
export function validateURL(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString);
    
    // 检查协议
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are supported' };
    }
    
    // 检查主机名
    if (!url.hostname) {
      return { valid: false, error: 'Hostname is required' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }
}