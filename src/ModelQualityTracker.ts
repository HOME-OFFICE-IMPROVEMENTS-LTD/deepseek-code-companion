import { ModelConfig, ModelResponse, ChatMessage } from './types';

export interface ModelQualityScore {
    modelId: string;
    overallScore: number; // 0-100
    responseQuality: number;
    reliability: number;
    performance: number;
    costEfficiency: number;
    lastUpdated: number;
    sampleSize: number;
    categories: {
        coding: number;
        general: number;
        analysis: number;
        creative: number;
    };
}

export interface ResponseEvaluation {
    quality: number;
    relevance: number;
    completeness: number;
    accuracy: number;
    responseTime: number;
    tokenEfficiency: number;
    errorOccurred: boolean;
}

export class ModelQualityTracker {
    private qualityScores = new Map<string, ModelQualityScore>();
    private recentEvaluations = new Map<string, ResponseEvaluation[]>();
    private readonly maxEvaluations = 50; // Keep last 50 evaluations per model

    /**
     * Evaluates and tracks the quality of a model response
     */
    async evaluateResponse(
        modelId: string,
        response: ModelResponse,
        originalMessages: ChatMessage[],
        responseTime: number,
        taskCategory: 'coding' | 'general' | 'analysis' | 'creative' = 'general'
    ): Promise<ResponseEvaluation> {
        const evaluation = this.analyzeResponse(response, originalMessages, responseTime);
        this.recordEvaluation(modelId, evaluation, taskCategory);
        
        return evaluation;
    }

    /**
     * Analyzes response quality using multiple metrics
     */
    private analyzeResponse(
        response: ModelResponse,
        originalMessages: ChatMessage[],
        responseTime: number
    ): ResponseEvaluation {
        const content = response.content;
        const lastUserMessage = originalMessages.filter(m => m.role === 'user').pop()?.content || '';

        // Quality scoring (0-100)
        let quality = 50; // Base score

        // Length appropriateness (not too short, not excessively long)
        const contentLength = content.length;
        const expectedLength = Math.max(lastUserMessage.length * 2, 100);
        
        if (contentLength >= expectedLength * 0.5 && contentLength <= expectedLength * 4) {
            quality += 15;
        } else if (contentLength < expectedLength * 0.2) {
            quality -= 20; // Too short
        } else if (contentLength > expectedLength * 6) {
            quality -= 10; // Too verbose
        }

        // Structure and formatting
        const hasStructure = this.hasGoodStructure(content);
        if (hasStructure) {
            quality += 15;
        }

        // Code quality (if applicable)
        const codeQuality = this.assessCodeQuality(content);
        quality += codeQuality;

        // Relevance to the request
        const relevance = this.calculateRelevance(content, lastUserMessage);
        
        // Completeness assessment
        const completeness = this.assessCompleteness(content, lastUserMessage);

        // Token efficiency
        const tokenEfficiency = this.calculateTokenEfficiency(response);

        // Accuracy (basic checks for obvious errors)
        const accuracy = this.assessAccuracy(content);

        return {
            quality: Math.max(0, Math.min(100, quality)),
            relevance,
            completeness,
            accuracy,
            responseTime,
            tokenEfficiency,
            errorOccurred: false
        };
    }

    /**
     * Records evaluation and updates model score
     */
    private recordEvaluation(
        modelId: string,
        evaluation: ResponseEvaluation,
        category: 'coding' | 'general' | 'analysis' | 'creative'
    ): void {
        // Store evaluation
        if (!this.recentEvaluations.has(modelId)) {
            this.recentEvaluations.set(modelId, []);
        }

        const evaluations = this.recentEvaluations.get(modelId)!;
        evaluations.push(evaluation);

        // Keep only recent evaluations
        if (evaluations.length > this.maxEvaluations) {
            evaluations.shift();
        }

        // Update overall score
        this.updateModelScore(modelId, category);
    }

