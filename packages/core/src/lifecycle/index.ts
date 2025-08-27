import { EventBus } from '../events/index.js';
import { LifecycleOptions, LifecycleHook, AsyncHandler, ERROR, LIFECYCLE_STARTING, LIFECYCLE_STARTED, LIFECYCLE_STOPPING, LIFECYCLE_STOPPED, LIFECYCLE_STATE_CHANGED, LIFECYCLE_HOOK_EXECUTING, LIFECYCLE_HOOK_EXECUTED, LIFECYCLE_HOOK_ERROR } from '../types/index.js';
import { SkerError, ErrorCodes } from '../errors/index.js';

export enum LifecycleState {
  CREATED = 'created',
  STARTING = 'starting',
  STARTED = 'started',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error'
}

export class LifecycleManager extends EventBus {
  private state: LifecycleState = LifecycleState.CREATED;
  private readonly startHooks: LifecycleHook[] = [];
  private readonly stopHooks: LifecycleHook[] = [];
  private readonly options: LifecycleOptions;
  private startPromise?: Promise<void>;
  private stopPromise?: Promise<void>;

  constructor(options: LifecycleOptions = {}) {
    super();
    this.options = {
      startTimeout: 30000,
      stopTimeout: 10000,
      gracefulShutdown: true,
      ...options
    };

    if (this.options.gracefulShutdown) {
      this.setupGracefulShutdown();
    }
  }

  public get currentState(): LifecycleState {
    return this.state;
  }

  public get isStarted(): boolean {
    return this.state === LifecycleState.STARTED;
  }

  public get isStopped(): boolean {
    return this.state === LifecycleState.STOPPED;
  }

  public get isStarting(): boolean {
    return this.state === LifecycleState.STARTING;
  }

  public get isStopping(): boolean {
    return this.state === LifecycleState.STOPPING;
  }

  public onStart(handler: AsyncHandler, options?: { name?: string; timeout?: number }): void {
    if (typeof handler !== 'function') {
      throw new SkerError(ErrorCodes.INITIALIZATION_FAILED, 'Start handler must be a function');
    }

    this.startHooks.push({
      handler,
      name: options?.name || undefined,
      timeout: options?.timeout || this.options.startTimeout
    });
  }

  public onStop(handler: AsyncHandler, options?: { name?: string; timeout?: number }): void {
    if (typeof handler !== 'function') {
      throw new SkerError(ErrorCodes.INITIALIZATION_FAILED, 'Stop handler must be a function');
    }

    this.stopHooks.unshift({
      handler,
      name: options?.name || undefined,
      timeout: options?.timeout || this.options.stopTimeout
    });
  }

  public async start(): Promise<void> {
    if (this.state === LifecycleState.STARTED) {
      return;
    }

    if (this.state === LifecycleState.STARTING) {
      return this.startPromise;
    }

    if (this.state !== LifecycleState.CREATED && this.state !== LifecycleState.STOPPED) {
      throw new SkerError(
        ErrorCodes.START_FAILED,
        `Cannot start from state: ${this.state}`
      );
    }

    this.startPromise = this.doStart();
    return this.startPromise;
  }

  public async stop(): Promise<void> {
    if (this.state === LifecycleState.STOPPED) {
      return;
    }

    if (this.state === LifecycleState.STOPPING) {
      return this.stopPromise;
    }

    if (this.state !== LifecycleState.STARTED) {
      throw new SkerError(
        ErrorCodes.STOP_FAILED,
        `Cannot stop from state: ${this.state}`
      );
    }

    this.stopPromise = this.doStop();
    return this.stopPromise;
  }

  public async restart(): Promise<void> {
    if (this.isStarted) {
      await this.stop();
    }
    await this.start();
  }

  public removeStartHook(name: string): boolean {
    const index = this.startHooks.findIndex(hook => hook.name === name);
    if (index >= 0) {
      this.startHooks.splice(index, 1);
      return true;
    }
    return false;
  }

