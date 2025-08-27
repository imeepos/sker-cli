// 认证类型
export const AUTH_TYPES = {
  API_KEY: 'api_key',
  BEARER_TOKEN: 'bearer',
  BASIC: 'basic',
  OAUTH2: 'oauth2',
  JWT: 'jwt',
  MUTUAL_TLS: 'mtls',
  DIGEST: 'digest'
} as const;

// 令牌类型
export const TOKEN_TYPES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  ID_TOKEN: 'id_token',
  API_KEY: 'api_key'
} as const;

// 权限级别
export const PERMISSION_LEVELS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
} as const;

// 加密算法
export const CRYPTO_ALGORITHMS = {
  // 对称加密
  AES_128_GCM: 'aes-128-gcm',
  AES_256_GCM: 'aes-256-gcm',
  
  // 非对称加密
  RSA_2048: 'rsa-2048',
  RSA_4096: 'rsa-4096',
  ECDSA_P256: 'ecdsa-p256',
  ECDSA_P384: 'ecdsa-p384',
  
  // 哈希算法
  SHA256: 'sha256',
  SHA512: 'sha512',
  BCRYPT: 'bcrypt',
  SCRYPT: 'scrypt'
} as const;

// JWT标准声明
export const JWT_CLAIMS = {
  ISSUER: 'iss',              // 颁发者
  SUBJECT: 'sub',             // 主题
  AUDIENCE: 'aud',            // 受众
  EXPIRATION: 'exp',          // 过期时间
  NOT_BEFORE: 'nbf',          // 不早于时间
  ISSUED_AT: 'iat',           // 颁发时间
  JWT_ID: 'jti',              // JWT ID
  
  // 自定义声明
  ROLES: 'roles',             // 角色
  PERMISSIONS: 'permissions', // 权限
  TENANT_ID: 'tenant_id',     // 租户ID
  USER_ID: 'user_id',         // 用户ID
  CLIENT_ID: 'client_id'      // 客户端ID
} as const;

// JWT算法
export const JWT_ALGORITHMS = {
  HS256: 'HS256',             // HMAC SHA256
  HS384: 'HS384',             // HMAC SHA384  
  HS512: 'HS512',             // HMAC SHA512
  RS256: 'RS256',             // RSA SHA256
  RS384: 'RS384',             // RSA SHA384
  RS512: 'RS512',             // RSA SHA512
  ES256: 'ES256',             // ECDSA SHA256
  ES384: 'ES384',             // ECDSA SHA384
  ES512: 'ES512'              // ECDSA SHA512
} as const;

// JWT载荷接口
export interface JWTPayload {
  [JWT_CLAIMS.ISSUER]?: string;
  [JWT_CLAIMS.SUBJECT]?: string;
  [JWT_CLAIMS.AUDIENCE]?: string | string[];
  [JWT_CLAIMS.EXPIRATION]?: number;
  [JWT_CLAIMS.NOT_BEFORE]?: number;
  [JWT_CLAIMS.ISSUED_AT]?: number;
  [JWT_CLAIMS.JWT_ID]?: string;
  [JWT_CLAIMS.ROLES]?: string[];
  [JWT_CLAIMS.PERMISSIONS]?: string[];
  [JWT_CLAIMS.TENANT_ID]?: string;
  [JWT_CLAIMS.USER_ID]?: string;
  [JWT_CLAIMS.CLIENT_ID]?: string;
  [key: string]: any;
}

// 类型定义
export type AuthType = typeof AUTH_TYPES[keyof typeof AUTH_TYPES];
export type TokenType = typeof TOKEN_TYPES[keyof typeof TOKEN_TYPES];
export type PermissionLevel = typeof PERMISSION_LEVELS[keyof typeof PERMISSION_LEVELS];
export type CryptoAlgorithm = typeof CRYPTO_ALGORITHMS[keyof typeof CRYPTO_ALGORITHMS];
export type JWTClaim = typeof JWT_CLAIMS[keyof typeof JWT_CLAIMS];
export type JWTAlgorithm = typeof JWT_ALGORITHMS[keyof typeof JWT_ALGORITHMS];