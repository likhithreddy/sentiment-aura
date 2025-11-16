/**
 * Error Recovery Utilities for Sentiment Aura
 * Provides automated error recovery strategies and user guidance
 */

import { EnhancedError, ErrorCategory, ErrorSeverity } from '../types/errors';

export interface RecoveryAction {
  type: 'retry' | 'reconnect' | 'fallback' | 'user_action' | 'ignore';
  label: string;
  action?: () => Promise<void> | void;
  automatic?: boolean;
  delay?: number;
  priority: number; // 1-10, lower is higher priority
}

export interface RecoveryStrategy {
  errorType: ErrorCategory;
  severity: ErrorSeverity;
  actions: RecoveryAction[];
  maxRetries: number;
  backoffMultiplier: number;
  timeout: number;
}

export class ErrorRecoveryManager {
  private strategies: Map<string, RecoveryStrategy> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private activeRecoveries: Set<string> = new Set();

  constructor() {
    this.initializeDefaultStrategies();
  }

  /**
   * Initialize default recovery strategies for common error types
   */
  private initializeDefaultStrategies(): void {
    // Network errors - retry with exponential backoff
    this.strategies.set('network_high', {
      errorType: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      actions: [
        {
          type: 'retry',
          label: 'Retry Connection',
          automatic: true,
          delay: 2000,
          priority: 1,
          action: async () => {
            console.log('🔄 Auto-retrying network connection...');
          }
        },
        {
          type: 'user_action',
          label: 'Check Internet Connection',
          automatic: false,
          priority: 2,
          action: () => {
            console.log('💡 User guidance: Check your internet connection');
          }
        }
      ],
      maxRetries: 3,
      backoffMultiplier: 2,
      timeout: 30000
    });

    // WebSocket errors - reconnection with user guidance
    this.strategies.set('websocket_high', {
      errorType: ErrorCategory.WEBSOCKET,
      severity: ErrorSeverity.HIGH,
      actions: [
        {
          type: 'reconnect',
          label: 'Reconnect Microphone',
          automatic: true,
          delay: 3000,
          priority: 1,
          action: async () => {
            console.log('🎤 Auto-reconnecting microphone...');
          }
        },
        {
          type: 'user_action',
          label: 'Check Microphone Permissions',
          automatic: false,
          priority: 2,
          action: () => {
            console.log('💡 User guidance: Check microphone permissions in browser settings');
          }
        }
      ],
      maxRetries: 5,
      backoffMultiplier: 1.5,
      timeout: 45000
    });

    // API errors - retry with timeout handling
    this.strategies.set('api_medium', {
      errorType: ErrorCategory.API,
      severity: ErrorSeverity.MEDIUM,
      actions: [
        {
          type: 'retry',
          label: 'Retry Analysis',
          automatic: true,
          delay: 1500,
          priority: 1,
          action: async () => {
            console.log('🤖 Auto-retrying sentiment analysis...');
          }
        },
        {
          type: 'fallback',
          label: 'Use Cached Response',
          automatic: true,
          delay: 0,
          priority: 2,
          action: () => {
            console.log('💾 Using cached response as fallback...');
          }
        }
      ],
      maxRetries: 2,
      backoffMultiplier: 1.5,
      timeout: 20000
    });

    // Rate limit errors - wait and retry
    this.strategies.set('rate_limit_medium', {
      errorType: ErrorCategory.RATE_LIMIT,
      severity: ErrorSeverity.MEDIUM,
      actions: [
        {
          type: 'retry',
          label: 'Wait and Retry',
          automatic: true,
          delay: 5000,
          priority: 1,
          action: async () => {
            console.log('⏳ Waiting for rate limit to reset...');
          }
        }
      ],
      maxRetries: 1,
      backoffMultiplier: 1,
      timeout: 60000
    });

    // Timeout errors - retry with extended timeout
    this.strategies.set('timeout_medium', {
      errorType: ErrorCategory.TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      actions: [
        {
          type: 'retry',
          label: 'Retry with Extended Timeout',
          automatic: true,
          delay: 1000,
          priority: 1,
          action: async () => {
            console.log('⏱️ Retrying with extended timeout...');
          }
        }
      ],
      maxRetries: 2,
      backoffMultiplier: 2,
      timeout: 45000
    });
  }

  /**
   * Get recovery strategy for an error
   */
  public getStrategy(error: EnhancedError): RecoveryStrategy | null {
    const key = `${error.category}_${error.severity}`;
    return this.strategies.get(key) || null;
  }

