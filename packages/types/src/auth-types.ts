/**
 * 认证授权类型定义
 * Authentication and authorization type definitions
 */

import type { SkerString, SkerTimestamp, UUID, Email } from './basic-types.js';
import type { SkerArray, SkerRecord, SkerOptional } from './collection-types.js';

/**
 * 认证方法枚举
 * Authentication method enumeration
 */
export enum AuthMethod {
  /** API密钥认证 */
  API_KEY = 'api_key',
  
  /** OAuth 2.0认证 */
  OAUTH2 = 'oauth2',
  
  /** JWT令牌认证 */
  JWT = 'jwt',
  
  /** 基础认证（用户名密码） */
  BASIC = 'basic',
  
  /** 双向TLS认证 */
  MTLS = 'mtls',
  
  /** SAML认证 */
  SAML = 'saml',
  
  /** 单点登录 */
  SSO = 'sso',
  
  /** 多因子认证 */
  MFA = 'mfa',
  
  /** 生物特征认证 */
  BIOMETRIC = 'biometric',
  
  /** 匿名访问 */
  ANONYMOUS = 'anonymous'
}

/**
 * OAuth2授权类型枚举
 * OAuth2 grant type enumeration
 */
export enum OAuth2GrantType {
  /** 授权码模式 */
  AUTHORIZATION_CODE = 'authorization_code',
  
  /** 隐式授权模式 */
  IMPLICIT = 'implicit',
  
  /** 客户端凭据模式 */
  CLIENT_CREDENTIALS = 'client_credentials',
  
  /** 密码模式 */
  PASSWORD = 'password',
  
  /** 刷新令牌模式 */
  REFRESH_TOKEN = 'refresh_token',
  
  /** 设备授权模式 */
  DEVICE_CODE = 'device_code'
}

/**
 * 令牌类型枚举
 * Token type enumeration
 */
export enum TokenType {
  /** 访问令牌 */
  ACCESS_TOKEN = 'access_token',
  
  /** 刷新令牌 */
  REFRESH_TOKEN = 'refresh_token',
  
  /** ID令牌 */
  ID_TOKEN = 'id_token',
  
  /** API密钥 */
  API_KEY = 'api_key',
  
  /** 会话令牌 */
  SESSION_TOKEN = 'session_token'
}

/**
 * 用户状态枚举
 * User status enumeration
 */
export enum UserStatus {
  /** 活跃 */
  ACTIVE = 'active',
  
  /** 非活跃 */
  INACTIVE = 'inactive',
  
  /** 暂停 */
  SUSPENDED = 'suspended',
  
  /** 锁定 */
  LOCKED = 'locked',
  
  /** 待验证 */
  PENDING_VERIFICATION = 'pending_verification',
  
  /** 已删除 */
  DELETED = 'deleted'
}

/**
 * 权限操作枚举
 * Permission action enumeration
 */
export enum PermissionAction {
  /** 创建 */
  CREATE = 'create',
  
  /** 读取 */
  READ = 'read',
  
  /** 更新 */
  UPDATE = 'update',
  
  /** 删除 */
  DELETE = 'delete',
  
  /** 执行 */
  EXECUTE = 'execute',
  
  /** 管理 */
  MANAGE = 'manage',
  
  /** 所有权限 */
  ALL = '*'
}

/**
 * 权限效果枚举
 * Permission effect enumeration
 */
export enum PermissionEffect {
  /** 允许 */
  ALLOW = 'allow',
  
  /** 拒绝 */
  DENY = 'deny'
}

/**
 * 基础认证信息接口
 * Basic authentication information interface
 */
export interface AuthenticationInfo {
  /** 认证方法 */
  method: AuthMethod;
  
  /** 认证凭据 */
  credentials: SkerRecord<string, unknown>;
  
  /** 认证时间 */
  authenticated_at: SkerTimestamp;
  
  /** 过期时间 */
  expires_at?: SkerTimestamp;
  
  /** 认证来源 */
  auth_source?: SkerString;
  
  /** 会话ID */
  session_id?: UUID;
  
  /** 客户端信息 */
  client_info?: {
    ip_address: SkerString;
    user_agent: SkerString;
    device_id?: SkerString;
    platform?: SkerString;
  };
  
  /** 元数据 */
  metadata?: SkerRecord<string, unknown>;
}

/**
 * 授权令牌接口
 * Authorization token interface
 */
export interface AuthorizationToken {
  /** 令牌值 */
  token: SkerString;
  
  /** 令牌类型 */
  token_type: TokenType;
  
  /** 颁发时间 */
  issued_at: SkerTimestamp;
  
  /** 过期时间 */
  expires_at: SkerTimestamp;
  
  /** 不早于时间 */
  not_before?: SkerTimestamp;
  
  /** 颁发者 */
  issuer: SkerString;
  
  /** 受众 */
  audience?: SkerArray<SkerString>;
  
  /** 主体（用户ID） */
  subject: SkerString;
  
  /** 作用域 */
  scopes?: SkerArray<SkerString>;
  
  /** 自定义声明 */
  claims?: SkerRecord<string, unknown>;
  
