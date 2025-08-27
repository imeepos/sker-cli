import { Logger } from './logger.js';
import { LoggerMiddlewareConfig, LogContext } from './types.js';

export function createLoggerMiddleware(config: LoggerMiddlewareConfig) {
  const {
    logger,
    includeRequest = true,
    includeResponse = false,
    sensitiveFields = ['password', 'token', 'authorization', 'cookie']
  } = config;

  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || generateRequestId();
    const traceId = req.headers['x-trace-id'] || generateTraceId();
    
    req.requestId = requestId;
    req.traceId = traceId;
    
    const context: LogContext = {
      request_id: requestId,
      trace_id: traceId,
      method: req.method,
      url: req.url || req.originalUrl,
      user_agent: req.headers['user-agent'],
      ip_address: req.ip || req.connection?.remoteAddress,
      user_id: req.user?.id || req.userId
    };

    logger.runInContext(context, () => {
      if (includeRequest) {
        const requestData = sanitizeObject({
          method: req.method,
          url: req.url || req.originalUrl,
          headers: req.headers,
          query: req.query,
          body: req.body,
          params: req.params
        }, sensitiveFields);

        logger.info('HTTP request started', {
          ...context,
          request: requestData
        });
      }

      const originalSend = res.send;
      const originalJson = res.json;
      
      res.send = function(body: any) {
        res.responseBody = body;
        return originalSend.call(this, body);
      };

      res.json = function(body: any) {
        res.responseBody = body;
        return originalJson.call(this, body);
      };

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const responseContext: any = {
          ...context,
          status_code: res.statusCode,
          duration_ms: duration
        };

        if (includeResponse && res.responseBody) {
          const responseData = sanitizeObject({
            status: res.statusCode,
            headers: res.getHeaders ? res.getHeaders() : {},
            body: res.responseBody
          }, sensitiveFields);
          
          responseContext.response = responseData;
        }

        if (res.statusCode >= 400) {
          logger.warn('HTTP request completed with error', responseContext);
        } else {
          logger.info('HTTP request completed', responseContext);
        }
      });

      res.on('error', (error: Error) => {
        const duration = Date.now() - startTime;
        logger.error('HTTP request failed', {
          ...context,
          duration_ms: duration,
          error: error.message
        }, error);
      });

      next();
    });
  };
}

