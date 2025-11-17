/**
 * Network Utilities for Enhanced Error Handling and Resilience
 * Provides retry mechanisms, connection monitoring, and network status detection
 */

import React from 'react';
import { enhanceError, EnhancedError, ErrorCategory, ErrorSeverity } from '../types/errors';

// Configuration
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  retryableErrors: ErrorCategory[];
}

export interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
  retryableErrors: [
    ErrorCategory.NETWORK,
    ErrorCategory.TIMEOUT,
    ErrorCategory.API,
    ErrorCategory.WEBSOCKET
  ]
};

// Network status monitoring
class NetworkMonitor {
  private listeners: ((status: NetworkStatus) => void)[] = [];
  private currentStatus: NetworkStatus;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.currentStatus = this.getCurrentStatus();
    this.startMonitoring();
  }

  private getCurrentStatus(): NetworkStatus {
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    return {
      isOnline: navigator.onLine,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false
    };
  }

  private startMonitoring() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleNetworkChange.bind(this));
    window.addEventListener('offline', this.handleNetworkChange.bind(this));

    // Listen for connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', this.handleNetworkChange.bind(this));
    }

    // Poll for network status changes
    this.monitoringInterval = setInterval(() => {
      const newStatus = this.getCurrentStatus();
      if (JSON.stringify(newStatus) !== JSON.stringify(this.currentStatus)) {
        this.currentStatus = newStatus;
        this.notifyListeners();
      }
    }, 5000);
  }

  private handleNetworkChange() {
    this.currentStatus = this.getCurrentStatus();
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentStatus));
  }

  public addListener(listener: (status: NetworkStatus) => void) {
    this.listeners.push(listener);
    // Immediately notify new listener of current status
    listener(this.currentStatus);
  }

  public removeListener(listener: (status: NetworkStatus) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  public getStatus(): NetworkStatus {
    return this.currentStatus;
  }

  public stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    window.removeEventListener('online', this.handleNetworkChange.bind(this));
    window.removeEventListener('offline', this.handleNetworkChange.bind(this));
  }
}

// Global network monitor instance
export const networkMonitor = new NetworkMonitor();

// Retry mechanism with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: (error: EnhancedError, attempt: number) => void
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: EnhancedError;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      const result = await operation();
      // If successful, return the result
      return result;
    } catch (error) {
      lastError = enhanceError(error);

      // Don't retry if this is the last attempt or error is not retryable
      if (attempt === finalConfig.maxRetries ||
          !finalConfig.retryableErrors.includes(lastError.category)) {
        throw lastError;
      }

      // Calculate delay with exponential backoff and jitter
      let delay = finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt);
      delay = Math.min(delay, finalConfig.maxDelay);

      if (finalConfig.jitter) {
        // Add random jitter to prevent thundering herd
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      // Notify about retry attempt
      onRetry?.(lastError, attempt + 1);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError!;
}

// Circuit breaker pattern for preventing cascade failures
export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

export enum CircuitState {
  CLOSED = 'closed',      // Normal operation
  OPEN = 'open',          // Failing, reject calls
  HALF_OPEN = 'half_open' // Testing if service recovered
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const now = Date.now();

    switch (this.state) {
      case CircuitState.OPEN:
        // Check if we should try to recover
        if (now - this.lastFailureTime >= this.config.recoveryTimeout) {
          this.state = CircuitState.HALF_OPEN;
          this.successCount = 0;
        } else {
          throw enhanceError('Circuit breaker is OPEN');
        }
        break;

      case CircuitState.HALF_OPEN:
        // Allow a few requests to test recovery
        if (this.successCount >= 3) {
          this.state = CircuitState.CLOSED;
          this.failures = 0;
        }
        break;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
    } else {
      this.failures = 0;
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN ||
        this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failures;
  }
}

// Request timeout wrapper
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);
    })
  ]);
}

// Network status utility functions
export function isOnline(): boolean {
  return navigator.onLine;
}

export function getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
  const status = networkMonitor.getStatus();

  if (!status.isOnline) return 'poor';

  const connection = (navigator as any).connection;
  if (!connection) return 'good'; // Assume good if no connection info

  const { effectiveType, rtt, downlink } = connection;

  if (effectiveType === '4g' && rtt < 100 && downlink > 2) return 'excellent';
  if (effectiveType === '4g' || rtt < 200) return 'good';
  if (effectiveType === '3g' || rtt < 300) return 'fair';
  return 'poor';
}

// Debounced function for preventing duplicate requests
export function createDebouncedFunction<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    lastArgs = args;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (lastArgs) {
        func(...lastArgs);
      }
      timeoutId = null;
      lastArgs = null;
    }, delay);
  };
}

// Request deduplication for identical in-flight requests
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async execute<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    // If request is already in flight, return the existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Create and store the new request
    const promise = operation().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

export const requestDeduplicator = new RequestDeduplicator();

// Utility to create cache key from text input
export function createTextCacheKey(text: string): string {
  // Normalize text for caching: lowercase, trim, extra spaces
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Error recovery suggestions based on error type
export function getRecoverySuggestion(error: EnhancedError): string {
  switch (error.category) {
    case ErrorCategory.NETWORK:
      return 'Check your internet connection and try again.';

    case ErrorCategory.WEBSOCKET:
      return 'Make sure your microphone is connected and you have granted permission.';

    case ErrorCategory.API:
      if (error.severity === ErrorSeverity.HIGH) {
        return 'The analysis service is temporarily unavailable. Please try again in a few minutes.';
      }
      return 'There was an issue processing your request. Retrying...';

    case ErrorCategory.TIMEOUT:
      return 'The request took too long. This might be due to a slow connection. Retrying...';

    case ErrorCategory.RATE_LIMIT:
      return 'Too many requests. Please wait a moment before trying again.';

    case ErrorCategory.PERMISSION:
      return 'Please check your browser settings and allow the necessary permissions.';

    case ErrorCategory.VALIDATION:
      return 'Please check your input and try again.';

    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

// Export network status hook for React components
export function useNetworkStatus() {
  const [status, setStatus] = React.useState<NetworkStatus>(networkMonitor.getStatus());

  React.useEffect(() => {
    const listener = (newStatus: NetworkStatus) => {
      setStatus(newStatus);
    };

    networkMonitor.addListener(listener);

    return () => {
      networkMonitor.removeListener(listener);
    };
  }, []);

  return status;
}