import * as assert from 'assert';
import { DeepSeekAPI } from '../api/DeepSeekAPI';

suite('DeepSeek API Tests', () => {
    test('Query type detection - Code Generation', () => {
        const api = new DeepSeekAPI();
        const queryType = api.detectQueryType('Generate a function to sort an array');
        
        assert.strictEqual(queryType.type, 'code_generation');
        assert.ok(queryType.confidence >= 0.7);
    });

    test('Query type detection - Refactoring', () => {
        const api = new DeepSeekAPI();
        const queryType = api.detectQueryType('Refactor this code to improve performance');
        
        assert.strictEqual(queryType.type, 'refactoring');
        assert.ok(queryType.confidence >= 0.7);
    });

    test('Query type detection - Explanation', () => {
        const api = new DeepSeekAPI();
        const queryType = api.detectQueryType('Explain what this function does');
        
        assert.strictEqual(queryType.type, 'explanation');
        assert.ok(queryType.confidence >= 0.7);
    });

    test('Query type detection - Workspace Analysis', () => {
        const api = new DeepSeekAPI();
        const queryType = api.detectQueryType('Analyze my project structure');
        
        assert.strictEqual(queryType.type, 'workspace_analysis');
        assert.ok(queryType.confidence >= 0.7);
    });

    test('Query type detection - General Chat', () => {
        const api = new DeepSeekAPI();
        const queryType = api.detectQueryType('Hello, how are you?');
        
        assert.strictEqual(queryType.type, 'general_chat');
    });
});