  /**
   * Execute recovery actions for an error
   */
  public async executeRecovery(
    error: EnhancedError,
    context: string = '',
    customActions?: RecoveryAction[]
  ): Promise<boolean> {
    const errorKey = `${error.category}_${error.severity}_${context}`;

    // Prevent concurrent recovery for same error
    if (this.activeRecoveries.has(errorKey)) {
      console.log('⏳ Recovery already in progress for error:', errorKey);
      return false;
    }

    const strategy = this.getStrategy(error);
    const actions = customActions || strategy?.actions || error.recoveryActions;

    if (!actions || actions.length === 0) {
      console.log('❌ No recovery actions available for error:', error.category);
      return false;
    }

    this.activeRecoveries.add(errorKey);

    try {
      // Sort actions by priority (lower number = higher priority)
      const sortedActions = actions.sort((a, b) => a.priority - b.priority);

      console.log(`🔧 Executing ${sortedActions.length} recovery actions for ${error.category} error`);

      for (const action of sortedActions) {
        try {
          // Check retry limit
          if (action.type === 'retry' || action.type === 'reconnect') {
            const retryKey = `${errorKey}_${action.type}`;
            const currentAttempts = this.retryAttempts.get(retryKey) || 0;
            const maxRetries = strategy?.maxRetries || 3;

            if (currentAttempts >= maxRetries) {
              console.log(`⛔ Max retries reached for ${action.type}: ${currentAttempts}/${maxRetries}`);
              continue;
            }

            this.retryAttempts.set(retryKey, currentAttempts + 1);
          }

          // Execute delay if specified
          if (action.delay && action.delay > 0) {
            console.log(`⏳ Waiting ${action.delay}ms before executing ${action.type}...`);
            await new Promise(resolve => setTimeout(resolve, action.delay));
          }

          // Execute the action
          if (action.action) {
            console.log(`🎯 Executing recovery action: ${action.label}`);
            await action.action();
          }

          // If automatic action succeeded, return success
          if (action.automatic) {
            console.log(`✅ Automatic recovery action completed: ${action.label}`);
            return true;
          }

        } catch (actionError) {
          console.error(`❌ Recovery action failed: ${action.label}`, actionError);

          // Continue with next action for non-critical errors
          if (error.severity === ErrorSeverity.CRITICAL) {
            break;
          }
        }
      }

      console.log(`🏁 Recovery execution completed for ${error.category} error`);
      return true;

    } catch (recoveryError) {
      console.error('❌ Recovery process failed:', recoveryError);
      return false;

    } finally {
      this.activeRecoveries.delete(errorKey);
    }
  }

  /**
   * Reset retry counters
   */
  public resetRetries(errorType?: string): void {
    if (errorType) {
      // Reset specific error type
      for (const [key] of this.retryAttempts.entries()) {
        if (key.includes(errorType)) {
          this.retryAttempts.delete(key);
        }
      }
    } else {
      // Reset all retries
      this.retryAttempts.clear();
    }
    console.log('🔄 Retry counters reset');
  }

  /**
   * Get user-friendly guidance for error
   */
  public getUserGuidance(error: EnhancedError): string {
    switch (error.category) {
      case ErrorCategory.NETWORK:
        return 'Check your internet connection and try again. Make sure you\'re connected to a stable network.';

      case ErrorCategory.WEBSOCKET:
        return 'There seems to be an issue with the microphone connection. Please check if your microphone is connected and you have granted permission to use it.';

      case ErrorCategory.API:
        if (error.severity === ErrorSeverity.HIGH) {
          return 'The sentiment analysis service is temporarily unavailable. This usually resolves within a few minutes. You can try again in a moment.';
        }
        return 'There was an issue analyzing your speech. The system will try again automatically.';

      case ErrorCategory.TIMEOUT:
        return 'The request took too long to complete. This might be due to a slow connection. The system will retry with a longer timeout.';

      case ErrorCategory.RATE_LIMIT:
        return 'You\'ve made too many requests in a short time. Please wait a moment before trying again. The system will retry automatically.';

      case ErrorCategory.PERMISSION:
        return 'Please check your browser settings and make sure you have allowed microphone access for this website.';

      case ErrorCategory.VALIDATION:
        return 'Please try speaking clearly and ensure there\'s some sound being detected by your microphone.';

      default:
        return error.userMessage || 'An unexpected error occurred. Please try refreshing the page.';
    }
  }

  /**
   * Get recovery statistics
   */
  public getStats(): {
    activeRecoveries: number;
    retryAttempts: number;
    configuredStrategies: number;
  } {
    return {
      activeRecoveries: this.activeRecoveries.size,
      retryAttempts: this.retryAttempts.size,
      configuredStrategies: this.strategies.size
    };
  }

  /**
   * Add custom recovery strategy
   */
  public addStrategy(key: string, strategy: RecoveryStrategy): void {
    this.strategies.set(key, strategy);
    console.log(`📝 Added custom recovery strategy: ${key}`);
  }

  /**
   * Create user-friendly error message
   */
  public formatErrorMessage(error: EnhancedError, includeGuidance: boolean = true): string {
    let message = error.userMessage;

    if (includeGuidance) {
      const guidance = this.getUserGuidance(error);
      message = `${message} ${guidance}`;
    }

    return message;
  }
}

// Global error recovery manager instance
export const errorRecovery = new ErrorRecoveryManager();

// Utility functions
export const createRetryAction = (
  label: string,
  retryFunction: () => Promise<void>,
  delay: number = 1000,
  priority: number = 1
): RecoveryAction => ({
  type: 'retry',
  label,
  action: retryFunction,
  automatic: true,
  delay,
  priority
});

export const createUserAction = (
  label: string,
  actionFunction: () => void,
  priority: number = 2
): RecoveryAction => ({
  type: 'user_action',
  label,
  action: actionFunction,
  automatic: false,
  priority
});

export const createFallbackAction = (
  label: string,
  fallbackFunction: () => void,
  priority: number = 3
): RecoveryAction => ({
  type: 'fallback',
  label,
  action: fallbackFunction,
  automatic: true,
  delay: 0,
  priority
});

// Error recovery hook for React components
export const useErrorRecovery = () => {
  const executeRecovery = async (error: EnhancedError, context?: string) => {
    return await errorRecovery.executeRecovery(error, context);
  };

  const getGuidance = (error: EnhancedError) => {
    return errorRecovery.getUserGuidance(error);
  };

  const formatMessage = (error: EnhancedError) => {
    return errorRecovery.formatErrorMessage(error);
  };

  return {
    executeRecovery,
    getGuidance,
    formatMessage
  };
};