  /** 令牌指纹 */
  fingerprint?: SkerString;
}

/**
 * JWT令牌接口
 * JWT token interface
 */
export interface JWTToken extends AuthorizationToken {
  token_type: TokenType.ACCESS_TOKEN | TokenType.ID_TOKEN;
  
  /** JWT头部 */
  header: {
    /** 算法 */
    alg: SkerString;
    
    /** 类型 */
    typ: 'JWT';
    
    /** 密钥ID */
    kid?: SkerString;
    
    /** 内容类型 */
    cty?: SkerString;
  };
  
  /** JWT载荷 */
  payload: {
    /** 颁发者 */
    iss: SkerString;
    
    /** 主体 */
    sub: SkerString;
    
    /** 受众 */
    aud: SkerString | SkerArray<SkerString>;
    
    /** 过期时间 */
    exp: number;
    
    /** 不早于时间 */
    nbf?: number;
    
    /** 颁发时间 */
    iat: number;
    
    /** JWT ID */
    jti: SkerString;
    
    /** 用户角色 */
    roles?: SkerArray<SkerString>;
    
    /** 用户权限 */
    permissions?: SkerArray<SkerString>;
    
    /** 租户ID */
    tenant_id?: SkerString;
    
    /** 自定义声明 */
    [key: string]: unknown;
  };
  
  /** JWT签名 */
  signature: SkerString;
}

/**
 * API密钥接口
 * API key interface
 */
export interface APIKey extends AuthorizationToken {
  token_type: TokenType.API_KEY;
  
  /** 密钥名称 */
  key_name: SkerString;
  
  /** 密钥描述 */
  description?: SkerString;
  
  /** 密钥前缀 */
  key_prefix?: SkerString;
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 使用次数限制 */
  usage_limit?: number;
  
  /** 已使用次数 */
  usage_count?: number;
  
  /** 最后使用时间 */
  last_used_at?: SkerTimestamp;
  
  /** IP白名单 */
  allowed_ips?: SkerArray<SkerString>;
  
  /** 引用站点白名单 */
  allowed_referrers?: SkerArray<SkerString>;
  
  /** 限流配置 */
  rate_limit?: {
    requests_per_minute: number;
    requests_per_hour: number;
    requests_per_day: number;
  };
}

/**
 * OAuth2令牌接口
 * OAuth2 token interface
 */
export interface OAuth2Token extends AuthorizationToken {
  token_type: TokenType.ACCESS_TOKEN;
  
  /** 刷新令牌 */
  refresh_token?: SkerString;
  
  /** 授权类型 */
  grant_type: OAuth2GrantType;
  
  /** 客户端ID */
  client_id: SkerString;
  
  /** 重定向URI */
  redirect_uri?: SkerString;
  
  /** 授权码 */
  authorization_code?: SkerString;
  
  /** 状态参数 */
  state?: SkerString;
  
  /** PKCE码验证器 */
  code_verifier?: SkerString;
  
  /** PKCE码挑战 */
  code_challenge?: SkerString;
  
  /** PKCE码挑战方法 */
  code_challenge_method?: 'plain' | 'S256';
}

/**
 * 权限接口
 * Permission interface
 */
export interface Permission {
  /** 权限ID */
  permission_id: UUID;
  
  /** 权限名称 */
  name: SkerString;
  
  /** 资源类型 */
  resource_type: SkerString;
  
  /** 资源ID */
  resource_id?: SkerString;
  
  /** 操作 */
  action: PermissionAction;
  
  /** 权限效果 */
  effect: PermissionEffect;
  
  /** 条件表达式 */
  conditions?: SkerRecord<string, unknown>;
  
  /** 权限描述 */
  description?: SkerString;
  
  /** 权限标签 */
  tags?: SkerArray<SkerString>;
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 创建时间 */
  created_at: SkerTimestamp;
  
  /** 最后更新时间 */
  updated_at: SkerTimestamp;
  
  /** 元数据 */
  metadata?: SkerRecord<string, unknown>;
}

/**
 * 角色接口
 * Role interface
 */
export interface Role {
  /** 角色ID */
  role_id: UUID;
  
  /** 角色名称 */
  role_name: SkerString;
  
  /** 角色显示名称 */
  display_name?: SkerString;
  
  /** 角色描述 */
  description?: SkerString;
  
  /** 权限列表 */
  permissions: SkerArray<Permission>;
  
  /** 父角色ID */
  parent_role_id?: UUID;
  
  /** 子角色ID列表 */
  child_role_ids?: SkerArray<UUID>;
  
  /** 角色优先级 */
  priority?: number;
  
  /** 是否内置角色 */
  is_built_in: boolean;
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 角色标签 */
  tags?: SkerArray<SkerString>;
  
  /** 创建时间 */
  created_at: SkerTimestamp;
  
  /** 最后更新时间 */
  updated_at: SkerTimestamp;
  
  /** 元数据 */
  metadata?: SkerRecord<string, unknown>;
}

/**
 * 用户主体接口
 * User principal interface
 */
export interface UserPrincipal {
  /** 用户ID */
  user_id: UUID;
  
  /** 用户名 */
  username: SkerString;
  
