import * as vscode from 'vscode';
import { BaseModelProvider, DeepSeekProvider, OpenRouterProvider } from './ModelProvider';
import { ModelConfig, ChatMessage, ModelResponse, CostTracker } from './types';

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
        if (openrouterApiKey) {
            this.providers.set('openrouter', new OpenRouterProvider({ apiKey: openrouterApiKey }));
        }
    }

    async getAllAvailableModels(): Promise<ModelConfig[]> {
        const allModels: ModelConfig[] = [];
        
        for (const [providerName, provider] of this.providers) {
            try {
                const models = await provider.getAvailableModels();
                allModels.push(...models);
            } catch (error) {
                console.warn(`Failed to get models from ${providerName}:`, error);
                vscode.window.showWarningMessage(`Failed to load models from ${providerName}`);
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
        // Check daily cost limit
        if (this.costTracker.dailyUsage >= this.costTracker.dailyLimit) {
            throw new Error(`Daily cost limit of $${this.costTracker.dailyLimit.toFixed(2)} reached. Usage will reset at midnight.`);
        }

        // Find the appropriate provider
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
            const response = await provider.sendMessage(messages, modelId, options);
            
            // Update cost tracking
            this.updateCostTracker(response.usage.totalCost);
            
            return response;
        } catch (error) {
            throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    getCostTracker(): CostTracker {
        return { ...this.costTracker };
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

    refreshProviders(): void {
        this.providers.clear();
        this.initializeProviders();
    }

    getProviderStatus(): { provider: string; configured: boolean; modelsAvailable: boolean }[] {
        const status: { provider: string; configured: boolean; modelsAvailable: boolean }[] = [];
        
        const config = vscode.workspace.getConfiguration('deepseekCodeCompanion');
        
        status.push({
            provider: 'deepseek',
            configured: !!config.get<string>('deepseekApiKey'),
            modelsAvailable: this.providers.has('deepseek')
        });

        status.push({
            provider: 'openrouter',
            configured: !!config.get<string>('openrouterApiKey'),
            modelsAvailable: this.providers.has('openrouter')
        });

        return status;
    }
}