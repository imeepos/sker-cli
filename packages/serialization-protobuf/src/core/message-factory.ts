import { Type, Root, Message } from 'protobufjs';
import { SchemaRegistry } from '../schema/schema-registry.js';
import { ProtobufMessage, ValidationResult } from '../types/protobuf-types.js';
import { convertJSTypeToProtoType, convertProtoTypeToJSType } from '../utils/protobuf-utils.js';

/**
 * Message factory for creating and managing Protocol Buffers messages
 */
export class MessageFactory {
  constructor(private schemaRegistry: SchemaRegistry) {}

  /**
   * Create a protobuf message instance
   */
  async create<T = any>(
    messageType: string,
    data: T,
    options: { schemaVersion?: string } = {}
  ): Promise<ProtobufMessage<T>> {
    const compiledSchema = await this.schemaRegistry.getCompiledSchema(
      messageType.split('.').slice(0, -1).join('.') || messageType,
      options.schemaVersion
    );

    if (!compiledSchema) {
      throw new Error(`Schema not found for message type: ${messageType}`);
    }

    const MessageType = compiledSchema.types.get(messageType);
    if (!MessageType) {
      throw new Error(`Message type not found: ${messageType}`);
    }

    const convertedData = convertJSTypeToProtoType(data);
    const message = MessageType.create(convertedData);

    return new ProtobufMessageImpl<T>(MessageType, message, data);
  }

  /**
   * Parse a protobuf message from binary data
   */
  async parse<T = any>(
    messageType: string,
    binaryData: Uint8Array,
    options: { schemaVersion?: string } = {}
  ): Promise<ProtobufMessage<T>> {
    const compiledSchema = await this.schemaRegistry.getCompiledSchema(
      messageType.split('.').slice(0, -1).join('.') || messageType,
      options.schemaVersion
    );

    if (!compiledSchema) {
      throw new Error(`Schema not found for message type: ${messageType}`);
    }

    const MessageType = compiledSchema.types.get(messageType);
    if (!MessageType) {
      throw new Error(`Message type not found: ${messageType}`);
    }

    const message = MessageType.decode(binaryData);
    const jsData = convertProtoTypeToJSType(message.toJSON()) as T;

    return new ProtobufMessageImpl<T>(MessageType, message, jsData);
  }
}

/**
 * Implementation of ProtobufMessage interface
 */
class ProtobufMessageImpl<T = any> implements ProtobufMessage<T> {
  constructor(
    private messageType: Type,
    private message: Message,
    private data: T
  ) {}

  serialize(): Uint8Array {
    return this.messageType.encode(this.message).finish();
  }

  deserialize(data: Uint8Array): T {
    const decoded = this.messageType.decode(data);
    return convertProtoTypeToJSType(decoded.toJSON()) as T;
  }

  validate(): ValidationResult {
    try {
      // Basic validation using protobufjs
      const errors: any[] = [];
      
      // Check required fields
      for (const field of this.messageType.fieldsArray) {
        if (field.required) {
          const value = (this.data as any)?.[field.name];
          if (value === undefined || value === null) {
            errors.push({
              field: field.name,
              message: `Required field '${field.name}' is missing`,
              code: 'REQUIRED_FIELD_MISSING',
              value
            });
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          field: 'root',
          message: `Validation error: ${error}`,
          code: 'VALIDATION_ERROR'
        }]
      };
    }
  }

  toJSON(): any {
    return this.message.toJSON();
  }

  fromJSON(json: any): T {
    const message = this.messageType.fromObject(json);
    return convertProtoTypeToJSType(message.toJSON()) as T;
  }

  /**
   * Get the underlying protobufjs message
   */
  getInternalMessage(): Message {
    return this.message;
  }

  /**
   * Get the data
   */
  getData(): T {
    return this.data;
  }

  /**
   * Get message type information
   */
  getMessageType(): Type {
    return this.messageType;
  }
}