export function createKoaLoggerMiddleware(config: LoggerMiddlewareConfig) {
  const {
    logger,
    logRequests = true,
    logResponses = false,
    logErrors = true,
    sensitiveFields = ['password', 'token', 'authorization', 'cookie']
  } = config;

  return async (ctx: any, next: any) => {
    const startTime = Date.now();
    const requestId = ctx.headers['x-request-id'] || generateRequestId();
    const traceId = ctx.headers['x-trace-id'] || generateTraceId();
    
    ctx.state.requestId = requestId;
    ctx.state.traceId = traceId;
    
    const context: LogContext = {
      request_id: requestId,
      trace_id: traceId,
      method: ctx.method,
      url: ctx.url,
      user_agent: ctx.headers['user-agent'],
      ip_address: ctx.ip,
      user_id: ctx.state.user?.id || ctx.state.userId
    };

    await logger.runInContext(context, async () => {
      if (logRequests) {
        const requestData = sanitizeObject({
          method: ctx.method,
          url: ctx.url,
          headers: ctx.headers,
          query: ctx.query,
          body: ctx.request.body
        }, sensitiveFields);

        logger.info('Koa request started', {
          ...context,
          request: requestData
        });
      }

      try {
        await next();
        
        const duration = Date.now() - startTime;
        const responseContext: any = {
          ...context,
          status_code: ctx.status,
          duration_ms: duration
        };

        if (logResponses && ctx.body) {
          const responseData = sanitizeObject({
            status: ctx.status,
            headers: ctx.response.headers,
            body: ctx.body
          }, sensitiveFields);
          
          responseContext.response = responseData;
        }

        if (ctx.status >= 400) {
          logger.warn('Koa request completed with error', responseContext);
        } else {
          logger.info('Koa request completed', responseContext);
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        
        if (logErrors) {
          logger.error('Koa request failed', {
            ...context,
            duration_ms: duration,
            error: (error as Error).message
          }, error as Error);
        }

        throw error;
      }
    });
  };
}

export function createGrpcLoggerInterceptor(config: LoggerMiddlewareConfig) {
  const {
    logger,
    logCalls = true,
    logResults = true,
    logErrors = true,
    sensitiveFields = []
  } = config;

  return (call: any, callback: any) => {
    const startTime = Date.now();
    const requestId = call.metadata?.get('x-request-id')?.[0] || generateRequestId();
    const traceId = call.metadata?.get('x-trace-id')?.[0] || generateTraceId();
    
    const context: LogContext = {
      request_id: requestId,
      trace_id: traceId,
      grpc_method: call.handler?.path,
      grpc_type: call.handler?.type,
      remote_address: call.getPeer?.()
    };

    logger.runInContext(context, () => {
      if (logCalls) {
        const requestData = sanitizeObject({
          method: call.handler?.path,
          metadata: call.metadata?.getMap(),
          request: call.request
        }, sensitiveFields);

        logger.info('gRPC call started', {
          ...context,
          grpc_call: requestData
        });
      }

      const originalCallback = callback;
      const wrappedCallback = (error: any, response: any) => {
        const duration = Date.now() - startTime;
        
        if (error) {
          if (logErrors) {
            logger.error('gRPC call failed', {
              ...context,
              duration_ms: duration,
              grpc_code: error.code,
              error: error.message
            }, error);
          }
        } else {
          const responseContext: any = {
            ...context,
            duration_ms: duration
          };

          if (logResults && response) {
            const responseData = sanitizeObject({
              response: response
            }, sensitiveFields);
            
            responseContext.grpc_response = responseData;
          }

          logger.info('gRPC call completed', responseContext);
        }

        originalCallback(error, response);
      };

      try {
        call.handler.func(call, wrappedCallback);
      } catch (error) {
        const duration = Date.now() - startTime;
        
        if (logErrors) {
          logger.error('gRPC call exception', {
            ...context,
            duration_ms: duration,
            error: (error as Error).message
          }, error as Error);
        }

        wrappedCallback(error, null);
      }
    });
  };
}

export function createFastifyPlugin(logger: Logger) {
  return async function fastifyLogger(fastify: any) {
    fastify.addHook('onRequest', async (request: any) => {
      const startTime = Date.now();
      const requestId = request.headers['x-request-id'] || generateRequestId();
      const traceId = request.headers['x-trace-id'] || generateTraceId();
      
      request.requestId = requestId;
      request.traceId = traceId;
      request.startTime = startTime;
      
      const context: LogContext = {
        request_id: requestId,
        trace_id: traceId,
        method: request.method,
        url: request.url,
        user_agent: request.headers['user-agent'],
        ip_address: request.ip
      };

      logger.runInContext(context, () => {
        logger.info('Fastify request started', context);
      });
    });

    fastify.addHook('onResponse', async (request: any, reply: any) => {
      const duration = Date.now() - request.startTime;
      
      const context: LogContext = {
        request_id: request.requestId,
        trace_id: request.traceId,
        method: request.method,
        url: request.url,
        status_code: reply.statusCode,
        duration_ms: duration
      };

      logger.runInContext(context, () => {
        if (reply.statusCode >= 400) {
          logger.warn('Fastify request completed with error', context);
        } else {
          logger.info('Fastify request completed', context);
        }
      });
    });

    fastify.addHook('onError', async (request: any, _reply: any, error: Error) => {
      const duration = Date.now() - request.startTime;
      
      const context: LogContext = {
        request_id: request.requestId,
        trace_id: request.traceId,
        method: request.method,
        url: request.url,
        duration_ms: duration,
        error: error.message
      };

      logger.runInContext(context, () => {
        logger.error('Fastify request error', context, error);
      });
    });
  };
}

function sanitizeObject(obj: any, sensitiveFields: string[] = []): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, sensitiveFields));
  }

  const sanitized = { ...obj };
  
  for (const field of sensitiveFields) {
    if (field.toLowerCase() in sanitized) {
      sanitized[field.toLowerCase()] = '[REDACTED]';
    }
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key], sensitiveFields);
    }
  });

  return sanitized;
}

function generateRequestId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function generateTraceId(): string {
  return Math.random().toString(36).substr(2, 16);
}