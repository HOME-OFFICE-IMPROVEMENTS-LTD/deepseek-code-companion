import * as assert from 'assert';
import { DeepSeekProvider, OpenRouterProvider } from '../ModelProvider';
import { ModelManager } from '../ModelManager';
import * as vscode from 'vscode';

suite('ModelProvider Tests', () => {
    const mockApiKey = 'test-api-key-123';
    const mockConfig = { apiKey: mockApiKey };

    suite('DeepSeekProvider', () => {
        let provider: DeepSeekProvider;

        setup(() => {
            provider = new DeepSeekProvider(mockConfig);
        });

        test('should return available models', async () => {
            const models = await provider.getAvailableModels();
            assert.strictEqual(models.length, 2);
            assert.strictEqual(models[0].provider, 'deepseek');
            assert.strictEqual(models[0].id, 'deepseek-chat');
            assert.strictEqual(models[1].id, 'deepseek-coder');
        });

        test('should validate API key requirement', async () => {
            const providerWithoutKey = new DeepSeekProvider({ apiKey: '' });
            try {
                await providerWithoutKey.sendMessage(
                    [{ role: 'user', content: 'test' }], 
                    'deepseek-chat'
                );
                assert.fail('Should have thrown error for missing API key');
            } catch (error) {
                assert.strictEqual((error as Error).message, 'DeepSeek API key is required');
            }
        });

        test('should throw error for invalid model', async () => {
            try {
                await provider.sendMessage(
                    [{ role: 'user', content: 'test' }], 
                    'invalid-model'
                );
                assert.fail('Should have thrown error for invalid model');
            } catch (error) {
                assert.strictEqual((error as Error).message, 'Model invalid-model not found');
            }
        });

        test('should calculate cost correctly', async () => {
            const models = await provider.getAvailableModels();
            const model = models[0];
            
            // Test protected method through inheritance
            class TestProvider extends DeepSeekProvider {
                public testCalculateCost(inputTokens: number, outputTokens: number) {
                    return this.calculateCost(inputTokens, outputTokens, model);
                }
            }
            
            const testProvider = new TestProvider(mockConfig);
            const cost = testProvider.testCalculateCost(1000, 500);
            
            // Expected: (1000/1000 * 0.0014) + (500/1000 * 0.0028) = 0.0014 + 0.0014 = 0.0028
            assert.strictEqual(cost, 0.0028);
        });
    });

    suite('OpenRouterProvider', () => {
        let provider: OpenRouterProvider;

        setup(() => {
            provider = new OpenRouterProvider(mockConfig);
        });

        test('should handle cached models', async () => {
            // Mock fetch for the first call
            const originalFetch = global.fetch;
            global.fetch = async () => ({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            id: 'openai/gpt-4',
                            name: 'GPT-4',
                            context_length: 8192,
                            pricing: { prompt: '0.03', completion: '0.06' }
                        }
                    ]
                })
            } as any);

            const models1 = await provider.getAvailableModels();
            const models2 = await provider.getAvailableModels(); // Should use cache

            assert.strictEqual(models1.length, 1);
            assert.strictEqual(models2.length, 1);
            assert.strictEqual(models1[0].id, 'openai/gpt-4');
            assert.strictEqual(models1[0].provider, 'openrouter');

            global.fetch = originalFetch;
        });

        test('should infer capabilities correctly', async () => {
            // Mock fetch to return a code model
            const originalFetch = global.fetch;
            global.fetch = async () => ({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            id: 'deepseek/deepseek-coder',
                            name: 'DeepSeek Coder',
                            context_length: 16384,
                            pricing: { prompt: '0.0014', completion: '0.0028' }
                        }
                    ]
                })
            } as any);

            const models = await provider.getAvailableModels();
            const codeModel = models[0];
            
            assert.ok(codeModel.capabilities.includes('chat'));
            assert.ok(codeModel.capabilities.includes('code-generation'));
            assert.ok(codeModel.capabilities.includes('code-review'));
            assert.ok(codeModel.capabilities.includes('debugging'));

            global.fetch = originalFetch;
        });

        test('should handle API errors gracefully', async () => {
            const originalFetch = global.fetch;
            global.fetch = async () => ({
                ok: false,
                status: 401,
                statusText: 'Unauthorized'
            } as any);

            try {
                await provider.getAvailableModels();
                assert.fail('Should have thrown error for API failure');
            } catch (error) {
                assert.ok((error as Error).message.includes('Failed to fetch OpenRouter models'));
            }

            global.fetch = originalFetch;
        });
    });

    suite('ModelManager Integration', () => {
        let mockContext: vscode.ExtensionContext;
        let manager: ModelManager;

        setup(() => {
            // Mock VS Code extension context
            mockContext = {
                globalState: {
                    get: (key: string) => {
                        if (key === 'costTracker') {
                            return {
                                dailyUsage: 0,
                                dailyLimit: 5.0,
                                totalUsage: 0,
                                lastReset: new Date()
                            };
                        }
                        return undefined;
                    },
                    update: async () => {}
                }
            } as any;

            // Mock configuration
            const mockConfig = {
                get: (key: string) => {
                    switch (key) {
                        case 'deepseekApiKey': return 'test-deepseek-key';
                        case 'openrouterApiKey': return 'test-openrouter-key';
                        case 'dailyCostLimit': return 5.0;
                        default: return undefined;
                    }
                }
            };

            // Mock vscode.workspace.getConfiguration
            const originalGetConfig = vscode.workspace.getConfiguration;
            vscode.workspace.getConfiguration = () => mockConfig as any;

            manager = new ModelManager(mockContext);

            // Restore after test
            vscode.workspace.getConfiguration = originalGetConfig;
        });

        test('should track cost correctly', async () => {
            const initialTracker = manager.getCostTracker();
            assert.strictEqual(initialTracker.dailyUsage, 0);
            assert.strictEqual(initialTracker.dailyLimit, 5.0);
        });

        test('should update daily limit', () => {
            manager.updateDailyLimit(10.0);
            const tracker = manager.getCostTracker();
            assert.strictEqual(tracker.dailyLimit, 10.0);
        });

        test('should reset daily cost', () => {
            manager.resetDailyCost();
            const tracker = manager.getCostTracker();
            assert.strictEqual(tracker.dailyUsage, 0);
        });

        test('should get provider status', () => {
            const status = manager.getProviderStatus();
            assert.strictEqual(status.length, 2);
            
            const deepseekStatus = status.find(s => s.provider === 'deepseek');
            assert.ok(deepseekStatus);
            assert.strictEqual(deepseekStatus.configured, true);
            
            const openrouterStatus = status.find(s => s.provider === 'openrouter');
            assert.ok(openrouterStatus);
            assert.strictEqual(openrouterStatus.configured, true);
        });
    });

    suite('Error Handling', () => {
        test('should handle network timeouts', async () => {
            const provider = new DeepSeekProvider({ apiKey: 'test-key' });
            
            // Mock fetch to timeout
            const originalFetch = global.fetch;
            global.fetch = async () => {
                throw new Error('Network timeout');
            };

            try {
                await provider.sendMessage(
                    [{ role: 'user', content: 'test' }], 
                    'deepseek-chat'
                );
                assert.fail('Should have thrown network error');
            } catch (error) {
                assert.ok((error as Error).message.includes('DeepSeek request failed'));
            }

            global.fetch = originalFetch;
        });

        test('should handle invalid JSON responses', async () => {
            const provider = new DeepSeekProvider({ apiKey: 'test-key' });
            
            const originalFetch = global.fetch;
            global.fetch = async () => ({
                ok: true,
                json: async () => {
                    throw new Error('Invalid JSON');
                }
            } as any);

            try {
                await provider.sendMessage(
                    [{ role: 'user', content: 'test' }], 
                    'deepseek-chat'
                );
                assert.fail('Should have thrown JSON error');
            } catch (error) {
                assert.ok((error as Error).message.includes('DeepSeek request failed'));
            }

            global.fetch = originalFetch;
        });
    });

    suite('Message Formatting', () => {
        test('should format messages correctly', async () => {
            const provider = new DeepSeekProvider({ apiKey: 'test-key' });
            let capturedBody: any;
            
            const originalFetch = global.fetch;
            global.fetch = async (url: any, options: any) => {
                capturedBody = JSON.parse(options.body);
                return {
                    ok: true,
                    json: async () => ({
                        choices: [{ message: { content: 'Test response' } }],
                        usage: { prompt_tokens: 10, completion_tokens: 5 }
                    })
                } as any;
            };

            const messages = [
                { role: 'system' as const, content: 'You are a helpful assistant' },
                { role: 'user' as const, content: 'Hello!' }
            ];

            await provider.sendMessage(messages, 'deepseek-chat');

            assert.strictEqual(capturedBody.model, 'deepseek-chat');
            assert.strictEqual(capturedBody.messages.length, 2);
            assert.strictEqual(capturedBody.messages[0].role, 'system');
            assert.strictEqual(capturedBody.messages[0].content, 'You are a helpful assistant');
            assert.strictEqual(capturedBody.messages[1].role, 'user');
            assert.strictEqual(capturedBody.messages[1].content, 'Hello!');

            global.fetch = originalFetch;
        });
    });
});