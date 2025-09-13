import * as vscode from 'vscode';

export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
}

export interface ErrorDetails {
    code: string;
    message: string;
    userMessage: string;
    suggestion: string;
    isRetryable: boolean;
}

export class ErrorHandler {
    private static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2
    };

    private static readonly ERROR_CATALOG: { [key: string]: ErrorDetails } = {
        'NETWORK_ERROR': {
            code: 'NETWORK_ERROR',
            message: 'Network connection failed',
            userMessage: 'Unable to connect to AI service. Please check your internet connection.',
            suggestion: 'Try again in a moment or check your network settings.',
            isRetryable: true
        },
        'API_KEY_INVALID': {
            code: 'API_KEY_INVALID',
            message: 'API key is invalid or expired',
            userMessage: 'Your API key appears to be invalid or expired.',
            suggestion: 'Please check your API key in VS Code settings and ensure it\'s correct.',
            isRetryable: false
        },
        'RATE_LIMIT_EXCEEDED': {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Rate limit exceeded',
            userMessage: 'Too many requests. Rate limit exceeded.',
            suggestion: 'Please wait a moment before trying again.',
            isRetryable: true
        },
        'MODEL_NOT_AVAILABLE': {
            code: 'MODEL_NOT_AVAILABLE',
            message: 'Selected model is not available',
            userMessage: 'The selected AI model is temporarily unavailable.',
            suggestion: 'Try switching to a different model or wait a moment.',
            isRetryable: true
        },
        'CONTEXT_TOO_LARGE': {
            code: 'CONTEXT_TOO_LARGE',
            message: 'Context size exceeds model limits',
            userMessage: 'Your request is too large for the selected model.',
            suggestion: 'Try breaking your request into smaller parts or use a model with larger context.',
            isRetryable: false
        },
        'COST_LIMIT_EXCEEDED': {
            code: 'COST_LIMIT_EXCEEDED',
            message: 'Daily cost limit exceeded',
            userMessage: 'You\'ve reached your daily spending limit.',
            suggestion: 'Increase your daily limit in settings or wait until tomorrow.',
            isRetryable: false
        },
        'UNKNOWN_ERROR': {
            code: 'UNKNOWN_ERROR',
            message: 'An unexpected error occurred',
            userMessage: 'Something went wrong. Please try again.',
            suggestion: 'If the problem persists, please report this issue.',
            isRetryable: true
        }
    };

    /**
     * Execute a function with automatic retry logic and error handling
     */
    static async withRetry<T>(
        operation: () => Promise<T>,
        context: string,
        config: Partial<RetryConfig> = {}
    ): Promise<T> {
        const retryConfig = { ...this.DEFAULT_RETRY_CONFIG, ...config };
        let lastError: Error;

        for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;
                const errorDetails = this.classifyError(error);

                console.error(`[${context}] Attempt ${attempt + 1} failed:`, error);

                // Don't retry non-retryable errors
                if (!errorDetails.isRetryable) {
                    throw this.createUserFriendlyError(error as Error, context);
                }

                // Don't retry on final attempt
                if (attempt === retryConfig.maxRetries) {
                    break;
                }

                // Calculate delay with exponential backoff
                const delay = Math.min(
                    retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt),
                    retryConfig.maxDelay
                );

                console.log(`[${context}] Retrying in ${delay}ms... (attempt ${attempt + 1}/${retryConfig.maxRetries})`);
                await this.sleep(delay);
            }
        }

        throw this.createUserFriendlyError(lastError!, context);
    }

    /**
     * Classify error type based on error details
     */
    static classifyError(error: any): ErrorDetails {
        const errorStr = error?.toString()?.toLowerCase() || '';
        const statusCode = error?.response?.status || error?.status;

        // Network/connection errors
        if (errorStr.includes('network') || errorStr.includes('connection') || 
            errorStr.includes('timeout') || errorStr.includes('enotfound')) {
            return this.ERROR_CATALOG.NETWORK_ERROR;
        }

        // API key errors
        if (statusCode === 401 || statusCode === 403 || 
            errorStr.includes('unauthorized') || errorStr.includes('forbidden') ||
            errorStr.includes('api key') || errorStr.includes('authentication')) {
            return this.ERROR_CATALOG.API_KEY_INVALID;
        }

        // Rate limiting
        if (statusCode === 429 || errorStr.includes('rate limit') || 
            errorStr.includes('too many requests')) {
            return this.ERROR_CATALOG.RATE_LIMIT_EXCEEDED;
        }

        // Model availability
        if (statusCode === 404 || statusCode === 503 || 
            errorStr.includes('model not found') || errorStr.includes('unavailable')) {
            return this.ERROR_CATALOG.MODEL_NOT_AVAILABLE;
        }

        // Context size errors
        if (statusCode === 413 || errorStr.includes('context') || 
            errorStr.includes('token limit') || errorStr.includes('too large')) {
            return this.ERROR_CATALOG.CONTEXT_TOO_LARGE;
        }

        // Cost limit errors
        if (errorStr.includes('cost limit') || errorStr.includes('spending limit')) {
            return this.ERROR_CATALOG.COST_LIMIT_EXCEEDED;
        }

        return this.ERROR_CATALOG.UNKNOWN_ERROR;
    }

    /**
     * Create user-friendly error with helpful suggestions
     */
    static createUserFriendlyError(error: Error, context: string): Error {
        const errorDetails = this.classifyError(error);
        
        const userError = new Error(errorDetails.userMessage);
        (userError as any).suggestion = errorDetails.suggestion;
        (userError as any).code = errorDetails.code;
        (userError as any).context = context;
        (userError as any).originalError = error;

        return userError;
    }

    /**
     * Show user-friendly error notification
     */
    static showErrorNotification(error: any, context: string): void {
        const errorDetails = this.classifyError(error);
        
        const message = `${errorDetails.userMessage}\n\n💡 ${errorDetails.suggestion}`;
        
        if (errorDetails.isRetryable) {
            vscode.window.showWarningMessage(message, 'Retry', 'Settings').then(selection => {
                if (selection === 'Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'deepseekCodeCompanion');
                }
            });
        } else {
            vscode.window.showErrorMessage(message, 'Settings').then(selection => {
                if (selection === 'Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'deepseekCodeCompanion');
                }
            });
        }

        // Log detailed error for debugging
        console.error(`[ErrorHandler] ${context}:`, {
            code: errorDetails.code,
            message: errorDetails.message,
            originalError: error
        });
    }

    /**
     * Health check for model availability
     */
    static async checkModelHealth(
        modelId: string, 
        healthCheckFn: () => Promise<boolean>
    ): Promise<boolean> {
        try {
            return await this.withRetry(
                healthCheckFn,
                `Model Health Check: ${modelId}`,
                { maxRetries: 1, baseDelay: 500 }
            );
        } catch (error) {
            console.warn(`[ErrorHandler] Model ${modelId} health check failed:`, error);
            return false;
        }
    }

    /**
     * Graceful fallback for when primary operation fails
     */
    static async withFallback<T>(
        primary: () => Promise<T>,
        fallback: () => Promise<T>,
        context: string
    ): Promise<T> {
        try {
            return await primary();
        } catch (primaryError) {
            console.warn(`[ErrorHandler] ${context} primary operation failed, trying fallback:`, primaryError);
            
            try {
                return await fallback();
            } catch (fallbackError) {
                console.error(`[ErrorHandler] ${context} fallback also failed:`, fallbackError);
                throw this.createUserFriendlyError(primaryError as Error, context);
            }
        }
    }

    private static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}