/**
 * Comprehensive error logging and monitoring system for production
 */

export interface ErrorContext {
  userId?: string;
  competitionId?: string;
  deckId?: string;
  endpoint?: string;
  userAgent?: string;
  ip?: string;
  timestamp?: Date;
  additionalData?: Record<string, any>;
}

export interface LoggedError {
  id: string;
  message: string;
  stack?: string;
  level: "error" | "warn" | "info";
  context: ErrorContext;
  timestamp: Date;
}

class ErrorLogger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isProduction = process.env.NODE_ENV === "production";

  /**
   * Log an error with context information
   */
  async logError(
    error: Error | string,
    level: "error" | "warn" | "info" = "error",
    context: ErrorContext = {}
  ): Promise<void> {
    const errorId = this.generateErrorId();
    const timestamp = new Date();

    const loggedError: LoggedError = {
      id: errorId,
      message: typeof error === "string" ? error : error.message,
      stack: error instanceof Error ? error.stack : undefined,
      level,
      context: {
        ...context,
        timestamp,
      },
      timestamp,
    };

    // Console logging (always)
    this.logToConsole(loggedError);

    // In production, also log to external services
    if (this.isProduction) {
      await this.logToExternalService(loggedError);
    }

    // Store critical errors in database for admin review
    if (level === "error") {
      await this.logToDatabase(loggedError);
    }
  }

  /**
   * Log competition-specific errors
   */
  async logCompetitionError(
    error: Error | string,
    competitionId: string,
    userId?: string,
    additionalContext?: Record<string, any>
  ): Promise<void> {
    await this.logError(error, "error", {
      competitionId,
      userId,
      endpoint: "competition",
      additionalData: additionalContext,
    });
  }

  /**
   * Log API endpoint errors with request context
   */
  async logApiError(
    error: Error | string,
    endpoint: string,
    request?: Request,
    userId?: string
  ): Promise<void> {
    const context: ErrorContext = {
      endpoint,
      userId,
      userAgent: request?.headers.get("user-agent") || undefined,
      additionalData: {
        method: request?.method,
        url: request?.url,
      },
    };

    await this.logError(error, "error", context);
  }

  /**
   * Log database operation errors
   */
  async logDatabaseError(
    error: Error | string,
    operation: string,
    collection?: string,
    documentId?: string
  ): Promise<void> {
    await this.logError(error, "error", {
      endpoint: "database",
      additionalData: {
        operation,
        collection,
        documentId,
      },
    });
  }

  /**
   * Log validation errors with detailed context
   */
  async logValidationError(
    errors: string[],
    endpoint: string,
    data: any,
    userId?: string
  ): Promise<void> {
    await this.logError(`Validation failed: ${errors.join(", ")}`, "warn", {
      endpoint,
      userId,
      additionalData: {
        validationErrors: errors,
        submittedData: this.sanitizeData(data),
      },
    });
  }

  /**
   * Log cron job errors
   */
  async logCronError(
    error: Error | string,
    jobName: string,
    additionalContext?: Record<string, any>
  ): Promise<void> {
    await this.logError(error, "error", {
      endpoint: "cron",
      additionalData: {
        jobName,
        ...additionalContext,
      },
    });
  }

  /**
   * Log informational messages
   */
  async logInfo(message: string, context: ErrorContext = {}): Promise<void> {
    await this.logError(message, "info", context);
  }

  /**
   * Log warning messages
   */
  async logWarning(message: string, context: ErrorContext = {}): Promise<void> {
    await this.logError(message, "warn", context);
  }

  private logToConsole(loggedError: LoggedError): void {
    const { level, message, stack, context, timestamp } = loggedError;

    const logMessage = `[${timestamp.toISOString()}] ${level.toUpperCase()}: ${message}`;
    const contextInfo =
      Object.keys(context).length > 0
        ? `\nContext: ${JSON.stringify(context, null, 2)}`
        : "";
    const stackInfo = stack ? `\nStack: ${stack}` : "";

    switch (level) {
      case "error":
        console.error(`🚨 ${logMessage}${contextInfo}${stackInfo}`);
        break;
      case "warn":
        console.warn(`⚠️ ${logMessage}${contextInfo}`);
        break;
      case "info":
        console.info(`ℹ️ ${logMessage}${contextInfo}`);
        break;
    }
  }

  private async logToExternalService(loggedError: LoggedError): Promise<void> {
    try {
      // In production, integrate with services like Sentry, LogRocket, etc.
      // For now, we'll use a simple webhook or API call

      if (process.env.ERROR_WEBHOOK_URL) {
        await fetch(process.env.ERROR_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loggedError),
        });
      }
    } catch (error) {
      console.error("Failed to log to external service:", error);
    }
  }

  private async logToDatabase(loggedError: LoggedError): Promise<void> {
    try {
      // Store critical errors in MongoDB for admin review
      // This would require a separate ErrorLog collection
      // For now, we'll skip this to avoid circular dependencies
      console.info("📝 Error logged for database storage:", loggedError.id);
    } catch (error) {
      console.error("Failed to log to database:", error);
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeData(data: any): any {
    // Remove sensitive information from logged data
    const sensitiveFields = ["password", "token", "secret", "key"];

    if (typeof data !== "object" || data === null) {
      return data;
    }

    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = "[REDACTED]";
      }
    }

    return sanitized;
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Convenience functions for common use cases
export const logError = (error: Error | string, context?: ErrorContext) =>
  errorLogger.logError(error, "error", context);

export const logWarning = (message: string, context?: ErrorContext) =>
  errorLogger.logError(message, "warn", context);

export const logInfo = (message: string, context?: ErrorContext) =>
  errorLogger.logError(message, "info", context);
