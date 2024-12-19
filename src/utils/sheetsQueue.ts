import { GoogleSheetsError } from './errorHandling';

interface QueueTask {
  id: string;
  execute: () => Promise<void>;
  retryCount: number;
  lastError?: Error;
}

class SheetsQueue {
  private static instance: SheetsQueue;
  private queue: QueueTask[] = [];
  private processing = false;
  private readonly MAX_RETRIES = 5;
  private readonly INITIAL_DELAY = 2000; // 2 seconds
  private readonly MAX_DELAY = 32000; // 32 seconds
  private readonly RATE_LIMIT_DELAY = 60000; // 1 minute for rate limits
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests
  private readonly QUOTA_RESET_DELAY = 100000; // 100 seconds for quota reset

  private constructor() {}

  static getInstance(): SheetsQueue {
    if (!this.instance) {
      this.instance = new SheetsQueue();
    }
    return this.instance;
  }

  async enqueue(id: string, task: () => Promise<void>): Promise<void> {
    const existingTask = this.queue.find(t => t.id === id);
    if (existingTask) {
      console.log(`Task ${id} already queued, skipping duplicate`);
      return;
    }

    this.queue.push({ id, execute: task, retryCount: 0 });
    
    if (!this.processing) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue[0];
      
      try {
        // Ensure minimum time between requests
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
          await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest));
        }

        await this.executeWithTimeout(task);
        this.lastRequestTime = Date.now();
        this.queue.shift();
        console.log(`Task ${task.id} completed successfully`);
      } catch (error) {
        console.error(`Task ${task.id} failed:`, error);
        task.lastError = error instanceof Error ? error : new Error(String(error));
        
        if (task.retryCount < this.MAX_RETRIES) {
          task.retryCount++;
          this.queue.shift();
          this.queue.push(task);
          
          let delay = Math.min(
            this.INITIAL_DELAY * Math.pow(2, task.retryCount - 1),
            this.MAX_DELAY
          );

          // Handle rate limit errors
          if (error instanceof GoogleSheetsError && error.code === '429') {
            delay = task.retryCount === 1 ? this.RATE_LIMIT_DELAY : this.QUOTA_RESET_DELAY;
            console.log(`Rate limit hit, waiting ${delay/1000} seconds before retry`);
          }

          console.log(`Retrying task ${task.id} in ${delay}ms (attempt ${task.retryCount})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          this.queue.shift();
          const finalError = new GoogleSheetsError(
            `Failed to process task ${task.id} after ${this.MAX_RETRIES} attempts: ${task.lastError?.message}`,
            task.lastError instanceof GoogleSheetsError ? task.lastError.code : undefined
          );
          finalError.cause = task.lastError;
          console.error('Final error:', finalError);
          throw finalError;
        }
      }
    }

    this.processing = false;
  }

  private async executeWithTimeout(task: QueueTask, timeout: number = 30000): Promise<void> {
    return Promise.race([
      task.execute(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new GoogleSheetsError('Operation timed out', 'TIMEOUT'));
        }, timeout);
      })
    ]);
  }

  clearQueue(): void {
    this.queue = [];
    this.processing = false;
  }

  getQueueStatus(): { queueLength: number; processing: boolean } {
    return {
      queueLength: this.queue.length,
      processing: this.processing
    };
  }
}

export default SheetsQueue;