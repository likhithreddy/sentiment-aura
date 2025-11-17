/**
 * Enhanced Error Types for Sentiment Aura
 * Provides specific error categorization and recovery strategies
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  API = 'api',
  WEBSOCKET = 'websocket',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit'
}

export interface RecoveryAction {
  type: 'retry' | 'reconnect' | 'fallback' | 'user_action' | 'ignore';
  label: string;
  action?: () => void;
  automatic?: boolean;
  delay?: number;
}

export interface EnhancedError {
  name: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  originalError?: Error;
  timestamp: number;
  retryable: boolean;
  recoveryActions: RecoveryAction[];
  userMessage: string;
  technicalDetails?: string;
}

// Network Error Classes
export class NetworkError extends Error {
  public readonly category = ErrorCategory.NETWORK;
  public readonly severity = ErrorSeverity.MEDIUM;
  public readonly retryable = true;

  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }

  toEnhanced(): EnhancedError {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      originalError: this.originalError,
      timestamp: Date.now(),
      retryable: this.retryable,
      recoveryActions: [
        {
          type: 'retry',
          label: 'Retry Connection',
          automatic: true,
          delay: 2000
        }
      ],
      userMessage: 'Network connection issue. Attempting to reconnect...',
      technicalDetails: this.originalError?.message
    };
  }
}

export class WebSocketError extends Error {
  public readonly category = ErrorCategory.WEBSOCKET;
  public readonly severity = ErrorSeverity.HIGH;
  public readonly retryable = true;

  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'WebSocketError';
  }

  toEnhanced(): EnhancedError {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      originalError: this.originalError,
      timestamp: Date.now(),
      retryable: this.retryable,
      recoveryActions: [
        {
          type: 'reconnect',
          label: 'Reconnect Microphone',
          automatic: true,
          delay: 3000
        },
        {
          type: 'user_action',
          label: 'Check Microphone Permissions',
          automatic: false
        }
      ],
      userMessage: 'Speech recognition connection lost. Reconnecting...',
      technicalDetails: this.originalError?.message
    };
  }
}

export class APIError extends Error {
  public readonly category = ErrorCategory.API;
  public readonly retryable: boolean;

  constructor(
    message: string,
    public readonly statusCode: number = 0,
    public readonly originalError?: Error,
    retryable: boolean = true
  ) {
    super(message);
    this.name = 'APIError';
    this.retryable = retryable && statusCode >= 500; // Only retry server errors
  }

  toEnhanced(): EnhancedError {
    const severity = this.statusCode >= 500 ? ErrorSeverity.HIGH :
                    this.statusCode >= 400 ? ErrorSeverity.MEDIUM :
                    ErrorSeverity.LOW;

    const userMessage = this.statusCode >= 500 ?
      'Analysis service temporarily unavailable. Trying alternative approach...' :
      this.statusCode >= 429 ?
      'Too many requests. Please wait a moment...' :
      'Analysis request failed. Retrying...';

    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity,
      originalError: this.originalError,
      timestamp: Date.now(),
      retryable: this.retryable,
      recoveryActions: [
        {
          type: 'retry',
          label: 'Retry Analysis',
          automatic: this.retryable,
          delay: this.statusCode === 429 ? 5000 : 2000
        }
      ],
      userMessage,
      technicalDetails: `HTTP ${this.statusCode}: ${this.originalError?.message || this.message}`
    };
  }
}

export class TimeoutError extends Error {
  public readonly category = ErrorCategory.TIMEOUT;
  public readonly severity = ErrorSeverity.MEDIUM;
  public readonly retryable = true;

  constructor(message: string, public readonly timeoutMs: number, public readonly originalError?: Error) {
    super(message);
    this.name = 'TimeoutError';
  }

  toEnhanced(): EnhancedError {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      originalError: this.originalError,
      timestamp: Date.now(),
      retryable: this.retryable,
      recoveryActions: [
        {
          type: 'retry',
          label: 'Retry with Extended Timeout',
          automatic: true,
          delay: 1000
        }
      ],
      userMessage: 'Request took too long. Retrying with extended timeout...',
      technicalDetails: `Timeout after ${this.timeoutMs}ms: ${this.originalError?.message}`
    };
  }
}

export class RateLimitError extends Error {
  public readonly category = ErrorCategory.RATE_LIMIT;
  public readonly severity = ErrorSeverity.MEDIUM;
  public readonly retryable = true;

  constructor(
    message: string,
    public readonly retryAfter: number = 5000,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'RateLimitError';
  }

  toEnhanced(): EnhancedError {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      originalError: this.originalError,
      timestamp: Date.now(),
      retryable: this.retryable,
      recoveryActions: [
        {
          type: 'retry',
          label: 'Retry After Delay',
          automatic: true,
          delay: this.retryAfter
        }
      ],
      userMessage: `Rate limit reached. Retrying in ${Math.ceil(this.retryAfter / 1000)} seconds...`,
      technicalDetails: `Rate limited for ${this.retryAfter}ms: ${this.originalError?.message}`
    };
  }
}

export class ValidationError extends Error {
  public readonly category = ErrorCategory.VALIDATION;
  public readonly severity = ErrorSeverity.LOW;
  public readonly retryable = false;

  constructor(message: string, public readonly field?: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'ValidationError';
  }

  toEnhanced(): EnhancedError {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      originalError: this.originalError,
      timestamp: Date.now(),
      retryable: this.retryable,
      recoveryActions: [
        {
          type: 'user_action',
          label: 'Check Input',
          automatic: false
        }
      ],
      userMessage: 'Please check your input and try again.',
      technicalDetails: this.field ? `Field '${this.field}': ${this.originalError?.message}` : this.originalError?.message
    };
  }
}

// Utility function to convert any error to EnhancedError
export function enhanceError(error: Error | string | unknown): EnhancedError {
  if (error instanceof NetworkError || error instanceof WebSocketError ||
      error instanceof APIError || error instanceof TimeoutError ||
      error instanceof RateLimitError || error instanceof ValidationError) {
    return error.toEnhanced();
  }

  // Handle axios errors
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as any;
    const statusCode = axiosError.response?.status || 0;
    const message = axiosError.message || 'Unknown API error';

    const apiError = new APIError(message, statusCode, axiosError);
    return apiError.toEnhanced();
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      name: 'GenericError',
      message: error,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      timestamp: Date.now(),
      retryable: true,
      recoveryActions: [
        {
          type: 'retry',
          label: 'Retry',
          automatic: true,
          delay: 2000
        }
      ],
      userMessage: 'Something went wrong. Retrying...'
    };
  }

  // Handle generic Error objects
  if (error instanceof Error) {
    return {
      name: error.name || 'GenericError',
      message: error.message || 'Unknown error occurred',
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      originalError: error,
      timestamp: Date.now(),
      retryable: true,
      recoveryActions: [
        {
          type: 'retry',
          label: 'Retry',
          automatic: true,
          delay: 2000
        }
      ],
      userMessage: 'An unexpected error occurred. Retrying...',
      technicalDetails: error.stack
    };
  }

  // Fallback
  return {
    name: 'UnknownError',
    message: 'An unknown error occurred',
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    timestamp: Date.now(),
    retryable: false,
    recoveryActions: [
      {
        type: 'user_action',
        label: 'Refresh Page',
        automatic: false
      }
    ],
    userMessage: 'Something went wrong. Please try refreshing the page.'
  };
}