    /**
     * Updates the overall score for a model based on recent evaluations
     */
    private updateModelScore(modelId: string, category: 'coding' | 'general' | 'analysis' | 'creative'): void {
        const evaluations = this.recentEvaluations.get(modelId) || [];
        if (evaluations.length === 0) {
            return;
        }

        const recentEvals = evaluations.slice(-20); // Use last 20 evaluations

        const avgQuality = this.average(recentEvals.map(e => e.quality));
        const avgRelevance = this.average(recentEvals.map(e => e.relevance));
        const avgCompleteness = this.average(recentEvals.map(e => e.completeness));
        const avgAccuracy = this.average(recentEvals.map(e => e.accuracy));
        const avgResponseTime = this.average(recentEvals.map(e => e.responseTime));
        const avgTokenEfficiency = this.average(recentEvals.map(e => e.tokenEfficiency));
        const errorRate = recentEvals.filter(e => e.errorOccurred).length / recentEvals.length;

        const reliability = Math.max(0, 100 - (errorRate * 100));
        const performance = this.calculatePerformanceScore(avgResponseTime, avgTokenEfficiency);
        const responseQuality = (avgQuality + avgRelevance + avgCompleteness + avgAccuracy) / 4;

        const currentScore = this.qualityScores.get(modelId);
        const categories = currentScore?.categories || { coding: 50, general: 50, analysis: 50, creative: 50 };
        
        // Update specific category
        categories[category] = responseQuality;

        const overallScore = (responseQuality + reliability + performance) / 3;

        const newScore: ModelQualityScore = {
            modelId,
            overallScore,
            responseQuality,
            reliability,
            performance,
            costEfficiency: currentScore?.costEfficiency || 50,
            lastUpdated: Date.now(),
            sampleSize: evaluations.length,
            categories
        };

        this.qualityScores.set(modelId, newScore);
    }

    /**
     * Assesses if content has good structure and formatting
     */
    private hasGoodStructure(content: string): boolean {
        const hasHeaders = /^#+\s/m.test(content);
        const hasBullets = /^[-*+]\s/m.test(content);
        const hasNumbers = /^\d+\.\s/m.test(content);
        const hasCodeBlocks = /```/.test(content);
        const hasParagraphs = content.split('\n\n').length > 1;

        return [hasHeaders, hasBullets, hasNumbers, hasCodeBlocks, hasParagraphs].filter(Boolean).length >= 2;
    }

    /**
     * Assesses code quality in the response
     */
    private assessCodeQuality(content: string): number {
        const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
        if (codeBlocks.length === 0) {
            return 0;
        }

        let score = 0;
        
        for (const block of codeBlocks) {
            // Check for language specification
            if (/```\w+/.test(block)) {
                score += 5;
            }
            
            // Check for comments
            if (/\/\/|\/\*|\#|<!--/.test(block)) {
                score += 3;
            }
            
            // Check for proper indentation
            const lines = block.split('\n').slice(1, -1); // Remove ``` lines
            const hasConsistentIndentation = lines.some(line => line.startsWith('  ') || line.startsWith('\t'));
            if (hasConsistentIndentation) {
                score += 3;
            }
            
