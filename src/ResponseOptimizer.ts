import { ModelResponse, ChatMessage } from './types';
import * as vscode from 'vscode';

export interface CacheEntry {
    response: ModelResponse;
    timestamp: number;
    requestHash: string;
    accessCount: number;
    lastAccessed: number;
}

export interface OptimizationMetrics {
    responseTime: number;
    cacheHitRate: number;
    averageTokens: number;
    successRate: number;
}

export class ResponseOptimizer {
    private cache = new Map<string, CacheEntry>();
    private readonly maxCacheSize = 100;
    private readonly cacheExpiryMs = 30 * 60 * 1000; // 30 minutes
    private metrics: OptimizationMetrics = {
        responseTime: 0,
        cacheHitRate: 0,
        averageTokens: 0,
        successRate: 0
    };

    private responseTimeTracker: number[] = [];
    private cacheHits = 0;
    private totalRequests = 0;
    private successfulRequests = 0;

    /**
     * Optimizes the response by checking cache first, then processing
     */
    async optimizeResponse(
        requestFn: () => Promise<ModelResponse>,
        messages: ChatMessage[],
        modelId: string,
        options: any = {}
    ): Promise<ModelResponse> {
        const requestHash = this.generateRequestHash(messages, modelId, options);
        this.totalRequests++;

        // Check cache first
        const cachedResponse = this.getCachedResponse(requestHash);
        if (cachedResponse) {
            this.cacheHits++;
            this.updateMetrics();
            return this.enhanceResponse(cachedResponse);
        }

        // Execute request with timing
        const startTime = Date.now();
        try {
            const response = await requestFn();
            const responseTime = Date.now() - startTime;
            
            this.responseTimeTracker.push(responseTime);
            if (this.responseTimeTracker.length > 20) {
                this.responseTimeTracker.shift();
            }

            this.successfulRequests++;
            this.cacheResponse(requestHash, response);
            this.updateMetrics();

            return this.enhanceResponse(response);
        } catch (error) {
            this.updateMetrics();
            throw error;
        }
    }

    /**
     * Enhances response with additional metadata and optimization
     */
    private enhanceResponse(response: ModelResponse): ModelResponse {
        return {
            ...response,
            optimized: true,
            enhancedAt: Date.now(),
            metadata: {
                cached: this.isResponseCached(response),
                optimizationApplied: true,
                processingTime: response.metadata?.processingTime || 0
            }
        };
    }

    /**
     * Generates a hash for caching based on request parameters
     */
    private generateRequestHash(messages: ChatMessage[], modelId: string, options: any): string {
        const content = JSON.stringify({
            messages: messages.map(m => ({ role: m.role, content: m.content.substring(0, 500) })),
            modelId,
            options: {
                maxTokens: options.maxTokens,
                temperature: options.temperature
            }
        });
        
        return this.simpleHash(content);
    }

    /**
     * Simple hash function for request caching
     */
    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    /**
     * Retrieves cached response if valid
     */
    private getCachedResponse(hash: string): ModelResponse | null {
        const entry = this.cache.get(hash);
        if (!entry) {
            return null;
        }

        const now = Date.now();
        if (now - entry.timestamp > this.cacheExpiryMs) {
            this.cache.delete(hash);
            return null;
        }

        // Update access statistics
        entry.accessCount++;
        entry.lastAccessed = now;
        
        return entry.response;
    }

    /**
     * Caches response with LRU eviction
     */
    private cacheResponse(hash: string, response: ModelResponse): void {
        // Implement LRU eviction if cache is full
        if (this.cache.size >= this.maxCacheSize) {
            this.evictLeastUsed();
        }

        const entry: CacheEntry = {
            response,
            timestamp: Date.now(),
            requestHash: hash,
            accessCount: 1,
            lastAccessed: Date.now()
        };

        this.cache.set(hash, entry);
    }

    /**
     * Evicts least recently used cache entries
     */
    private evictLeastUsed(): void {
        let oldestKey: string | null = null;
        let oldestTime = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Checks if response came from cache
     */
    private isResponseCached(response: ModelResponse): boolean {
        return response.metadata?.cached === true;
    }

    /**
     * Updates performance metrics
     */
    private updateMetrics(): void {
        this.metrics.cacheHitRate = this.totalRequests > 0 ? this.cacheHits / this.totalRequests : 0;
        this.metrics.successRate = this.totalRequests > 0 ? this.successfulRequests / this.totalRequests : 0;
        
        if (this.responseTimeTracker.length > 0) {
            this.metrics.responseTime = this.responseTimeTracker.reduce((a, b) => a + b, 0) / this.responseTimeTracker.length;
        }
    }

    /**
     * Gets current optimization metrics
     */
    getMetrics(): OptimizationMetrics {
        return { ...this.metrics };
    }

    /**
     * Clears cache and resets metrics
     */
    reset(): void {
        this.cache.clear();
        this.responseTimeTracker = [];
        this.cacheHits = 0;
        this.totalRequests = 0;
        this.successfulRequests = 0;
        this.metrics = {
            responseTime: 0,
            cacheHitRate: 0,
            averageTokens: 0,
            successRate: 0
        };
    }

    /**
     * Pre-warms cache with common requests
     */
    async preWarmCache(commonRequests: Array<{
        messages: ChatMessage[];
        modelId: string;
        options?: any;
        requestFn: () => Promise<ModelResponse>;
    }>): Promise<void> {
        const promises = commonRequests.map(async (request) => {
            try {
                await this.optimizeResponse(
                    request.requestFn,
                    request.messages,
                    request.modelId,
                    request.options
                );
            } catch (error) {
                console.warn('Pre-warm cache failed for request:', error);
            }
        });

        await Promise.allSettled(promises);
    }

    /**
     * Gets cache statistics for monitoring
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
        hitRate: string;
        entries: Array<{
            hash: string;
            timestamp: number;
            accessCount: number;
            lastAccessed: number;
        }>;
    } {
        const entries = Array.from(this.cache.entries()).map(([hash, entry]) => ({
            hash,
            timestamp: entry.timestamp,
            accessCount: entry.accessCount,
            lastAccessed: entry.lastAccessed
        }));

        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            hitRate: (this.metrics.cacheHitRate * 100).toFixed(1) + '%',
            entries
        };
    }
}

// Global instance for extension-wide optimization
export const responseOptimizer = new ResponseOptimizer();