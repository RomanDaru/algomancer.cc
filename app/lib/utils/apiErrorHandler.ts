import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { errorLogger } from "./errorLogger";
import { ValidationResult } from "./competitionValidation";

export interface ApiErrorInterface extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

class ApiError extends Error implements ApiErrorInterface {
  statusCode?: number;
  code?: string;
  details?: any;

  constructor(
    message: string,
    statusCode?: number,
    code?: string,
    details?: any
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  timestamp: string;
}

/**
 * Create a standardized API error
 */
export function createApiError(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): ApiError {
  return new ApiError(message, statusCode, code, details);
}

/**
 * Create a standardized API response
 */
export function createApiResponse<T>(
  data?: T,
  error?: string,
  details?: any
): ApiResponse<T> {
  return {
    success: !error,
    data,
    error,
    details,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Wrapper for API route handlers with comprehensive error handling
 */
export function withErrorHandling<T = any>(
  handler: (
    request: NextRequest,
    context?: any
  ) => Promise<NextResponse<ApiResponse<T>>>,
  options: {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    endpoint: string;
  }
) {
  return async (
    request: NextRequest,
    context?: any
  ): Promise<NextResponse<ApiResponse<T>>> => {
    const startTime = Date.now();
    let userId: string | undefined;

    try {
      // Authentication check
      if (options.requireAuth || options.requireAdmin) {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
          await errorLogger.logApiError(
            "Unauthorized access attempt",
            options.endpoint,
            request
          );

          return NextResponse.json(
            createApiResponse(undefined, "Authentication required"),
            { status: 401 }
          );
        }

        userId = session.user.id;

        // Admin check
        if (options.requireAdmin && !session.user.isAdmin) {
          await errorLogger.logApiError(
            `Non-admin user ${userId} attempted admin action`,
            options.endpoint,
            request,
            userId
          );

          return NextResponse.json(
            createApiResponse(undefined, "Admin access required"),
            { status: 403 }
          );
        }
      }

      // Execute the handler
      const response = await handler(request, context);

      // Log successful requests in development
      if (process.env.NODE_ENV === "development") {
        const duration = Date.now() - startTime;
        console.log(`✅ ${options.endpoint} completed in ${duration}ms`);
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log the error with full context
      await errorLogger.logApiError(
        error instanceof Error ? error : String(error),
        options.endpoint,
        request,
        userId
      );

      // Handle different types of errors
      if (error instanceof ApiError) {
        return NextResponse.json(
          createApiResponse(undefined, error.message, error.details),
          { status: error.statusCode || 500 }
        );
      }

      // Handle validation errors
      if (error instanceof Error && error.message.includes("validation")) {
        return NextResponse.json(
          createApiResponse(undefined, "Validation failed", error.message),
          { status: 400 }
        );
      }

      // Handle MongoDB errors
      if (error instanceof Error && error.message.includes("MongoError")) {
        await errorLogger.logDatabaseError(
          error,
          "unknown",
          "unknown",
          "unknown"
        );

        return NextResponse.json(
          createApiResponse(undefined, "Database operation failed"),
          { status: 500 }
        );
      }

      // Generic error handling
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";

      return NextResponse.json(createApiResponse(undefined, errorMessage), {
        status: 500,
      });
    }
  };
}

/**
 * Validate request data and return formatted errors
 */
export function validateRequestData(
  validationResult: ValidationResult,
  endpoint: string,
  data: any,
  userId?: string
): NextResponse<ApiResponse> | null {
  if (!validationResult.isValid) {
    // Log validation errors
    errorLogger.logValidationError(
      validationResult.errors,
      endpoint,
      data,
      userId
    );

    return NextResponse.json(
      createApiResponse(undefined, "Validation failed", {
        errors: validationResult.errors,
        fields: validationResult.errors.map((error) => {
          // Extract field names from error messages
          const fieldMatch = error.match(/^(\w+)/);
          return fieldMatch ? fieldMatch[1].toLowerCase() : "unknown";
        }),
      }),
      { status: 400 }
    );
  }

  return null;
}

/**
 * Handle database connection errors
 */
export async function handleDatabaseError(
  error: Error,
  operation: string,
  collection?: string,
  documentId?: string
): Promise<never> {
  await errorLogger.logDatabaseError(error, operation, collection, documentId);

  throw createApiError("Database operation failed", 500, "DATABASE_ERROR", {
    operation,
    collection,
    documentId,
  });
}

/**
 * Rate limiting helper (basic implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Input sanitization helper
 */
export function sanitizeInput(input: any): any {
  if (typeof input === "string") {
    // Basic XSS prevention
    return input.replace(/[<>]/g, "").trim().substring(0, 10000); // Limit length
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (typeof input === "object" && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}
