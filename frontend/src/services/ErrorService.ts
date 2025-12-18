/**
 * Centralized Error Service for PilotBA
 * 
 * Provides:
 * - Error capture and normalization
 * - Subscriber notifications for UI updates
 * - Integration with LogStore for persistence
 * - Development-mode console logging
 */

import { PilotBAError, ErrorSeverity, ErrorCategory, ERROR_CODES, createError } from './errorCodes';

type ErrorSubscriber = (error: PilotBAError) => void;

class ErrorService {
  private static instance: ErrorService;
  private subscribers: Set<ErrorSubscriber> = new Set();
  private logStoreRef: {
    addLog?: (error: PilotBAError) => void;
  } = {};

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  /**
   * Set reference to LogStore (called from store initialization)
   */
  setLogStore(addLog: (error: PilotBAError) => void): void {
    this.logStoreRef.addLog = addLog;
  }

  /**
   * Capture and process an error
   */
  capture(
    error: Error | PilotBAError | string,
    context?: Record<string, unknown>
  ): PilotBAError {
    const pilotError = this.normalize(error, context);

    // Log to console in development
    if (import.meta.env.DEV) {
      this.logToConsole(pilotError);
    }

    // Store in LogStore
    if (this.logStoreRef.addLog) {
      this.logStoreRef.addLog(pilotError);
    }

    // Notify subscribers for error/critical severity
    if (pilotError.severity === 'error' || pilotError.severity === 'critical') {
      this.notifySubscribers(pilotError);
    }

    return pilotError;
  }

  /**
   * Capture error from a known error code
   */
  captureCode(
    errorKey: keyof typeof ERROR_CODES,
    context?: Record<string, unknown>,
    technicalDetails?: string
  ): PilotBAError {
    const pilotError = createError(errorKey, context, technicalDetails);
    return this.capture(pilotError);
  }

  /**
   * Log info-level message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.capture({
      id: this.generateId(),
      timestamp: new Date(),
      severity: 'info',
      category: 'unknown',
      code: 'INFO',
      message,
      context,
      recoverable: true,
    });
  }

  /**
   * Log warning-level message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.capture({
      id: this.generateId(),
      timestamp: new Date(),
      severity: 'warning',
      category: 'unknown',
      code: 'WARN',
      message,
      context,
      recoverable: true,
    });
  }

  /**
   * Subscribe to error notifications
   * Returns unsubscribe function
   */
  subscribe(callback: ErrorSubscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Normalize various error types to PilotBAError
   */
  private normalize(
    error: Error | PilotBAError | string,
    context?: Record<string, unknown>
  ): PilotBAError {
    // Already a PilotBAError
    if (this.isPilotBAError(error)) {
      return {
        ...error,
        context: { ...error.context, ...context },
      };
    }

    // String error
    if (typeof error === 'string') {
      return {
        id: this.generateId(),
        timestamp: new Date(),
        severity: 'error',
        category: 'unknown',
        code: 'UNKNOWN',
        message: error,
        context,
        recoverable: true,
      };
    }

    // Standard Error object
    return {
      id: this.generateId(),
      timestamp: new Date(),
      severity: 'error',
      category: this.inferCategory(error),
      code: 'UNKNOWN',
      message: error.message,
      technicalDetails: error.stack,
      context,
      recoverable: true,
    };
  }

  /**
   * Type guard for PilotBAError
   */
  private isPilotBAError(error: unknown): error is PilotBAError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'severity' in error &&
      'category' in error
    );
  }

  /**
   * Infer error category from error type/message
   */
  private inferCategory(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('webgl') || message.includes('canvas')) {
      return 'webgl';
    }
    if (message.includes('memory') || message.includes('allocation')) {
      return 'memory';
    }
    if (message.includes('parse') || message.includes('json') || message.includes('csv')) {
      return 'file_parse';
    }
    if (message.includes('file') || message.includes('upload')) {
      return 'file_upload';
    }

    return 'unknown';
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(error: PilotBAError): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(error);
      } catch (e) {
        // Don't let subscriber errors break the chain
        console.error('Error in error subscriber:', e);
      }
    });
  }

  /**
   * Log error to console with formatting
   */
  private logToConsole(error: PilotBAError): void {
    const severityColors: Record<ErrorSeverity, string> = {
      critical: 'background: #dc2626; color: white; padding: 2px 6px; border-radius: 2px;',
      error: 'background: #ef4444; color: white; padding: 2px 6px; border-radius: 2px;',
      warning: 'background: #f59e0b; color: white; padding: 2px 6px; border-radius: 2px;',
      info: 'background: #3b82f6; color: white; padding: 2px 6px; border-radius: 2px;',
      debug: 'background: #6b7280; color: white; padding: 2px 6px; border-radius: 2px;',
    };

    const style = severityColors[error.severity];
    const label = error.severity.toUpperCase();

    console.groupCollapsed(
      `%c${label}%c ${error.code}: ${error.message}`,
      style,
      'color: inherit;'
    );
    console.log('Error ID:', error.id);
    console.log('Category:', error.category);
    console.log('Timestamp:', error.timestamp.toISOString());
    if (error.userAction) {
      console.log('User Action:', error.userAction);
    }
    if (error.context) {
      console.log('Context:', error.context);
    }
    if (error.technicalDetails) {
      console.log('Technical Details:', error.technicalDetails);
    }
    console.groupEnd();
  }

  /**
   * Generate unique error ID
   */
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

// Export singleton instance
export const errorService = ErrorService.getInstance();

// Export class for testing
export { ErrorService };

