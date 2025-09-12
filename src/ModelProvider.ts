import { ModelConfig, ChatMessage, ModelResponse, ProviderConfig } from './types';

export abstract class BaseModelProvider {
    protected config: ProviderConfig;
    protected modelConfigs: ModelConfig[];

    constructor(config: ProviderConfig) {
        this.config = config;
        this.modelConfigs = [];
    }

    abstract getAvailableModels(): Promise<ModelConfig[]>;
    abstract sendMessage(
        messages: ChatMessage[], 
        modelId: string, 
        options?: { maxTokens?: number; temperature?: number }
    ): Promise<ModelResponse>;
    
    protected calculateCost(inputTokens: number, outputTokens: number, model: ModelConfig): number {
        const inputCost = (inputTokens / 1000) * model.costPer1kTokens.input;
        const outputCost = (outputTokens / 1000) * model.costPer1kTokens.output;
        return inputCost + outputCost;
    }

    protected validateApiKey(): boolean {
        return !!this.config.apiKey && this.config.apiKey.length > 0;
    }
}

export class DeepSeekProvider extends BaseModelProvider {
    private static readonly MODELS: ModelConfig[] = [
        {
            id: 'deepseek-chat',
            name: 'DeepSeek Chat',
            provider: 'deepseek',
            maxTokens: 4096,
            costPer1kTokens: { input: 0.0014, output: 0.0028 },
            capabilities: ['chat', 'code-analysis', 'debugging']
        },
        {
            id: 'deepseek-coder',
            name: 'DeepSeek Coder',
            provider: 'deepseek',
            maxTokens: 16384,
            costPer1kTokens: { input: 0.0014, output: 0.0028 },
            capabilities: ['code-generation', 'code-review', 'refactoring']
        }
    ];

    async getAvailableModels(): Promise<ModelConfig[]> {
        return DeepSeekProvider.MODELS;
    }

    async sendMessage(
        messages: ChatMessage[], 
        modelId: string, 
        options: { maxTokens?: number; temperature?: number } = {}
    ): Promise<ModelResponse> {
        if (!this.validateApiKey()) {
            throw new Error('DeepSeek API key is required');
        }

        const model = DeepSeekProvider.MODELS.find(m => m.id === modelId);
        if (!model) {
            throw new Error(`Model ${modelId} not found`);
        }

        try {
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: messages.map(m => ({ role: m.role, content: m.content })),
                    max_tokens: options.maxTokens || model.maxTokens,
                    temperature: options.temperature || 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as any;
            const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };
            const totalCost = this.calculateCost(usage.prompt_tokens, usage.completion_tokens, model);

            return {
                content: data.choices[0]?.message?.content || '',
                usage: {
                    inputTokens: usage.prompt_tokens,
                    outputTokens: usage.completion_tokens,
                    totalCost
                },
                model: modelId,
                provider: 'deepseek'
            };
        } catch (error) {
            throw new Error(`DeepSeek request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export class OpenRouterProvider extends BaseModelProvider {
    private cachedModels: ModelConfig[] = [];
    private lastModelFetch = 0;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    async getAvailableModels(): Promise<ModelConfig[]> {
        const now = Date.now();
        if (this.cachedModels.length > 0 && now - this.lastModelFetch < this.CACHE_DURATION) {
            return this.cachedModels;
        }

        try {
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'HTTP-Referer': 'https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/deepseek-code-companion',
                    'X-Title': 'DeepSeek Code Companion'
                }
            });

            if (!response.ok) {
                throw new Error(`OpenRouter API error: ${response.status}`);
            }

            const data = await response.json() as any;
            this.cachedModels = data.data.map((model: any) => ({
                id: model.id,
                name: model.name,
                provider: 'openrouter' as const,
                maxTokens: model.context_length || 4096,
                costPer1kTokens: {
                    input: parseFloat(model.pricing?.prompt || '0'),
                    output: parseFloat(model.pricing?.completion || '0')
                },
                capabilities: this.inferCapabilities(model.id, model.name)
            }));

            this.lastModelFetch = now;
            return this.cachedModels;
        } catch (error) {
            // Return cached models if available, otherwise empty array
            if (this.cachedModels.length > 0) {
                console.warn('Using cached OpenRouter models due to API error:', error);
                return this.cachedModels;
            }
            throw new Error(`Failed to fetch OpenRouter models: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async sendMessage(
        messages: ChatMessage[], 
        modelId: string, 
        options: { maxTokens?: number; temperature?: number } = {}
    ): Promise<ModelResponse> {
        if (!this.validateApiKey()) {
            throw new Error('OpenRouter API key is required');
        }

        const models = await this.getAvailableModels();
        const model = models.find(m => m.id === modelId);
        if (!model) {
            throw new Error(`Model ${modelId} not found in OpenRouter`);
        }

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'HTTP-Referer': 'https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/deepseek-code-companion',
                    'X-Title': 'DeepSeek Code Companion'
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: messages.map(m => ({ role: m.role, content: m.content })),
                    max_tokens: options.maxTokens || Math.min(model.maxTokens, 4096),
                    temperature: options.temperature || 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})) as any;
                throw new Error(`OpenRouter API error: ${response.status} ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json() as any;
            const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };
            const totalCost = this.calculateCost(usage.prompt_tokens, usage.completion_tokens, model);

            return {
                content: data.choices[0]?.message?.content || '',
                usage: {
                    inputTokens: usage.prompt_tokens,
                    outputTokens: usage.completion_tokens,
                    totalCost
                },
                model: modelId,
                provider: 'openrouter'
            };
        } catch (error) {
            throw new Error(`OpenRouter request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private inferCapabilities(modelId: string, modelName: string): string[] {
        const id = modelId.toLowerCase();
        const name = modelName.toLowerCase();
        const capabilities: string[] = ['chat'];

        if (id.includes('code') || name.includes('code') || id.includes('deepseek-coder')) {
            capabilities.push('code-generation', 'code-review', 'debugging');
        }
        if (id.includes('gpt-4') || id.includes('claude') || id.includes('gemini')) {
            capabilities.push('advanced-reasoning', 'complex-analysis');
        }
        if (id.includes('vision') || name.includes('vision')) {
            capabilities.push('image-analysis');
        }

        return capabilities;
    }
}