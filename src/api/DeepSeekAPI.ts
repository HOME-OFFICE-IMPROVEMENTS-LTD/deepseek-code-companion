import * as vscode from 'vscode';
import axios, { AxiosInstance } from 'axios';

export interface DeepSeekMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface DeepSeekResponse {
    choices: Array<{
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export interface QueryType {
    type: 'code_generation' | 'refactoring' | 'explanation' | 'general_chat' | 'workspace_analysis';
    confidence: number;
    context?: string;
}

export class DeepSeekAPI {
    private client: AxiosInstance;
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        this.config = vscode.workspace.getConfiguration('deepseek');
        this.client = axios.create({
            baseURL: this.config.get('baseUrl', 'https://api.deepseek.com'),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.get('apiKey', '')}`
            },
            timeout: 30000
        });
    }

    /**
     * Detect the type of query based on content and context
     */
    detectQueryType(query: string, context?: string): QueryType {
        const lowerQuery = query.toLowerCase();
        
        // Code generation patterns
        if (lowerQuery.includes('generate') || lowerQuery.includes('create') || 
            lowerQuery.includes('write code') || lowerQuery.includes('implement')) {
            return { type: 'code_generation', confidence: 0.8, context };
        }
        
        // Refactoring patterns
        if (lowerQuery.includes('refactor') || lowerQuery.includes('optimize') || 
            lowerQuery.includes('improve') || lowerQuery.includes('clean up')) {
            return { type: 'refactoring', confidence: 0.8, context };
        }
        
        // Explanation patterns
        if (lowerQuery.includes('explain') || lowerQuery.includes('what does') || 
            lowerQuery.includes('how does') || lowerQuery.includes('understand')) {
            return { type: 'explanation', confidence: 0.7, context };
        }
        
        // Workspace analysis patterns
        if (lowerQuery.includes('analyze') || lowerQuery.includes('project structure') || 
            lowerQuery.includes('codebase') || lowerQuery.includes('dependencies')) {
            return { type: 'workspace_analysis', confidence: 0.7, context };
        }
        
        // Default to general chat
        return { type: 'general_chat', confidence: 0.5, context };
    }

    /**
     * Send a chat completion request to DeepSeek API
     */
    async chatCompletion(messages: DeepSeekMessage[], queryType?: QueryType): Promise<string> {
        try {
            const apiKey = this.config.get('apiKey', '');
            if (!apiKey) {
                throw new Error('DeepSeek API key not configured. Please set it in settings.');
            }

            // Prepare system message based on query type
            const systemMessage = this.getSystemMessage(queryType);
            const allMessages = [systemMessage, ...messages];

            const response = await this.client.post('/v1/chat/completions', {
                model: this.config.get('model', 'deepseek-coder'),
                messages: allMessages,
                max_tokens: this.config.get('maxTokens', 4000),
                temperature: 0.7,
                stream: false
            });

            if (response.data.choices && response.data.choices.length > 0) {
                return response.data.choices[0].message.content;
            } else {
                throw new Error('No response from DeepSeek API');
            }
        } catch (error) {
            console.error('DeepSeek API Error:', error);
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                if (status === 401) {
                    throw new Error('Invalid API key. Please check your DeepSeek API key in settings.');
                } else if (status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                } else if (status && status >= 500) {
                    throw new Error('DeepSeek API service error. Please try again later.');
                }
                throw new Error(`API Error: ${error.response?.statusText || error.message}`);
            }
            throw error;
        }
    }

    /**
     * Get appropriate system message based on query type
     */
    private getSystemMessage(queryType?: QueryType): DeepSeekMessage {
        if (!queryType) {
            return {
                role: 'system',
                content: 'You are DeepSeek Code Companion, an AI assistant specialized in code analysis, generation, and refactoring. Provide helpful, accurate, and well-structured responses.'
            };
        }

        switch (queryType.type) {
            case 'code_generation':
                return {
                    role: 'system',
                    content: 'You are a code generation specialist. Generate clean, efficient, and well-documented code following best practices. Include comments explaining complex logic.'
                };
            case 'refactoring':
                return {
                    role: 'system',
                    content: 'You are a code refactoring expert. Improve code quality, readability, and performance while maintaining functionality. Explain the changes made.'
                };
            case 'explanation':
                return {
                    role: 'system',
                    content: 'You are a code explanation expert. Provide clear, detailed explanations of code functionality, breaking down complex concepts into understandable parts.'
                };
            case 'workspace_analysis':
                return {
                    role: 'system',
                    content: 'You are a codebase analysis expert. Analyze project structure, dependencies, patterns, and provide insights about code organization and architecture.'
                };
            default:
                return {
                    role: 'system',
                    content: 'You are DeepSeek Code Companion, a helpful AI assistant for coding tasks. Provide accurate and helpful responses.'
                };
        }
    }

    /**
     * Test the API connection
     */
    async testConnection(): Promise<boolean> {
        try {
            const response = await this.chatCompletion([
                { role: 'user', content: 'Hello, can you respond with just "OK"?' }
            ]);
            return response.trim().toLowerCase().includes('ok');
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    /**
     * Update configuration
     */
    updateConfiguration() {
        this.config = vscode.workspace.getConfiguration('deepseek');
        this.client.defaults.baseURL = this.config.get('baseUrl', 'https://api.deepseek.com');
        this.client.defaults.headers['Authorization'] = `Bearer ${this.config.get('apiKey', '')}`;
    }
}