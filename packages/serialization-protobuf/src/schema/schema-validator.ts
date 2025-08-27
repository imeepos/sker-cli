import { Type, Field, Enum, Root } from 'protobufjs';
import { ValidationResult, ValidationError } from '../types/protobuf-types.js';

/**
 * Schema validator for Protocol Buffers
 */
export class SchemaValidator {
  /**
   * Validate a message against its schema
   */
  static validate(data: any, messageType: Type): ValidationResult {
    const errors: ValidationError[] = [];
    
    try {
      // Validate required fields
      this.validateRequiredFields(data, messageType, errors);
      
      // Validate field types
      this.validateFieldTypes(data, messageType, errors);
      
      // Validate enums
      this.validateEnums(data, messageType, errors);
      
      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          field: 'root',
          message: `Validation failed: ${error}`,
          code: 'VALIDATION_ERROR'
        }]
      };
    }
  }

  /**
   * Validate schema compatibility between two versions
   */
  static validateCompatibility(
    oldSchema: Root, 
    newSchema: Root,
    mode: 'backward' | 'forward' | 'full' = 'backward'
  ): ValidationResult {
    const errors: ValidationError[] = [];
    
    try {
      switch (mode) {
        case 'backward':
          this.validateBackwardCompatibility(oldSchema, newSchema, errors);
          break;
        case 'forward':
          this.validateForwardCompatibility(oldSchema, newSchema, errors);
          break;
        case 'full':
          this.validateBackwardCompatibility(oldSchema, newSchema, errors);
          this.validateForwardCompatibility(oldSchema, newSchema, errors);
          break;
      }
      
      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          field: 'schema',
          message: `Compatibility validation failed: ${error}`,
          code: 'COMPATIBILITY_ERROR'
        }]
      };
    }
  }

  private static validateRequiredFields(data: any, messageType: Type, errors: ValidationError[]): void {
    if (!data || typeof data !== 'object') {
      return;
    }

    for (const field of messageType.fieldsArray) {
      if (field.required && (data[field.name] === undefined || data[field.name] === null)) {
        errors.push({
          field: field.name,
          message: `Required field '${field.name}' is missing`,
          code: 'REQUIRED_FIELD_MISSING',
          value: data[field.name]
        });
      }
    }
  }

  private static validateFieldTypes(data: any, messageType: Type, errors: ValidationError[]): void {
    if (!data || typeof data !== 'object') {
      return;
    }

    for (const field of messageType.fieldsArray) {
      const value = data[field.name];
      
      if (value === undefined || value === null) {
        continue; // Skip undefined/null values (handled by required field validation)
      }

      if (!this.isValidFieldType(value, field)) {
        errors.push({
          field: field.name,
          message: `Invalid type for field '${field.name}'. Expected ${field.type}, got ${typeof value}`,
          code: 'INVALID_FIELD_TYPE',
          value
        });
      }

      // Validate repeated fields
      if (field.repeated && Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (!this.isValidFieldType(value[i], { ...field, repeated: false })) {
            errors.push({
              field: `${field.name}[${i}]`,
              message: `Invalid type for repeated field '${field.name}' at index ${i}`,
              code: 'INVALID_REPEATED_FIELD_TYPE',
              value: value[i]
            });
          }
        }
      }
    }
  }

  private static validateEnums(data: any, messageType: Type, errors: ValidationError[]): void {
    if (!data || typeof data !== 'object') {
      return;
    }

    for (const field of messageType.fieldsArray) {
      const value = data[field.name];
      
      if (value === undefined || value === null) {
        continue;
      }

      // Check if field is an enum type
      const resolvedType = field.resolve().resolvedType;
      if (resolvedType instanceof Enum) {
        const isValidEnum = this.isValidEnumValue(value, resolvedType);
        if (!isValidEnum) {
          const validValues = Object.keys(resolvedType.values);
          errors.push({
            field: field.name,
            message: `Invalid enum value '${value}' for field '${field.name}'. Valid values: ${validValues.join(', ')}`,
            code: 'INVALID_ENUM_VALUE',
            value
          });
        }
      }
    }
  }

  private static isValidFieldType(value: any, field: { type: string; repeated?: boolean }): boolean {
    if (field.repeated && !Array.isArray(value)) {
      return false;
    }

    const checkValue = field.repeated ? (Array.isArray(value) ? value[0] : value) : value;

    switch (field.type) {
      case 'double':
      case 'float':
        return typeof checkValue === 'number' && isFinite(checkValue);
      
      case 'int32':
      case 'sint32':
      case 'sfixed32':
        return Number.isInteger(checkValue) && checkValue >= -2147483648 && checkValue <= 2147483647;
      
      case 'uint32':
      case 'fixed32':
        return Number.isInteger(checkValue) && checkValue >= 0 && checkValue <= 4294967295;
      
      case 'int64':
      case 'sint64':
      case 'sfixed64':
      case 'uint64':
      case 'fixed64':
        return typeof checkValue === 'bigint' || 
               (Number.isInteger(checkValue) && Number.isSafeInteger(checkValue));
      
      case 'bool':
        return typeof checkValue === 'boolean';
      
      case 'string':
        return typeof checkValue === 'string';
      
      case 'bytes':
        return checkValue instanceof Uint8Array || typeof checkValue === 'string';
      
      default:
        // For custom message types, assume valid (would need deeper validation)
        return true;
    }
  }

  private static isValidEnumValue(value: any, enumType: Enum): boolean {
    const enumValues = Object.values(enumType.values);
    const enumNames = Object.keys(enumType.values);
    
    // Check if value is a valid enum number or name
    return enumValues.includes(value) || enumNames.includes(String(value));
  }

  private static validateBackwardCompatibility(oldSchema: Root, newSchema: Root, errors: ValidationError[]): void {
    // Check for removed fields
    this.checkRemovedFields(oldSchema, newSchema, errors);
    
    // Check for changed field types
    this.checkChangedFieldTypes(oldSchema, newSchema, errors);
    
    // Check for changed field numbers
    this.checkChangedFieldNumbers(oldSchema, newSchema, errors);
  }

  private static validateForwardCompatibility(oldSchema: Root, newSchema: Root, errors: ValidationError[]): void {
    // Check for added required fields
    this.checkAddedRequiredFields(oldSchema, newSchema, errors);
    
    // Check for removed enum values
    this.checkRemovedEnumValues(oldSchema, newSchema, errors);
  }

  private static checkRemovedFields(oldSchema: Root, newSchema: Root, errors: ValidationError[]): void {
    // Simplified implementation
    console.warn('Field removal check not fully implemented');
  }

  private static checkChangedFieldTypes(oldSchema: Root, newSchema: Root, errors: ValidationError[]): void {
    // Simplified implementation
    console.warn('Field type change check not fully implemented');
  }

  private static checkChangedFieldNumbers(oldSchema: Root, newSchema: Root, errors: ValidationError[]): void {
    // Simplified implementation
    console.warn('Field number change check not fully implemented');
  }

  private static checkAddedRequiredFields(oldSchema: Root, newSchema: Root, errors: ValidationError[]): void {
    // Simplified implementation
    console.warn('Added required field check not fully implemented');
  }

  private static checkRemovedEnumValues(oldSchema: Root, newSchema: Root, errors: ValidationError[]): void {
    // Simplified implementation
    console.warn('Removed enum value check not fully implemented');
  }
}