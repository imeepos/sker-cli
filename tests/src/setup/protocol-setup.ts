/**
 * 协议测试专用设置
 * Protocol test specific setup
 */

import { vi } from 'vitest';

// Mock HTTP服务器
export const mockHttpServer = {
  port: 3001,
  isRunning: false,
  
  async start() {
    if (this.isRunning) return;
    // 启动Mock HTTP服务器
    this.isRunning = true;
    console.log(`Mock HTTP server started on port ${this.port}`);
  },
  
  async stop() {
    if (!this.isRunning) return;
    // 停止Mock HTTP服务器
    this.isRunning = false;
    console.log('Mock HTTP server stopped');
  }
};

// Mock gRPC服务器
export const mockGrpcServer = {
  port: 50051,
  isRunning: false,
  
  async start() {
    if (this.isRunning) return;
    // 启动Mock gRPC服务器
    this.isRunning = true;
    console.log(`Mock gRPC server started on port ${this.port}`);
  },
  
  async stop() {
    if (!this.isRunning) return;
    // 停止Mock gRPC服务器
    this.isRunning = false;
    console.log('Mock gRPC server stopped');
  }
};

// Mock WebSocket服务器
export const mockWebSocketServer = {
  port: 8080,
  isRunning: false,
  
  async start() {
    if (this.isRunning) return;
    // 启动Mock WebSocket服务器
    this.isRunning = true;
    console.log(`Mock WebSocket server started on port ${this.port}`);
  },
  
  async stop() {
    if (!this.isRunning) return;
    // 停止Mock WebSocket服务器
    this.isRunning = false;
    console.log('Mock WebSocket server stopped');
  }
};

// 协议测试前置设置
beforeAll(async () => {
  await Promise.all([
    mockHttpServer.start(),
    mockGrpcServer.start(),
    mockWebSocketServer.start()
  ]);
});

// 协议测试后置清理
afterAll(async () => {
  await Promise.all([
    mockHttpServer.stop(),
    mockGrpcServer.stop(),
    mockWebSocketServer.stop()
  ]);
});
