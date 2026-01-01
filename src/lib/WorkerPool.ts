/**
 * WorkerPool.ts
 * Manages a pool of reusable Web Workers for script execution.
 * Reduces overhead from creating/destroying workers on each execution.
 */

import { ExecutionContextData, WorkerRequest, WorkerResponse } from './WorkerTypes';
import ScriptWorker from './worker?worker';

interface PendingTask {
  script: string;
  context: ExecutionContextData;
  onInfo?: (msg: string) => void;
  resolve: (result: ExecutionContextData) => void;
  reject: (error: Error) => void;
}

interface WorkerState {
  worker: Worker;
  busy: boolean;
  currentTask: PendingTask | null;
  timeoutId: ReturnType<typeof setTimeout> | null;
}

const POOL_SIZE = 2;
const EXECUTION_TIMEOUT = 5000; // 5 seconds

class WorkerPool {
  private workers: WorkerState[] = [];
  private queue: PendingTask[] = [];
  private initialized = false;

  /**
   * Initialize the worker pool with pre-created workers
   */
  private initialize(): void {
    if (this.initialized) return;

    for (let i = 0; i < POOL_SIZE; i++) {
      this.addWorker();
    }
    this.initialized = true;
  }

  /**
   * Create and add a new worker to the pool
   */
  private addWorker(): WorkerState {
    const worker = new ScriptWorker();
    const state: WorkerState = {
      worker,
      busy: false,
      currentTask: null,
      timeoutId: null,
    };

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      this.handleWorkerMessage(state, e.data);
    };

    worker.onerror = (err: ErrorEvent) => {
      this.handleWorkerError(state, err);
    };

    this.workers.push(state);
    return state;
  }

  /**
   * Handle messages from worker
   */
  private handleWorkerMessage(state: WorkerState, response: WorkerResponse): void {
    const task = state.currentTask;
    if (!task) return;

    if (response.type === 'SUCCESS') {
      this.clearTimeout(state);
      task.resolve(response.payload);
      this.releaseWorker(state);
    } else if (response.type === 'ERROR') {
      this.clearTimeout(state);
      task.reject(new Error(response.error));
      this.releaseWorker(state);
    } else if (response.type === 'INFO') {
      task.onInfo?.(response.message);
    }
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(state: WorkerState, err: ErrorEvent): void {
    const task = state.currentTask;
    this.clearTimeout(state);

    if (task) {
      task.reject(new Error(err.message || 'Worker error'));
    }

    // Replace the broken worker
    this.replaceWorker(state);
  }

  /**
   * Handle execution timeout
   */
  private handleTimeout(state: WorkerState): void {
    const task = state.currentTask;
    if (task) {
      task.reject(new Error('Script execution timed out (5s limit).'));
    }

    // Replace the timed-out worker (it may be stuck in infinite loop)
    this.replaceWorker(state);
  }

  /**
   * Replace a worker that errored or timed out
   */
  private replaceWorker(state: WorkerState): void {
    // Terminate the old worker
    state.worker.terminate();

    // Remove from pool
    const index = this.workers.indexOf(state);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }

    // Add a fresh worker
    const newState = this.addWorker();

    // Process next task if any
    this.processQueue(newState);
  }

  /**
   * Clear timeout for a worker state
   */
  private clearTimeout(state: WorkerState): void {
    if (state.timeoutId) {
      clearTimeout(state.timeoutId);
      state.timeoutId = null;
    }
  }

  /**
   * Release worker back to the pool
   */
  private releaseWorker(state: WorkerState): void {
    state.busy = false;
    state.currentTask = null;
    this.processQueue(state);
  }

  /**
   * Process next task in queue with available worker
   */
  private processQueue(state?: WorkerState): void {
    if (this.queue.length === 0) return;

    const availableWorker = state?.busy === false ? state : this.workers.find((w) => !w.busy);

    if (!availableWorker) return;

    const task = this.queue.shift();
    if (task) {
      this.executeOnWorker(availableWorker, task);
    }
  }

  /**
   * Execute a task on a specific worker
   */
  private executeOnWorker(state: WorkerState, task: PendingTask): void {
    state.busy = true;
    state.currentTask = task;

    // Set timeout
    state.timeoutId = setTimeout(() => {
      this.handleTimeout(state);
    }, EXECUTION_TIMEOUT);

    // Send execution request
    const request: WorkerRequest = {
      type: 'EXECUTE',
      script: task.script,
      context: task.context,
    };

    state.worker.postMessage(request);
  }

  /**
   * Execute a script using the worker pool
   */
  execute(
    script: string,
    context: ExecutionContextData,
    onInfo?: (msg: string) => void
  ): Promise<ExecutionContextData> {
    // Lazy initialization
    if (!this.initialized) {
      this.initialize();
    }

    return new Promise((resolve, reject) => {
      const task: PendingTask = {
        script,
        context,
        onInfo,
        resolve,
        reject,
      };

      // Find available worker
      const availableWorker = this.workers.find((w) => !w.busy);

      if (availableWorker) {
        this.executeOnWorker(availableWorker, task);
      } else {
        // All workers busy, add to queue
        this.queue.push(task);
      }
    });
  }

  /**
   * Terminate all workers (cleanup)
   */
  terminate(): void {
    for (const state of this.workers) {
      this.clearTimeout(state);
      state.worker.terminate();
    }
    this.workers = [];
    this.queue = [];
    this.initialized = false;
  }
}

// Singleton instance
export const workerPool = new WorkerPool();
