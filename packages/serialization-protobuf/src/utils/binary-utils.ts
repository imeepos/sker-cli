/**
 * Binary utilities for Protocol Buffers serialization
 */

/**
 * Convert number to varint bytes
 */
export function encodeVarint(value: number): Uint8Array {
  const bytes: number[] = [];
  let val = value >>> 0;
  
  while (val >= 0x80) {
    bytes.push((val & 0xff) | 0x80);
    val >>>= 7;
  }
  
  bytes.push(val & 0xff);
  return new Uint8Array(bytes);
}

/**
 * Decode varint bytes to number
 */
export function decodeVarint(bytes: Uint8Array, offset = 0): { value: number; bytesRead: number } {
  let value = 0;
  let shift = 0;
  let bytesRead = 0;
  
  for (let i = offset; i < bytes.length; i++) {
    const byte = bytes[i]!;
    bytesRead++;
    
    value |= (byte & 0x7f) << shift;
    
    if ((byte & 0x80) === 0) {
      break;
    }
    
    shift += 7;
    
    if (shift >= 32) {
      throw new Error('Varint too long');
    }
  }
  
  return { value, bytesRead };
}

/**
 * Encode length-prefixed bytes
 */
export function encodeLengthPrefixed(data: Uint8Array): Uint8Array {
  const lengthBytes = encodeVarint(data.length);
  const result = new Uint8Array(lengthBytes.length + data.length);
  
  result.set(lengthBytes, 0);
  result.set(data, lengthBytes.length);
  
  return result;
}

/**
 * Decode length-prefixed bytes
 */
export function decodeLengthPrefixed(bytes: Uint8Array, offset = 0): { data: Uint8Array; bytesRead: number } {
  const { value: length, bytesRead: lengthBytes } = decodeVarint(bytes, offset);
  const data = bytes.slice(offset + lengthBytes, offset + lengthBytes + length);
  
  return { data, bytesRead: lengthBytes + length };
}

/**
 * Concatenate multiple Uint8Arrays
 */
export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  
  return result;
}

/**
 * Check if two Uint8Arrays are equal
 */
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}