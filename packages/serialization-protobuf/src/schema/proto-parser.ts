/**
 * Protocol Buffers parser utilities
 */

export interface ProtoMessage {
  name: string;
  fields: ProtoField[];
  nested?: ProtoMessage[];
  enums?: ProtoEnum[];
}

export interface ProtoField {
  name: string;
  type: string;
  number: number;
  rule?: 'optional' | 'required' | 'repeated';
  options?: Record<string, any>;
}

export interface ProtoEnum {
  name: string;
  values: Record<string, number>;
}

export interface ProtoService {
  name: string;
  methods: ProtoMethod[];
}

export interface ProtoMethod {
  name: string;
  requestType: string;
  responseType: string;
  options?: Record<string, any>;
}

/**
 * Simple Protocol Buffers parser
 * Note: This is a simplified implementation for demonstration
 */
export class ProtoParser {
  /**
   * Parse .proto file content
   */
  static parse(content: string): {
    package?: string;
    imports: string[];
    messages: ProtoMessage[];
    enums: ProtoEnum[];
    services: ProtoService[];
  } {
    const lines = content.split('\n').map(line => line.trim());
    const result = {
      imports: [] as string[],
      messages: [] as ProtoMessage[],
      enums: [] as ProtoEnum[],
      services: [] as ProtoService[],
      package: undefined as string | undefined
    };

    let currentContext: 'root' | 'message' | 'enum' | 'service' = 'root';
    let currentMessage: ProtoMessage | null = null;
    let currentEnum: ProtoEnum | null = null;
    let currentService: ProtoService | null = null;
    let braceDepth = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
        continue;
      }

      // Handle syntax declaration
      if (trimmed.startsWith('syntax')) {
        continue; // Skip syntax declarations
      }

      // Handle package declaration
      if (trimmed.startsWith('package ')) {
        result.package = trimmed.replace('package ', '').replace(';', '').trim();
        continue;
      }

