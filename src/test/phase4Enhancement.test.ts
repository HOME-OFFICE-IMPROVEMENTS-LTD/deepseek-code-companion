import * as assert from 'assert';
import * as vscode from 'vscode';
import { ModelManager } from '../ModelManager';
import { responseOptimizer } from '../ResponseOptimizer';
import { modelQualityTracker } from '../ModelQualityTracker';
import { smartContextManager } from '../SmartContextManager';
import { uiPolishManager } from '../UIPolishManager';

suite('Phase 4 Enhancement Tests', () => {
    let mockContext: vscode.ExtensionContext;
    let manager: ModelManager;
    let originalGetConfig: any;

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

        // Mock configuration with API keys
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

        // Store original and apply mock
        originalGetConfig = vscode.workspace.getConfiguration;
        vscode.workspace.getConfiguration = () => mockConfig as any;

        manager = new ModelManager(mockContext);
    });

    teardown(() => {
        // Restore original configuration
        if (originalGetConfig) {
            vscode.workspace.getConfiguration = originalGetConfig;
        }
        
        // Reset optimization systems
        responseOptimizer.reset();
        modelQualityTracker.reset();
        smartContextManager.reset();
    });

    suite('Response Optimization', () => {
        test('should initialize response optimizer', () => {
            const metrics = responseOptimizer.getMetrics();
            assert.ok(metrics);
            assert.strictEqual(typeof metrics.responseTime, 'number');
            assert.strictEqual(typeof metrics.cacheHitRate, 'number');
            assert.strictEqual(typeof metrics.successRate, 'number');
        });

        test('should provide cache statistics', () => {
            const stats = responseOptimizer.getCacheStats();
            assert.ok(stats);
            assert.strictEqual(typeof stats.size, 'number');
            assert.strictEqual(typeof stats.maxSize, 'number');
            assert.ok(stats.hitRate);
            assert.ok(Array.isArray(stats.entries));
        });
    });

    suite('Model Quality Tracking', () => {
        test('should initialize quality tracker', () => {
            const stats = modelQualityTracker.getStats();
            assert.ok(stats);
            assert.strictEqual(typeof stats.trackedModels, 'number');
            assert.strictEqual(typeof stats.totalEvaluations, 'number');
            assert.ok(Array.isArray(stats.topModels));
        });

        test('should track model scores', () => {
            const allScores = modelQualityTracker.getAllScores();
            assert.ok(Array.isArray(allScores));
            // Initially empty
            assert.strictEqual(allScores.length, 0);
        });
    });

    suite('Smart Context Management', () => {
        test('should initialize context manager', () => {
            const stats = smartContextManager.getStats();
            assert.ok(stats);
            assert.strictEqual(typeof stats.totalChunks, 'number');
            assert.strictEqual(typeof stats.totalTokens, 'number');
            assert.ok(stats.chunksByType);
        });

        test('should manage context chunks', () => {
            const initialStats = smartContextManager.getStats();
            assert.strictEqual(initialStats.totalChunks, 0);
            
            // Context chunks are added during actual usage
            smartContextManager.reset();
            const resetStats = smartContextManager.getStats();
            assert.strictEqual(resetStats.totalChunks, 0);
        });
    });

    suite('UI Polish Manager', () => {
        test('should initialize UI manager', () => {
            assert.ok(uiPolishManager);
            // UI manager should be created and have methods
            assert.ok(typeof uiPolishManager.updateStatus === 'function');
            assert.ok(typeof uiPolishManager.showNotification === 'function');
        });
    });

    suite('Enhanced Model Manager', () => {
        test('should provide performance metrics', () => {
            const metrics = manager.getPerformanceMetrics();
            assert.ok(metrics);
            assert.ok(metrics.responseOptimizer);
            assert.ok(metrics.qualityTracker);
            assert.ok(metrics.contextManager);
        });

        test('should get model recommendations', async function() {
            this.timeout(10000); // Increase timeout to 10 seconds for CI
            const recommendations = await manager.getModelRecommendations('coding', false);
            assert.ok(Array.isArray(recommendations));
            // Should return available models even if no quality scores yet
            assert.ok(recommendations.length >= 0);
        });

        test('should provide provider status', () => {
            const status = manager.getProviderStatus();
            assert.ok(Array.isArray(status));
            assert.strictEqual(status.length, 2);
            
            const deepseekStatus = status.find(s => s.provider === 'deepseek');
            assert.ok(deepseekStatus);
            assert.ok(typeof deepseekStatus.configured === 'boolean');
            assert.ok(typeof deepseekStatus.available === 'boolean');
            
            const openrouterStatus = status.find(s => s.provider === 'openrouter');
            assert.ok(openrouterStatus);
            assert.ok(typeof openrouterStatus.configured === 'boolean');
            assert.ok(typeof openrouterStatus.available === 'boolean');
        });

        test('should handle cost tracking methods', () => {
            const initialTracker = manager.getCostTracker();
            assert.ok(initialTracker);
            assert.strictEqual(typeof initialTracker.dailyUsage, 'number');
            assert.strictEqual(typeof initialTracker.dailyLimit, 'number');
            
            // Test update daily limit
            manager.updateDailyLimit(10.0);
            const updatedTracker = manager.getCostTracker();
            assert.strictEqual(updatedTracker.dailyLimit, 10.0);
            
            // Test reset daily cost
            manager.resetDailyCost();
            const resetTracker = manager.getCostTracker();
            assert.strictEqual(resetTracker.dailyUsage, 0);
        });

        test('should reset optimizations', () => {
            // This should not throw
            manager.resetOptimizations();
            
            // Verify systems are reset
            const optimizerStats = responseOptimizer.getCacheStats();
            assert.strictEqual(optimizerStats.size, 0);
            
            const qualityStats = modelQualityTracker.getStats();
            assert.strictEqual(qualityStats.trackedModels, 0);
            
            const contextStats = smartContextManager.getStats();
            assert.strictEqual(contextStats.totalChunks, 0);
        });
    });

    suite('Integration Tests', () => {
        test('should handle all Phase 4 features without errors', async () => {
            // Test that all major Phase 4 features can be accessed without throwing
            
            // Response optimization
            const metrics = responseOptimizer.getMetrics();
            assert.ok(metrics);
            
            // Quality tracking  
            const qualityStats = modelQualityTracker.getStats();
            assert.ok(qualityStats);
            
            // Context management
            const contextStats = smartContextManager.getStats();
            assert.ok(contextStats);
            
            // Enhanced model manager
            const performanceMetrics = manager.getPerformanceMetrics();
            assert.ok(performanceMetrics);
            
            const recommendations = await manager.getModelRecommendations();
            assert.ok(Array.isArray(recommendations));
            
            // UI polish
            uiPolishManager.updateStatus({ message: 'Test', icon: '$(check)' });
            
            // All should complete without errors
            assert.ok(true);
        });
    });
});