  public removeStopHook(name: string): boolean {
    const index = this.stopHooks.findIndex(hook => hook.name === name);
    if (index >= 0) {
      this.stopHooks.splice(index, 1);
      return true;
    }
    return false;
  }

  private async doStart(): Promise<void> {
    try {
      this.setState(LifecycleState.STARTING);
      this.emit(LIFECYCLE_STARTING, {});

      for (const hook of this.startHooks) {
        await this.executeHook(hook, 'start');
      }

      this.setState(LifecycleState.STARTED);
      this.emit(LIFECYCLE_STARTED, {});
    } catch (error) {
      this.setState(LifecycleState.ERROR);
      this.emit(ERROR, { error, event: LIFECYCLE_STARTING });
      
      throw new SkerError(
        ErrorCodes.START_FAILED,
        'Failed to start lifecycle',
        { state: this.state },
        error as Error
      );
    }
  }

  private async doStop(): Promise<void> {
    try {
      this.setState(LifecycleState.STOPPING);
      this.emit(LIFECYCLE_STOPPING, {});

      for (const hook of this.stopHooks) {
        await this.executeHook(hook, 'stop');
      }

      this.setState(LifecycleState.STOPPED);
      this.emit(LIFECYCLE_STOPPED, {});
    } catch (error) {
      this.setState(LifecycleState.ERROR);
      this.emit(ERROR, { error, event: LIFECYCLE_STOPPING });
      
      throw new SkerError(
        ErrorCodes.STOP_FAILED,
        'Failed to stop lifecycle',
        { state: this.state },
        error as Error
      );
    }
  }

  private async executeHook(hook: LifecycleHook, phase: 'start' | 'stop'): Promise<void> {
    const hookName = hook.name || `anonymous-${phase}-hook`;
    const timeout = hook.timeout || (phase === 'start' ? this.options.startTimeout : this.options.stopTimeout);

    try {
      this.emit(LIFECYCLE_HOOK_EXECUTING, { name: hookName, phase });
      
      await Promise.race([
        hook.handler(),
        this.createTimeoutPromise(timeout!, hookName, phase)
      ]);

      this.emit(LIFECYCLE_HOOK_EXECUTED, { name: hookName, phase });
    } catch (error) {
      this.emit(LIFECYCLE_HOOK_ERROR, { name: hookName, phase, error });
      throw new SkerError(
        phase === 'start' ? ErrorCodes.START_FAILED : ErrorCodes.STOP_FAILED,
        `${phase} hook "${hookName}" failed`,
        { hookName, phase, timeout },
        error as Error
      );
    }
  }

  private createTimeoutPromise(timeout: number, hookName: string, phase: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new SkerError(
          phase === 'start' ? ErrorCodes.START_FAILED : ErrorCodes.STOP_FAILED,
          `${phase} hook "${hookName}" timed out after ${timeout}ms`
        ));
      }, timeout);
    });
  }

  private setState(newState: LifecycleState): void {
    const oldState = this.state;
    this.state = newState;
    this.emit(LIFECYCLE_STATE_CHANGED, { oldState, newState });
  }

  private setupGracefulShutdown(): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Starting graceful shutdown...`);
      
      try {
        await this.stop();
        console.log('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('Graceful shutdown failed:', error);
        process.exit(1);
      }
    };

    signals.forEach(signal => {
      process.on(signal, () => shutdown(signal));
    });

    process.on('uncaughtException', async (error) => {
      console.error('Uncaught exception:', error);
      try {
        await this.stop();
      } catch (stopError) {
        console.error('Failed to stop gracefully after uncaught exception:', stopError);
      }
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason) => {
      console.error('Unhandled rejection:', reason);
      try {
        await this.stop();
      } catch (stopError) {
        console.error('Failed to stop gracefully after unhandled rejection:', stopError);
      }
      process.exit(1);
    });
  }
}