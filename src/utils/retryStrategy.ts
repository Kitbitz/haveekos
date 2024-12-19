interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: number;
  shouldRetry?: (error: Error) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 2,
  shouldRetry: () => true
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: Error | null = null;
  let currentDelay = opts.delay;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === opts.maxAttempts || !opts.shouldRetry(lastError)) {
        break;
      }

      console.log(`Retry attempt ${attempt} of ${opts.maxAttempts} after ${currentDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= opts.backoff;
    }
  }

  throw lastError || new Error('Operation failed after multiple attempts');
}