      // Handle imports
      if (trimmed.startsWith('import ')) {
        const importMatch = trimmed.match(/import\s+"([^"]+)"/);
        if (importMatch) {
          result.imports.push(importMatch[1]!);
        }
        continue;
      }

      // Handle message declarations
      if (trimmed.startsWith('message ')) {
        const messageName = trimmed.replace('message ', '').replace('{', '').trim();
        currentMessage = {
          name: messageName,
          fields: [],
          nested: [],
          enums: []
        };
        currentContext = 'message';
        if (trimmed.includes('{')) braceDepth++;
        continue;
      }

      // Handle enum declarations
      if (trimmed.startsWith('enum ')) {
        const enumName = trimmed.replace('enum ', '').replace('{', '').trim();
        currentEnum = {
          name: enumName,
          values: {}
        };
        currentContext = 'enum';
        if (trimmed.includes('{')) braceDepth++;
        continue;
      }

      // Handle service declarations
      if (trimmed.startsWith('service ')) {
        const serviceName = trimmed.replace('service ', '').replace('{', '').trim();
        currentService = {
          name: serviceName,
          methods: []
        };
        currentContext = 'service';
        if (trimmed.includes('{')) braceDepth++;
        continue;
      }

      // Handle braces
      if (trimmed.includes('{')) {
        braceDepth++;
      }
      if (trimmed.includes('}')) {
        braceDepth--;
        
        if (braceDepth === 0) {
          // End of current context
          if (currentContext === 'message' && currentMessage) {
            result.messages.push(currentMessage);
            currentMessage = null;
          } else if (currentContext === 'enum' && currentEnum) {
            if (currentMessage) {
              currentMessage.enums = currentMessage.enums || [];
              currentMessage.enums.push(currentEnum);
            } else {
              result.enums.push(currentEnum);
            }
            currentEnum = null;
          } else if (currentContext === 'service' && currentService) {
            result.services.push(currentService);
            currentService = null;
          }
          currentContext = 'root';
        }
        continue;
      }

      // Handle field declarations
      if (currentContext === 'message' && currentMessage) {
        const field = this.parseField(trimmed);
        if (field) {
          currentMessage.fields.push(field);
        }
      }

      // Handle enum values
      if (currentContext === 'enum' && currentEnum) {
        const enumValue = this.parseEnumValue(trimmed);
        if (enumValue) {
          currentEnum.values[enumValue.name] = enumValue.value;
        }
      }

      // Handle service methods
      if (currentContext === 'service' && currentService) {
        const method = this.parseServiceMethod(trimmed);
        if (method) {
          currentService.methods.push(method);
        }
      }
    }

    return result;
  }

  private static parseField(line: string): ProtoField | null {
    // Match patterns like: optional string name = 1;
    const fieldMatch = line.match(/^(optional|required|repeated)?\s*(\w+)\s+(\w+)\s*=\s*(\d+)/);
    
    if (fieldMatch) {
      return {
        rule: fieldMatch[1] as 'optional' | 'required' | 'repeated' | undefined,
        type: fieldMatch[2]!,
        name: fieldMatch[3]!,
        number: parseInt(fieldMatch[4]!, 10)
      };
    }

    return null;
  }

  private static parseEnumValue(line: string): { name: string; value: number } | null {
    // Match patterns like: UNKNOWN = 0;
    const enumMatch = line.match(/^(\w+)\s*=\s*(\d+)/);
    
    if (enumMatch) {
      return {
        name: enumMatch[1]!,
        value: parseInt(enumMatch[2]!, 10)
      };
    }

    return null;
  }

  private static parseServiceMethod(line: string): ProtoMethod | null {
    // Match patterns like: rpc GetUser(GetUserRequest) returns (User);
    const methodMatch = line.match(/^rpc\s+(\w+)\s*\(\s*(\w+)\s*\)\s*returns\s*\(\s*(\w+)\s*\)/);
    
    if (methodMatch) {
      return {
        name: methodMatch[1]!,
        requestType: methodMatch[2]!,
        responseType: methodMatch[3]!
      };
    }

    return null;
  }

  /**
   * Generate .proto file content from parsed structure
   */
  static generate(proto: {
    package?: string;
    imports?: string[];
    messages: ProtoMessage[];
    enums?: ProtoEnum[];
    services?: ProtoService[];
  }): string {
    const lines: string[] = [];
    
    lines.push('syntax = "proto3";');
    lines.push('');

    if (proto.package) {
      lines.push(`package ${proto.package};`);
      lines.push('');
    }

    if (proto.imports && proto.imports.length > 0) {
      for (const imp of proto.imports) {
        lines.push(`import "${imp}";`);
      }
      lines.push('');
    }

    // Generate enums
    if (proto.enums) {
      for (const enumDef of proto.enums) {
        lines.push(`enum ${enumDef.name} {`);
        for (const [name, value] of Object.entries(enumDef.values)) {
          lines.push(`  ${name} = ${value};`);
        }
        lines.push('}');
        lines.push('');
      }
    }

    // Generate messages
    for (const message of proto.messages) {
      this.generateMessage(message, lines, 0);
      lines.push('');
    }

    // Generate services
    if (proto.services) {
      for (const service of proto.services) {
        lines.push(`service ${service.name} {`);
        for (const method of service.methods) {
          lines.push(`  rpc ${method.name}(${method.requestType}) returns (${method.responseType});`);
        }
        lines.push('}');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  private static generateMessage(message: ProtoMessage, lines: string[], indent: number): void {
    const indentStr = '  '.repeat(indent);
    
    lines.push(`${indentStr}message ${message.name} {`);
    
    // Generate nested enums
    if (message.enums) {
      for (const enumDef of message.enums) {
        lines.push(`${indentStr}  enum ${enumDef.name} {`);
        for (const [name, value] of Object.entries(enumDef.values)) {
          lines.push(`${indentStr}    ${name} = ${value};`);
        }
        lines.push(`${indentStr}  }`);
      }
    }

    // Generate nested messages
    if (message.nested) {
      for (const nestedMessage of message.nested) {
        this.generateMessage(nestedMessage, lines, indent + 1);
      }
    }

    // Generate fields
    for (const field of message.fields) {
      let fieldLine = `${indentStr}  `;
      
      if (field.rule && field.rule !== 'optional') {
        fieldLine += `${field.rule} `;
      }
      
      fieldLine += `${field.type} ${field.name} = ${field.number};`;
      lines.push(fieldLine);
    }
    
    lines.push(`${indentStr}}`);
  }
}