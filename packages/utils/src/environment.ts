declare const window: any;
declare const Deno: any;
declare const self: any;
declare const importScripts: any;
declare const navigator: any;
declare const document: any;
declare const Worker: any;
declare const localStorage: any;
declare const sessionStorage: any;

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

export function isNode(): boolean {
  return typeof process !== 'undefined' && 
         process.versions != null && 
         process.versions.node != null;
}

export function isDeno(): boolean {
  return typeof Deno !== 'undefined';
}

export function isWebWorker(): boolean {
  return typeof self !== 'undefined' && 
         typeof importScripts === 'function' && 
         typeof navigator !== 'undefined';
}

export function isWindows(): boolean {
  if (isBrowser()) {
    return navigator.platform.indexOf('Win') > -1;
  }
  if (isNode()) {
    return process.platform === 'win32';
  }
  return false;
}

export function isMac(): boolean {
  if (isBrowser()) {
    return navigator.platform.indexOf('Mac') > -1;
  }
  if (isNode()) {
    return process.platform === 'darwin';
  }
  return false;
}

export function isLinux(): boolean {
  if (isBrowser()) {
    return navigator.platform.indexOf('Linux') > -1;
  }
  if (isNode()) {
    return process.platform === 'linux';
  }
  return false;
}

export function isIOS(): boolean {
  if (!isBrowser()) return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isAndroid(): boolean {
  if (!isBrowser()) return false;
  return /Android/.test(navigator.userAgent);
}

export function isMobile(): boolean {
  if (!isBrowser()) return false;
  return /Mobi|Android/i.test(navigator.userAgent);
}

export function isTablet(): boolean {
  if (!isBrowser()) return false;
  return /Tablet|iPad/i.test(navigator.userAgent);
}

export function isDesktop(): boolean {
  return !isMobile() && !isTablet();
}

export interface Environment {
  runtime: 'browser' | 'node' | 'deno' | 'webworker' | 'unknown';
  version?: string;
  platform: string;
  arch?: string;
  userAgent?: string;
}

export function getEnvironment(): Environment {
  if (isBrowser()) {
    return {
      runtime: 'browser',
      platform: navigator.platform,
      userAgent: navigator.userAgent
    };
  }
  
  if (isNode()) {
    return {
      runtime: 'node',
      version: process.versions.node,
      platform: process.platform,
      arch: process.arch
    };
  }
  
  if (isDeno()) {
    return {
      runtime: 'deno',
      version: Deno.version.deno,
      platform: Deno.build.os,
      arch: Deno.build.arch
    };
  }
  
  if (isWebWorker()) {
    return {
      runtime: 'webworker',
      platform: navigator.platform,
      userAgent: navigator.userAgent
    };
  }
  
  return {
    runtime: 'unknown',
    platform: 'unknown'
  };
}

export interface Platform {
  os: 'windows' | 'macos' | 'linux' | 'ios' | 'android' | 'unknown';
  arch?: 'x64' | 'x32' | 'arm64' | 'arm' | 'unknown';
  endianness?: 'BE' | 'LE';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export function getPlatform(): Platform {
  let os: Platform['os'] = 'unknown';
  let arch: Platform['arch'] = 'unknown';
  
  if (isWindows()) os = 'windows';
  else if (isMac()) os = 'macos';
  else if (isLinux()) os = 'linux';
  else if (isIOS()) os = 'ios';
  else if (isAndroid()) os = 'android';
  
  if (isNode()) {
    switch (process.arch) {
      case 'x64':
        arch = 'x64';
        break;
      case 'ia32':
        arch = 'x32';
        break;
      case 'arm64':
        arch = 'arm64';
        break;
      case 'arm':
        arch = 'arm';
        break;
    }
  } else if (isBrowser()) {
    if (navigator.userAgent.includes('x86_64') || navigator.userAgent.includes('x64')) {
      arch = 'x64';
    } else if (navigator.userAgent.includes('arm64') || navigator.userAgent.includes('aarch64')) {
      arch = 'arm64';
    } else if (navigator.userAgent.includes('arm')) {
      arch = 'arm';
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

export function getBrowserInfo(): {
  name: string;
  version: string;
  engine: string;
} | null {
  if (!isBrowser()) return null;
  
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = 'Unknown';
  let engine = 'Unknown';
  
  if (ua.includes('Chrome') && !ua.includes('Edge')) {
    name = 'Chrome';
    const match = ua.match(/Chrome\/([0-9.]+)/);
    version = match ? match[1] : 'Unknown';
    engine = 'Blink';
  } else if (ua.includes('Firefox')) {
    name = 'Firefox';
    const match = ua.match(/Firefox\/([0-9.]+)/);
    version = match ? match[1] : 'Unknown';
    engine = 'Gecko';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    name = 'Safari';
    const match = ua.match(/Version\/([0-9.]+)/);
    version = match ? match[1] : 'Unknown';
    engine = 'WebKit';
  } else if (ua.includes('Edge')) {
    name = 'Edge';
    const match = ua.match(/Edge\/([0-9.]+)/);
    version = match ? match[1] : 'Unknown';
    engine = 'EdgeHTML';
  }
  
  return { name, version, engine };
}

export function getNodeVersion(): string | null {
  return isNode() ? process.versions.node : null;
}

export function getV8Version(): string | null {
  return isNode() ? process.versions.v8 : null;
}

export function supportsWebGL(): boolean {
  if (!isBrowser()) return false;
  
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

export function supportsWebGL2(): boolean {
  if (!isBrowser()) return false;
  
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2');
  } catch {
    return false;
  }
}

export function supportsWorkers(): boolean {
  return typeof Worker !== 'undefined';
}

export function supportsServiceWorker(): boolean {
  return isBrowser() && 'serviceWorker' in navigator;
}

export function supportsLocalStorage(): boolean {
  if (!isBrowser()) return false;
  
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return true;
  } catch {
    return false;
  }
}

export function supportsSessionStorage(): boolean {
  if (!isBrowser()) return false;
  
  try {
    sessionStorage.setItem('test', 'test');
    sessionStorage.removeItem('test');
    return true;
  } catch {
    return false;
  }
}

function getEndianness(): 'BE' | 'LE' {
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(0, 256, true);
  return new Int16Array(buffer)[0] === 256 ? 'LE' : 'BE';
}