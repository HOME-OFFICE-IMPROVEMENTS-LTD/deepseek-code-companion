// Type definitions for multi-model provider system

export interface ModelConfig {
    id: string;
    name: string;
    provider: 'deepseek' | 'openrouter';
    maxTokens: number;
    costPer1kTokens: {
        input: number;
        output: number;
    };
    capabilities: string[];
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
}

export interface ModelResponse {
    content: string;
    usage: {
        inputTokens: number;
        outputTokens: number;
        totalCost: number;
    };
    model: string;
    provider: string;
    optimized?: boolean;
    enhancedAt?: number;
    metadata?: {
        cached?: boolean;
        optimizationApplied?: boolean;
        processingTime?: number;
        [key: string]: any;
    };
}

export interface ProviderConfig {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
}

export interface CostTracker {
    dailyUsage: number;
    dailyLimit: number;
    totalUsage: number;
    lastReset: Date;
}