            // Check for variable naming
            const hasGoodNaming = /[a-zA-Z][a-zA-Z0-9_]*/.test(block);
            if (hasGoodNaming) {
                score += 2;
            }
        }

        return Math.min(score, 15); // Cap at 15 points
    }

    /**
     * Calculates relevance to the original request
     */
    private calculateRelevance(response: string, request: string): number {
        const requestWords = request.toLowerCase().split(/\s+/).filter(word => word.length > 3);
        const responseWords = response.toLowerCase().split(/\s+/);
        
        let matches = 0;
        for (const word of requestWords) {
            if (responseWords.some(rWord => rWord.includes(word) || word.includes(rWord))) {
                matches++;
            }
        }

        return requestWords.length > 0 ? (matches / requestWords.length) * 100 : 50;
    }

    /**
     * Assesses completeness of the response
     */
    private assessCompleteness(response: string, request: string): number {
        const requestLower = request.toLowerCase();
        let score = 50; // Base score

        // Check if response addresses common question words
        const questionWords = ['what', 'how', 'why', 'when', 'where', 'which', 'who'];
        const addressedQuestions = questionWords.filter(word => 
            requestLower.includes(word) && response.toLowerCase().includes(word)
        );

        score += addressedQuestions.length * 5;

        // Check for examples if requested
        if (requestLower.includes('example') && /example|for instance|such as/i.test(response)) {
            score += 10;
        }

        // Check for explanations if requested
        if (requestLower.includes('explain') && response.length > 200) {
            score += 10;
        }

        return Math.min(score, 100);
    }

    /**
     * Calculates token efficiency (quality per token)
     */
    private calculateTokenEfficiency(response: ModelResponse): number {
        const totalTokens = response.usage.inputTokens + response.usage.outputTokens;
        const contentLength = response.content.length;
        
        if (totalTokens === 0) {
            return 50;
        }
        
        // Assume ~4 characters per token for efficiency calculation
        const expectedTokens = contentLength / 4;
        const efficiency = expectedTokens / totalTokens;
        
        return Math.min(efficiency * 100, 100);
    }

    /**
     * Assesses accuracy with basic checks
     */
    private assessAccuracy(content: string): number {
        let score = 80; // Start with high score, deduct for issues

        // Check for contradictions
        const contradictionWords = ['but', 'however', 'although', 'nevertheless'];
        const contradictions = contradictionWords.filter(word => 
            content.toLowerCase().includes(word)
        ).length;

        score -= contradictions * 2;

        // Check for uncertainty markers (which might indicate accuracy issues)
        const uncertaintyMarkers = ['maybe', 'perhaps', 'might be', 'possibly', 'i think', 'not sure'];
        const uncertainties = uncertaintyMarkers.filter(marker => 
            content.toLowerCase().includes(marker)
        ).length;

        score -= uncertainties * 3;

        // Check for broken code blocks
        const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
        for (const block of codeBlocks) {
            if (block.includes('undefined') || block.includes('error') || block.includes('null')) {
                score -= 5;
            }
        }

        return Math.max(score, 0);
    }

    /**
     * Calculates performance score based on response time and efficiency
     */
    private calculatePerformanceScore(responseTime: number, tokenEfficiency: number): number {
        // Response time scoring (faster is better)
        let timeScore = 100;
        if (responseTime > 10000) {
            timeScore = 50; // 10+ seconds
        } else if (responseTime > 5000) {
            timeScore = 70; // 5-10 seconds
        } else if (responseTime > 2000) {
            timeScore = 85; // 2-5 seconds
        }

        return (timeScore + tokenEfficiency) / 2;
    }

    /**
     * Utility function to calculate average
     */
    private average(numbers: number[]): number {
        return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
    }

    /**
     * Gets the quality score for a specific model
     */
    getModelScore(modelId: string): ModelQualityScore | null {
        return this.qualityScores.get(modelId) || null;
    }

    /**
     * Gets all model scores sorted by overall score
     */
    getAllScores(): ModelQualityScore[] {
        return Array.from(this.qualityScores.values())
            .sort((a, b) => b.overallScore - a.overallScore);
    }

    /**
     * Recommends the best model for a specific task category
     */
    recommendModel(
        availableModels: ModelConfig[],
        category: 'coding' | 'general' | 'analysis' | 'creative' = 'general',
        prioritizeCost = false
    ): ModelConfig | null {
        const scoredModels = availableModels
            .map(model => {
                const score = this.qualityScores.get(model.id);
                if (!score) {
                    return null;
                }

                let relevantScore = score.categories[category];
                
                if (prioritizeCost) {
                    // Factor in cost efficiency
                    relevantScore = (relevantScore + score.costEfficiency) / 2;
                }

                return { model, score: relevantScore };
            })
            .filter(item => item !== null)
            .sort((a, b) => b!.score - a!.score);

        return scoredModels.length > 0 ? scoredModels[0]!.model : null;
    }

    /**
     * Updates cost efficiency based on actual usage
     */
    updateCostEfficiency(modelId: string, quality: number, cost: number): void {
        const score = this.qualityScores.get(modelId);
        if (!score) {
            return;
        }

        // Calculate value per dollar (quality / cost ratio)
        const efficiency = cost > 0 ? (quality / cost) * 100 : quality;
        
        // Update cost efficiency with weighted average
        score.costEfficiency = (score.costEfficiency + efficiency) / 2;
        score.lastUpdated = Date.now();

        this.qualityScores.set(modelId, score);
    }

    /**
     * Resets tracking data
     */
    reset(): void {
        this.qualityScores.clear();
        this.recentEvaluations.clear();
    }

    /**
     * Gets statistics for monitoring
     */
    getStats(): {
        trackedModels: number;
        totalEvaluations: number;
        topModels: Array<{ modelId: string; score: number }>;
    } {
        const totalEvaluations = Array.from(this.recentEvaluations.values())
            .reduce((sum, evals) => sum + evals.length, 0);

        const topModels = this.getAllScores()
            .slice(0, 5)
            .map(score => ({ modelId: score.modelId, score: score.overallScore }));

        return {
            trackedModels: this.qualityScores.size,
            totalEvaluations,
            topModels
        };
    }
}

// Global instance for extension-wide quality tracking
export const modelQualityTracker = new ModelQualityTracker();