import * as vscode from 'vscode';
import { BaseModelProvider, DeepSeekProvider, OpenRouterProvider } from './ModelProvider';
import { ModelConfig, ChatMessage, ModelResponse, CostTracker } from './types';
import { responseOptimizer } from './ResponseOptimizer';
import { modelQualityTracker } from './ModelQualityTracker';
import { smartContextManager } from './SmartContextManager';
import { uiPolishManager } from './UIPolishManager';

export class ModelManager {
    private providers: Map<string, BaseModelProvider> = new Map();
    private costTracker: CostTracker;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.costTracker = this.loadCostTracker();
        this.initializeProviders();
    }

    private initializeProviders(): void {
        const config = vscode.workspace.getConfiguration('deepseekCodeCompanion');
        
        // Initialize DeepSeek provider
        const deepseekApiKey = config.get<string>('deepseekApiKey');
        if (deepseekApiKey) {
            this.providers.set('deepseek', new DeepSeekProvider({ apiKey: deepseekApiKey }));
            console.log('✅ DeepSeek provider initialized');
        } else {
            console.log('⚠️ DeepSeek API key not configured - DeepSeek models will not be available');
        }

        // Initialize OpenRouter provider
        const openrouterApiKey = config.get<string>('openrouterApiKey');
        console.log('🔍 OpenRouter API key configured:', !!openrouterApiKey);
        if (openrouterApiKey) {
            console.log('🔍 OpenRouter API key length:', openrouterApiKey.length);
            this.providers.set('openrouter', new OpenRouterProvider({ apiKey: openrouterApiKey }));
            console.log('✅ OpenRouter provider initialized');
        } else {
            console.log('⚠️ OpenRouter API key not configured - OpenRouter models will not be available');
        }
    }

    async getAllAvailableModels(): Promise<ModelConfig[]> {
        const allModels: ModelConfig[] = [];
        
        console.log('🔍 Available providers:', Array.from(this.providers.keys()));
        
        for (const [providerName, provider] of this.providers) {
            try {
                console.log(`🔍 Fetching models from ${providerName}...`);
                const models = await provider.getAvailableModels();
                console.log(`✅ Got ${models.length} models from ${providerName}`);
                allModels.push(...models);
            } catch (error) {
                console.error(`❌ Failed to get models from ${providerName}:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`❌ Error details: ${errorMessage}`);
                vscode.window.showWarningMessage(`Failed to load models from ${providerName}: ${errorMessage}`);
            }
        }

        return allModels.sort((a, b) => {
            // Sort by provider first (DeepSeek first), then by name
            if (a.provider !== b.provider) {
                return a.provider === 'deepseek' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    }

    async sendMessage(
        messages: ChatMessage[], 
        modelId: string, 
        options?: { maxTokens?: number; temperature?: number }
    ): Promise<ModelResponse> {
        const startTime = Date.now();
        
        // Check daily cost limit
        if (this.costTracker.dailyUsage >= this.costTracker.dailyLimit) {
            throw new Error(`Daily cost limit of $${this.costTracker.dailyLimit.toFixed(2)} reached. Usage will reset at midnight.`);
        }

        // Find the appropriate provider and model
        const models = await this.getAllAvailableModels();
        const model = models.find(m => m.id === modelId);
        if (!model) {
            if (models.length === 0) {
                throw new Error(`No AI models available. Please configure your API keys in VS Code settings:\n• DeepSeek API Key: Get from https://platform.deepseek.com/\n• OpenRouter API Key: Get from https://openrouter.ai/ (optional)`);
            }
            const availableModels = models.map(m => m.id).join(', ');
            throw new Error(`Model "${modelId}" not found. Available models: ${availableModels}`);
        }

        const provider = this.providers.get(model.provider);
        if (!provider) {
            throw new Error(`Provider ${model.provider} not available. Please check your API key configuration.`);
        }

        try {
            // Show typing indicator
            uiPolishManager.showTypingIndicator(model.name);

            // Optimize context for this model and conversation
            const taskType = this.detectTaskType(messages);
            console.log('🔍 MODEL MANAGER - Before context optimization, message count:', messages.length);
            console.log('🔍 MODEL MANAGER - Messages contain README:', messages.some(m => m.content.includes('[SYSTEM: Here is the README.md content for context:]')));
            
            const contextResult = await smartContextManager.optimizeContext(
                messages, 
                model, 
                taskType
            );
            
            console.log('🔍 MODEL MANAGER - After context optimization, message count:', contextResult.optimizedMessages.length);
            console.log('🔍 MODEL MANAGER - Optimized messages contain README:', contextResult.optimizedMessages.some(m => m.content.includes('[SYSTEM: Here is the README.md content for context:]')));
            console.log('🔍 MODEL MANAGER - Context summary:', contextResult.contextSummary);

            // Use optimized response system with retry and caching
            const response = await responseOptimizer.optimizeResponse(
                async () => {
                    return await provider.sendMessage(
                        contextResult.optimizedMessages, 
                        modelId, 
                        options
                    );
                },
                contextResult.optimizedMessages,
                modelId,
                options
            );

            const responseTime = Date.now() - startTime;

            // Track quality and performance
            await modelQualityTracker.evaluateResponse(
                modelId,
                response,
                messages,
                responseTime,
                taskType
            );

            // Update cost tracking
            this.updateCostTracker(response.usage.totalCost);
            
            // Update cost efficiency in quality tracker
            modelQualityTracker.updateCostEfficiency(
                modelId,
                70, // Base quality score, will be improved by actual evaluation
                response.usage.totalCost
            );

            // Clear typing indicator
            uiPolishManager.clearTypingIndicator();

            // Add processing metadata
            const enhancedResponse: ModelResponse = {
                ...response,
                metadata: {
                    ...response.metadata,
                    processingTime: responseTime,
                    contextOptimized: contextResult.compressionApplied,
                    contextSummary: contextResult.contextSummary,
                    tokensUsed: contextResult.tokensUsed,
                    taskType
                }
            };

            return enhancedResponse;
        } catch (error) {
            // Clear typing indicator on error
            uiPolishManager.clearTypingIndicator();
            
            // Track error for quality assessment
            await modelQualityTracker.evaluateResponse(
                modelId,
                {
                    content: '',
                    usage: { inputTokens: 0, outputTokens: 0, totalCost: 0 },
                    model: modelId,
                    provider: model.provider
                },
                messages,
                Date.now() - startTime,
                this.detectTaskType(messages)
            );

            // Show enhanced error with recovery options
            await uiPolishManager.showEnhancedError(
                error instanceof Error ? error : new Error('Unknown error'),
                `${model.name} request`,
                [
                    {
                        title: 'Try Different Model',
                        action: async () => {
                            const recommendedModel = modelQualityTracker.recommendModel(
                                models,
                                this.detectTaskType(messages)
                            );
                            if (recommendedModel) {
                                uiPolishManager.updateStatus({
                                    message: `Switched to ${recommendedModel.name}`,
                                    icon: '$(arrow-swap)'
                                });
                            }
                        }
                    },
                    {
                        title: 'Check Settings',
                        action: async () => {
                            vscode.commands.executeCommand('workbench.action.openSettings', 'deepseekCodeCompanion');
                        }
                    }
                ]
            );

            throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Detects the type of task based on the conversation
     */
    private detectTaskType(messages: ChatMessage[]): 'coding' | 'general' | 'analysis' | 'creative' {
        const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content.toLowerCase() || '';
        
        const codeKeywords = ['code', 'function', 'class', 'method', 'variable', 'debug', 'error', 'fix', 'implement', 'algorithm', 'syntax'];
        const analysisKeywords = ['analyze', 'review', 'explain', 'compare', 'evaluate', 'assess', 'examine'];
        const creativeKeywords = ['create', 'generate', 'write', 'design', 'story', 'content', 'creative'];

        const codeScore = codeKeywords.filter(word => lastUserMessage.includes(word)).length;
        const analysisScore = analysisKeywords.filter(word => lastUserMessage.includes(word)).length;
        const creativeScore = creativeKeywords.filter(word => lastUserMessage.includes(word)).length;

        if (codeScore > analysisScore && codeScore > creativeScore) {
            return 'coding';
        } else if (analysisScore > creativeScore) {
            return 'analysis';
        } else if (creativeScore > 0) {
            return 'creative';
        }

        return 'general';
    }

    getCostTracker(): CostTracker {
        return { ...this.costTracker };
    }

    /**
     * Gets model recommendations based on task type and quality scores
     */
    async getModelRecommendations(
        taskType: 'coding' | 'general' | 'analysis' | 'creative' = 'general',
        prioritizeCost = false
    ): Promise<ModelConfig[]> {
        const models = await this.getAllAvailableModels();
        
        // Use quality tracker for recommendations
        const recommended = modelQualityTracker.recommendModel(models, taskType, prioritizeCost);
        if (recommended) {
            // Move recommended model to front
            const otherModels = models.filter(m => m.id !== recommended.id);
            return [recommended, ...otherModels];
        }
        
        return models;
    }

    /**
     * Gets optimization metrics and performance statistics
     */
    getPerformanceMetrics(): {
        responseOptimizer: any;
        qualityTracker: any;
        contextManager: any;
    } {
        return {
            responseOptimizer: responseOptimizer.getMetrics(),
            qualityTracker: modelQualityTracker.getStats(),
            contextManager: smartContextManager.getStats()
        };
    }

    /**
     * Shows comprehensive usage statistics
     */
    async showUsageStatistics(): Promise<void> {
        const metrics = this.getPerformanceMetrics();
        const costTracker = this.getCostTracker();
        
        await uiPolishManager.showUsageStats({
            totalRequests: metrics.qualityTracker.totalEvaluations,
            totalCost: costTracker.totalUsage,
            modelUsage: {},
            dailyUsage: [costTracker.dailyUsage],
            metrics: metrics.responseOptimizer
        });
    }

    /**
     * Provides smart suggestions for improving workflow
     */
    async showSmartSuggestions(): Promise<void> {
        const suggestions = [];
        const metrics = this.getPerformanceMetrics();
        const models = await this.getAllAvailableModels();

        // Suggest model upgrades based on quality scores
        if (metrics.qualityTracker.topModels.length > 1) {
            const topModel = metrics.qualityTracker.topModels[0];
            suggestions.push({
                title: 'Consider using higher-rated model',
                description: `${topModel.modelId} has a quality score of ${topModel.score.toFixed(1)}`,
                priority: 'medium' as const
            });
        }

        // Suggest cost optimization
        if (this.costTracker.dailyUsage > this.costTracker.dailyLimit * 0.7) {
            suggestions.push({
                title: 'Optimize API usage',
                description: 'Consider using less expensive models or enabling more aggressive caching',
                priority: 'high' as const,
                action: () => {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'deepseekCodeCompanion');
                }
            });
        }

        // Suggest context optimization
        if (metrics.contextManager.totalTokens > 10000) {
            suggestions.push({
                title: 'Context optimization available',
                description: 'Large context detected. Enable compression to reduce costs',
                priority: 'medium' as const
            });
        }

        await uiPolishManager.showSmartSuggestions(suggestions);
    }

    /**
     * Resets all optimization systems
     */
    resetOptimizations(): void {
        responseOptimizer.reset();
        modelQualityTracker.reset();
        smartContextManager.reset();
        
        uiPolishManager.showNotification({
            type: 'info',
            title: 'Optimizations Reset',
            detail: 'All caches and quality tracking data have been cleared'
        });
    }

    resetDailyCost(): void {
        const now = new Date();
        this.costTracker.dailyUsage = 0;
        this.costTracker.lastReset = now;
        this.saveCostTracker();
    }

    updateDailyLimit(newLimit: number): void {
        this.costTracker.dailyLimit = newLimit;
        this.saveCostTracker();
    }

    /**
     * Gets the status of all providers
     */
    getProviderStatus(): Array<{
        provider: string;
        configured: boolean;
        available: boolean;
        modelCount?: number;
    }> {
        const status = [];
        const config = vscode.workspace.getConfiguration('deepseekCodeCompanion');
        
        // Check DeepSeek
        const deepseekProvider = this.providers.get('deepseek');
        const deepseekApiKey = config.get<string>('deepseekApiKey');
        status.push({
            provider: 'deepseek',
            configured: !!deepseekApiKey,
            available: !!deepseekProvider,
            modelCount: deepseekProvider ? DeepSeekProvider.MODELS.length : 0
        });

        // Check OpenRouter
        const openrouterProvider = this.providers.get('openrouter');
        const openrouterApiKey = config.get<string>('openrouterApiKey');
        status.push({
            provider: 'openrouter',
            configured: !!openrouterApiKey,
            available: !!openrouterProvider,
            modelCount: 0 // Will be populated when models are fetched
        });

        return status;
    }

    /**
     * Refreshes provider configurations
     */
    refreshProviders(): void {
        this.providers.clear();
        this.initializeProviders();
    }

    private updateCostTracker(cost: number): void {
        const now = new Date();
        const lastReset = new Date(this.costTracker.lastReset);
        
        // Check if we need to reset daily usage (new day)
        if (now.getDate() !== lastReset.getDate() || 
            now.getMonth() !== lastReset.getMonth() || 
            now.getFullYear() !== lastReset.getFullYear()) {
            this.resetDailyCost();
        }

        this.costTracker.dailyUsage += cost;
        this.costTracker.totalUsage += cost;
        this.saveCostTracker();

        // Warn user when approaching limit
        const usage = this.costTracker.dailyUsage;
        const limit = this.costTracker.dailyLimit;
        if (usage >= limit * 0.8 && usage < limit * 0.9) {
            vscode.window.showWarningMessage(
                `API usage approaching daily limit: $${usage.toFixed(4)} / $${limit.toFixed(2)}`
            );
        } else if (usage >= limit * 0.9 && usage < limit) {
            vscode.window.showWarningMessage(
                `API usage near daily limit: $${usage.toFixed(4)} / $${limit.toFixed(2)}. Consider upgrading or reducing usage.`
            );
        }
    }

    private loadCostTracker(): CostTracker {
        const stored = this.context.globalState.get<CostTracker>('costTracker');
        if (stored) {
            return {
                ...stored,
                lastReset: new Date(stored.lastReset)
            };
        }

        // Default cost tracker
        return {
            dailyUsage: 0,
            dailyLimit: 5.0, // $5 daily limit by default
            totalUsage: 0,
            lastReset: new Date()
        };
    }

    private saveCostTracker(): void {
        this.context.globalState.update('costTracker', this.costTracker);
    }
}