  /** 显示名称 */
  display_name?: SkerString;
  
  /** 邮箱地址 */
  email?: Email;
  
  /** 手机号码 */
  phone_number?: SkerString;
  
  /** 用户状态 */
  status: UserStatus;
  
  /** 角色列表 */
  roles: SkerArray<Role>;
  
  /** 权限列表 */
  permissions: SkerArray<Permission>;
  
  /** 用户组列表 */
  groups?: SkerArray<SkerString>;
  
  /** 租户ID */
  tenant_id?: UUID;
  
  /** 部门ID */
  department_id?: UUID;
  
  /** 最后登录时间 */
  last_login_at?: SkerTimestamp;
  
  /** 密码最后修改时间 */
  password_changed_at?: SkerTimestamp;
  
  /** 账户创建时间 */
  created_at: SkerTimestamp;
  
  /** 最后更新时间 */
  updated_at: SkerTimestamp;
  
  /** 用户偏好设置 */
  preferences?: SkerRecord<string, unknown>;
  
  /** 用户配置文件 */
  profile?: {
    first_name?: SkerString;
    last_name?: SkerString;
    avatar_url?: SkerString;
    timezone?: SkerString;
    locale?: SkerString;
    biography?: SkerString;
  };
  
  /** 安全设置 */
  security_settings?: {
    mfa_enabled: boolean;
    mfa_methods?: SkerArray<SkerString>;
    password_expiry_date?: SkerTimestamp;
    login_attempts: number;
    locked_until?: SkerTimestamp;
    require_password_change: boolean;
  };
  
  /** 用户元数据 */
  metadata?: SkerRecord<string, unknown>;
}

/**
 * 认证上下文接口
 * Authentication context interface
 */
export interface AuthenticationContext {
  /** 用户主体 */
  user: SkerOptional<UserPrincipal>;
  
  /** 认证信息 */
  auth_info: AuthenticationInfo;
  
  /** 当前令牌 */
  token?: AuthorizationToken;
  
  /** 会话ID */
  session_id?: UUID;
  
  /** 认证是否有效 */
  is_authenticated: boolean;
  
  /** 是否为匿名用户 */
  is_anonymous: boolean;
  
  /** 权限列表 */
  permissions: SkerArray<SkerString>;
  
  /** 角色列表 */
  roles: SkerArray<SkerString>;
  
  /** 作用域列表 */
  scopes: SkerArray<SkerString>;
  
  /** 租户ID */
  tenant_id?: UUID;
  
  /** 客户端信息 */
  client_info?: {
    client_id?: SkerString;
    ip_address?: SkerString;
    user_agent?: SkerString;
    device_id?: SkerString;
  };
  
  /** 认证上下文元数据 */
  metadata?: SkerRecord<string, unknown>;
}

/**
 * 授权策略接口
 * Authorization policy interface
 */
export interface AuthorizationPolicy {
  /** 策略ID */
  policy_id: UUID;
  
  /** 策略名称 */
  name: SkerString;
  
  /** 策略版本 */
  version: SkerString;
  
  /** 策略描述 */
  description?: SkerString;
  
  /** 策略规则 */
  rules: SkerArray<{
    rule_id: UUID;
    name: SkerString;
    condition: SkerString;
    effect: PermissionEffect;
    priority: number;
    enabled: boolean;
  }>;
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 策略标签 */
  tags?: SkerArray<SkerString>;
  
  /** 创建时间 */
  created_at: SkerTimestamp;
  
  /** 最后更新时间 */
  updated_at: SkerTimestamp;
  
  /** 策略元数据 */
  metadata?: SkerRecord<string, unknown>;
}

/**
 * 授权请求接口
 * Authorization request interface
 */
export interface AuthorizationRequest {
  /** 请求ID */
  request_id: UUID;
  
  /** 用户主体 */
  principal: UserPrincipal;
  
  /** 请求的资源 */
  resource: SkerString;
  
  /** 请求的操作 */
  action: PermissionAction;
  
  /** 请求上下文 */
  context?: SkerRecord<string, unknown>;
  
  /** 请求时间 */
  requested_at: SkerTimestamp;
  
  /** 请求来源 */
  source?: {
    ip_address?: SkerString;
    user_agent?: SkerString;
    service_id?: SkerString;
  };
}

/**
 * 授权结果接口
 * Authorization result interface
 */
export interface AuthorizationResult {
  /** 请求ID */
  request_id: UUID;
  
  /** 授权是否通过 */
  authorized: boolean;
  
  /** 决策原因 */
  reason?: SkerString;
  
  /** 匹配的策略ID */
  matched_policy_id?: UUID;
  
  /** 匹配的规则ID */
  matched_rule_id?: UUID;
  
  /** 权限效果 */
  effect: PermissionEffect;
  
  /** 决策时间 */
  decision_time: SkerTimestamp;
  
  /** 决策耗时（毫秒） */
  decision_duration_ms: number;
  
  /** 建议操作 */
  suggested_actions?: SkerArray<SkerString>;
  
  /** 决策元数据 */
  metadata?: SkerRecord<string, unknown>;
}