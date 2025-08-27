export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export function isValidDate(date: string | Date): boolean {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(cleanPhone);
}

export interface SchemaField {
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

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateSchema(data: any, schema: Record<string, SchemaField>): ValidationResult {
  const errors: string[] = [];
  
  for (const [key, field] of Object.entries(schema)) {
    const value = data[key];
    
    if (field.required && (value === undefined || value === null)) {
      errors.push(`Field '${key}' is required`);
      continue;
    }
    
    if (value === undefined || value === null) continue;
    
    if (!validateFieldType(value, field.type)) {
      errors.push(`Field '${key}' must be of type ${field.type}`);
      continue;
    }
    
    if (field.min !== undefined) {
      if ((typeof value === 'string' || Array.isArray(value)) && value.length < field.min) {
        errors.push(`Field '${key}' must have at least ${field.min} characters/items`);
      } else if (typeof value === 'number' && value < field.min) {
        errors.push(`Field '${key}' must be at least ${field.min}`);
      }
    }
    
    if (field.max !== undefined) {
      if ((typeof value === 'string' || Array.isArray(value)) && value.length > field.max) {
        errors.push(`Field '${key}' must have at most ${field.max} characters/items`);
      } else if (typeof value === 'number' && value > field.max) {
        errors.push(`Field '${key}' must be at most ${field.max}`);
      }
    }
    
    if (field.format) {
      const formatError = validateFormat(value, field.format, key);
      if (formatError) errors.push(formatError);
    }
    
    if (field.pattern && typeof value === 'string' && !field.pattern.test(value)) {
      errors.push(`Field '${key}' does not match required pattern`);
    }
    
    if (field.enum && !field.enum.includes(value)) {
      errors.push(`Field '${key}' must be one of: ${field.enum.join(', ')}`);
    }
    
    if (field.type === 'array' && Array.isArray(value) && field.items) {
      for (let i = 0; i < value.length; i++) {
        if (!validateFieldType(value[i], field.items.type)) {
          errors.push(`Field '${key}[${i}]' must be of type ${field.items.type}`);
        }
      }
    }
    
    if (field.type === 'object' && field.properties) {
      const nestedResult = validateSchema(value, field.properties);
      errors.push(...nestedResult.errors.map(err => `${key}.${err}`));
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function sanitizeInput(input: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return input.replace(/[&<>"'/]/g, match => htmlEntities[match]!);
}

export function sanitizeSQL(input: string): string {
  return input.replace(/['";\\]/g, '\\$&');
}

export function isValidCreditCard(cardNumber: string): boolean {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;
  
  let sum = 0;
  let shouldDouble = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i]!);
    
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

export function isValidIPAddress(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

function validateFieldType(value: any, type: string): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return false;
  }
}

function validateFormat(value: any, format: string, fieldName: string): string | null {
  if (typeof value !== 'string') return null;
  
  switch (format) {
    case 'email':
      return !isValidEmail(value) ? `Field '${fieldName}' must be a valid email` : null;
    case 'url':
      return !isValidUrl(value) ? `Field '${fieldName}' must be a valid URL` : null;
    case 'uuid':
      return !isValidUUID(value) ? `Field '${fieldName}' must be a valid UUID` : null;
    case 'date':
      return !isValidDate(value) ? `Field '${fieldName}' must be a valid date` : null;
    case 'phone':
      return !isValidPhoneNumber(value) ? `Field '${fieldName}' must be a valid phone number` : null;
    default:
      return null;
  }
}