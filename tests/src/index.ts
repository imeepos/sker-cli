/**
 * @sker/tests - 综合测试套件入口
 * Comprehensive test suite entry point
 */

// 导出测试工具和设置
export * from './setup/test-setup.js';
export * from './setup/protocol-setup.js';
export * from './setup/serialization-setup.js';
export * from './setup/integration-setup.js';
export * from './setup/e2e-setup.js';

// 导出测试工具函数
export * from './utils/test-helpers.js';
export * from './utils/mock-factories.js';
export * from './utils/assertion-helpers.js';

// 导出测试常量
export * from './constants/test-constants.js';

// 测试套件信息
export const TEST_SUITE_INFO = {
  name: '@sker/tests',
  version: '1.0.0',
  description: 'Comprehensive test suite for Sker CLI packages',
  categories: [
    'unit',
    'integration', 
    'e2e',
    'protocol',
    'serialization',
    'performance'
  ]
} as const;
