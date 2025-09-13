import * as vscode from 'vscode';
import { ChatMessage, ModelConfig } from './types';

export interface ContextChunk {
    content: string;
    type: 'workspace' | 'file' | 'selection' | 'chat_history' | 'error' | 'documentation';
    priority: number;
    timestamp: number;
    relevanceScore?: number;
    tokenCount: number;
    source: string;
}

export interface ContextOptimizationSettings {
    maxTokens: number;
    prioritizeRecent: boolean;
    includeWorkspaceContext: boolean;
    includeErrorContext: boolean;
    adaptiveContextRatio: boolean;
    contextCompressionRatio: number;
}

export class SmartContextManager {
    private contextChunks: ContextChunk[] = [];
    private readonly maxContextHistory = 200;
    private settings: ContextOptimizationSettings = {
        maxTokens: 8000,
        prioritizeRecent: true,
        includeWorkspaceContext: true,
        includeErrorContext: true,
        adaptiveContextRatio: true,
        contextCompressionRatio: 0.7
    };

    /**
     * Optimizes context for a specific model and conversation
     */
    async optimizeContext(
        messages: ChatMessage[],
        modelConfig: ModelConfig,
        taskType: 'coding' | 'general' | 'analysis' | 'creative' = 'general'
    ): Promise<{
        optimizedMessages: ChatMessage[];
        contextSummary: string;
        tokensUsed: number;
        compressionApplied: boolean;
    }> {
                // PRESERVE README-ENHANCED MESSAGES FROM OPTIMIZATION
        // Check if any message contains README content that was enhanced by ChatViewProvider
        console.log('[SmartContextManager] Checking messages for README content...');
        console.log('[SmartContextManager] Message count:', messages.length);
        messages.forEach((msg, i) => {
            console.log(`[SmartContextManager] Message ${i} content length:`, msg.content.length);
            console.log(`[SmartContextManager] Message ${i} has README marker:`, msg.content.includes('[SYSTEM: Here is the README.md content for context:]'));
            console.log(`[SmartContextManager] Message ${i} has README (any):`, msg.content.toLowerCase().includes('readme'));
            console.log(`[SmartContextManager] Message ${i} preview:`, msg.content.substring(0, 100) + '...');
        });
        
        const hasReadmeContent = messages.some(msg => 
            msg.content.includes('[SYSTEM: Here is the README.md content for context:]') ||
            msg.content.toLowerCase().includes('readme.md content for context')
        );
        
        if (hasReadmeContent) {
            console.log('[SmartContextManager] ✅ PRESERVING README-enhanced messages from optimization');
            // Return messages as-is to preserve README content
            return {
                optimizedMessages: messages,
                contextSummary: 'README content preserved',
                tokensUsed: messages.reduce((sum, msg) => sum + this.estimateTokenCount(msg.content), 0),
                compressionApplied: false
            };
        } else {
            console.log('[SmartContextManager] ❌ No README content found, proceeding with optimization');
        }
        
        const availableTokens = Math.floor(modelConfig.maxTokens * 0.8); // Reserve 20% for response
        const targetContextTokens = Math.min(availableTokens, this.settings.maxTokens);

        // Gather all available context
        await this.gatherCurrentContext(taskType);

        // Score and prioritize context chunks
        const prioritizedContext = this.prioritizeContext(messages, taskType);

        // Build optimized context within token limits
        const result = this.buildOptimizedContext(
            messages,
            prioritizedContext,
            targetContextTokens,
            taskType
        );

        return result;
    }

    /**
     * Gathers current workspace and editor context
     */
    private async gatherCurrentContext(taskType: 'coding' | 'general' | 'analysis' | 'creative'): Promise<void> {
        const currentTime = Date.now();

        try {
            // Get active editor content
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && this.settings.includeWorkspaceContext) {
                await this.addEditorContext(activeEditor, currentTime);
            }

            // Get workspace information
            if (vscode.workspace.workspaceFolders && this.settings.includeWorkspaceContext) {
                await this.addWorkspaceContext(currentTime, taskType);
            }

            // Get recent error diagnostics
            if (this.settings.includeErrorContext) {
                await this.addErrorContext(currentTime);
            }

            // Clean old context
            this.cleanOldContext();

        } catch (error) {
            console.warn('Failed to gather context:', error);
        }
    }

    /**
     * Adds context from the active editor
     */
    private async addEditorContext(editor: vscode.TextEditor, timestamp: number): Promise<void> {
        const document = editor.document;
        const selection = editor.selection;

        // Add selected text if any
        if (!selection.isEmpty) {
            const selectedText = document.getText(selection);
            this.addContextChunk({
                content: selectedText,
                type: 'selection',
                priority: 90,
                timestamp,
                tokenCount: this.estimateTokenCount(selectedText),
                source: `${document.fileName}:${selection.start.line + 1}-${selection.end.line + 1}`
            });
        }

        // Add current file context (around cursor or selection)
        const contextLines = this.getFileContext(document, selection.active, 20);
        if (contextLines) {
            this.addContextChunk({
                content: contextLines,
                type: 'file',
                priority: 75,
                timestamp,
                tokenCount: this.estimateTokenCount(contextLines),
                source: document.fileName
            });
        }
    }

    /**
     * Adds workspace-level context
     */
    private async addWorkspaceContext(timestamp: number, taskType: string): Promise<void> {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceRoot) {
            return;
        }

        try {
            // Get package.json or similar project files
            const projectFiles = await vscode.workspace.findFiles(
                '{package.json,tsconfig.json,requirements.txt,Cargo.toml,go.mod}',
                '**/node_modules/**',
                5
            );

            for (const file of projectFiles) {
                const content = await vscode.workspace.fs.readFile(file);
                const textContent = Buffer.from(content).toString('utf8');
                
                this.addContextChunk({
                    content: textContent.substring(0, 1000), // Limit size
                    type: 'workspace',
                    priority: 60,
                    timestamp,
                    tokenCount: this.estimateTokenCount(textContent.substring(0, 1000)),
                    source: file.path
                });
            }

            // Add README if exists
            const readmeFiles = await vscode.workspace.findFiles(
                '{README.md,README.txt,README.rst}',
                '**/node_modules/**',
                1
            );

            if (readmeFiles.length > 0) {
                const content = await vscode.workspace.fs.readFile(readmeFiles[0]);
                const textContent = Buffer.from(content).toString('utf8');
                
                this.addContextChunk({
                    content: textContent.substring(0, 2000), // Larger for README
                    type: 'documentation',
                    priority: 50,
                    timestamp,
                    tokenCount: this.estimateTokenCount(textContent.substring(0, 2000)),
                    source: readmeFiles[0].path
                });
            }

        } catch (error) {
            console.warn('Failed to gather workspace context:', error);
        }
    }

    /**
     * Adds error context from diagnostics
     */
    private async addErrorContext(timestamp: number): Promise<void> {
        const diagnostics = vscode.languages.getDiagnostics();
        
        for (const [uri, diags] of diagnostics) {
            const errors = diags.filter(d => d.severity === vscode.DiagnosticSeverity.Error);
            
            if (errors.length > 0) {
                const errorSummary = errors.slice(0, 5).map(error => 
                    `${uri.path}:${error.range.start.line + 1}: ${error.message}`
                ).join('\n');

                this.addContextChunk({
                    content: `Recent errors:\n${errorSummary}`,
                    type: 'error',
                    priority: 80,
                    timestamp,
                    tokenCount: this.estimateTokenCount(errorSummary),
                    source: 'diagnostics'
                });
            }
        }
    }

    /**
     * Gets context around a specific position in a file
     */
    private getFileContext(document: vscode.TextDocument, position: vscode.Position, lines: number): string {
        const startLine = Math.max(0, position.line - lines);
        const endLine = Math.min(document.lineCount - 1, position.line + lines);
        
        const range = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
        return document.getText(range);
    }

    /**
     * Adds a context chunk with deduplication
     */
    private addContextChunk(chunk: ContextChunk): void {
        // Remove duplicates or very similar content
        const existingIndex = this.contextChunks.findIndex(existing => 
            existing.type === chunk.type && 
            existing.source === chunk.source &&
            this.calculateSimilarity(existing.content, chunk.content) > 0.8
        );

        if (existingIndex >= 0) {
            // Update existing chunk if newer
            if (chunk.timestamp > this.contextChunks[existingIndex].timestamp) {
                this.contextChunks[existingIndex] = chunk;
            }
        } else {
            this.contextChunks.push(chunk);
        }

        // Limit total chunks
        if (this.contextChunks.length > this.maxContextHistory) {
            this.contextChunks.sort((a, b) => b.timestamp - a.timestamp);
            this.contextChunks = this.contextChunks.slice(0, this.maxContextHistory);
        }
    }

    /**
     * Prioritizes context chunks based on relevance and recency
     */
    private prioritizeContext(messages: ChatMessage[], taskType: string): ContextChunk[] {
        const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
        
        // Calculate relevance scores
        for (const chunk of this.contextChunks) {
            chunk.relevanceScore = this.calculateRelevance(chunk, lastUserMessage, taskType);
        }

        // Sort by priority and relevance
        return this.contextChunks
            .sort((a, b) => {
                const scoreA = a.priority + (a.relevanceScore || 0) * 10;
                const scoreB = b.priority + (b.relevanceScore || 0) * 10;
                
                if (this.settings.prioritizeRecent) {
                    const ageFactorA = this.calculateAgeFactor(a.timestamp);
                    const ageFactorB = this.calculateAgeFactor(b.timestamp);
                    return (scoreB * ageFactorB) - (scoreA * ageFactorA);
                }
                
                return scoreB - scoreA;
            });
    }

    /**
     * Builds optimized context within token limits
     */
    private buildOptimizedContext(
        messages: ChatMessage[],
        prioritizedContext: ContextChunk[],
        targetTokens: number,
        taskType: string
    ): {
        optimizedMessages: ChatMessage[];
        contextSummary: string;
        tokensUsed: number;
        compressionApplied: boolean;
    } {
        let tokensUsed = 0;
        let compressionApplied = false;
        const includedContext: ContextChunk[] = [];
        const contextSummaryParts: string[] = [];

        // Reserve tokens for original messages
        const messageTokens = messages.reduce((sum, msg) => 
            sum + this.estimateTokenCount(msg.content), 0
        );

        const availableForContext = Math.max(targetTokens - messageTokens, targetTokens * 0.3);

        // Add context chunks within limits
        for (const chunk of prioritizedContext) {
            if (tokensUsed + chunk.tokenCount <= availableForContext) {
                includedContext.push(chunk);
                tokensUsed += chunk.tokenCount;
                contextSummaryParts.push(`${chunk.type}: ${chunk.source}`);
            } else if (this.settings.contextCompressionRatio > 0) {
                // Try to compress and include
                const compressed = this.compressContent(chunk.content);
                const compressedTokens = this.estimateTokenCount(compressed);
                
                if (tokensUsed + compressedTokens <= availableForContext) {
                    includedContext.push({
                        ...chunk,
                        content: compressed,
                        tokenCount: compressedTokens
                    });
                    tokensUsed += compressedTokens;
                    compressionApplied = true;
                    contextSummaryParts.push(`${chunk.type} (compressed): ${chunk.source}`);
                }
            }
        }

        // Build context message
        const contextContent = this.buildContextMessage(includedContext, taskType);
        const optimizedMessages: ChatMessage[] = [];

        // Add context as system message if we have context
        if (contextContent.length > 0) {
            optimizedMessages.push({
                role: 'system',
                content: contextContent,
                timestamp: new Date()
            });
        }

        // Add original messages
        optimizedMessages.push(...messages);

        return {
            optimizedMessages,
            contextSummary: contextSummaryParts.join(', '),
            tokensUsed: tokensUsed + messageTokens,
            compressionApplied
        };
    }

    /**
     * Builds the context message from included chunks
     */
    private buildContextMessage(chunks: ContextChunk[], taskType: string): string {
        if (chunks.length === 0) {
            return '';
        }

        const sections: string[] = [];
        
        // Group by type
        const groupedChunks = chunks.reduce((groups, chunk) => {
            if (!groups[chunk.type]) {
                groups[chunk.type] = [];
            }
            groups[chunk.type].push(chunk);
            return groups;
        }, {} as Record<string, ContextChunk[]>);

        // Build sections
        if (groupedChunks.workspace) {
            sections.push('## Project Context\n' + 
                groupedChunks.workspace.map(c => c.content).join('\n\n')
            );
        }

        if (groupedChunks.file || groupedChunks.selection) {
            const fileContent = [
                ...(groupedChunks.file || []),
                ...(groupedChunks.selection || [])
            ].map(c => `From ${c.source}:\n${c.content}`).join('\n\n');
            
            sections.push('## Current File Context\n' + fileContent);
        }

        if (groupedChunks.error) {
            sections.push('## Current Issues\n' + 
                groupedChunks.error.map(c => c.content).join('\n\n')
            );
        }

        if (groupedChunks.documentation) {
            sections.push('## Documentation\n' + 
                groupedChunks.documentation.map(c => c.content).join('\n\n')
            );
        }

        return sections.join('\n\n');
    }

    /**
     * Estimates token count (rough approximation)
     */
    private estimateTokenCount(text: string): number {
        // Rough approximation: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    /**
     * Calculates similarity between two strings
     */
    private calculateSimilarity(str1: string, str2: string): number {
        const shorter = str1.length < str2.length ? str1 : str2;
        const longer = str1.length < str2.length ? str2 : str1;
        
        if (longer.length === 0) {
            return 1.0;
        }
        
        // Simple character-based similarity
        let matches = 0;
        for (let i = 0; i < shorter.length; i++) {
            if (longer.includes(shorter[i])) {
                matches++;
            }
        }
        
        return matches / longer.length;
    }

    /**
     * Calculates relevance score for a context chunk
     */
    private calculateRelevance(chunk: ContextChunk, userMessage: string, taskType: string): number {
        let score = 0;
        const lowerMessage = userMessage.toLowerCase();
        const lowerContent = chunk.content.toLowerCase();

        // Keyword matching
        const messageWords = lowerMessage.split(/\s+/).filter(w => w.length > 3);
        const contentWords = lowerContent.split(/\s+/);
        
        const matchingWords = messageWords.filter(word => 
            contentWords.some(cWord => cWord.includes(word) || word.includes(cWord))
        );
        
        score += (matchingWords.length / Math.max(messageWords.length, 1)) * 50;

        // Type-specific bonuses
        if (taskType === 'coding' && chunk.type === 'file') {
            score += 20;
        }
        if (taskType === 'coding' && chunk.type === 'error') {
            score += 30;
        }
        if (chunk.type === 'selection') {
            score += 25;
        }

        return Math.min(score, 100);
    }

    /**
     * Calculates age factor for recency prioritization
     */
    private calculateAgeFactor(timestamp: number): number {
        const now = Date.now();
        const ageMs = now - timestamp;
        const ageHours = ageMs / (1000 * 60 * 60);
        
        // Exponential decay: newer is much better
        return Math.exp(-ageHours / 24); // Half relevance after 24 hours
    }

    /**
     * Compresses content while preserving key information
     */
    private compressContent(content: string): string {
        const lines = content.split('\n');
        const importantLines: string[] = [];

        for (const line of lines) {
            const trimmed = line.trim();
            
            // Keep non-empty lines with important content
            if (trimmed.length > 0 && (
                trimmed.includes('function') ||
                trimmed.includes('class') ||
                trimmed.includes('import') ||
                trimmed.includes('export') ||
                trimmed.includes('const') ||
                trimmed.includes('let') ||
                trimmed.includes('var') ||
                trimmed.includes('//') ||
                trimmed.includes('TODO') ||
                trimmed.includes('FIXME') ||
                trimmed.startsWith('*') ||
                trimmed.startsWith('#')
            )) {
                importantLines.push(line);
            }
        }

        const compressed = importantLines.join('\n');
        return compressed.length > 0 ? compressed : content.substring(0, Math.floor(content.length * this.settings.contextCompressionRatio));
    }

    /**
     * Cleans old context chunks
     */
    private cleanOldContext(): void {
        const cutoffTime = Date.now() - (2 * 60 * 60 * 1000); // 2 hours
        this.contextChunks = this.contextChunks.filter(chunk => chunk.timestamp > cutoffTime);
    }

    /**
     * Updates context settings
     */
    updateSettings(newSettings: Partial<ContextOptimizationSettings>): void {
        this.settings = { ...this.settings, ...newSettings };
    }

    /**
     * Gets current context statistics
     */
    getStats(): {
        totalChunks: number;
        chunksByType: Record<string, number>;
        totalTokens: number;
        oldestChunk: number;
        newestChunk: number;
    } {
        const chunksByType: Record<string, number> = {};
        let totalTokens = 0;
        let oldestChunk = Date.now();
        let newestChunk = 0;

        for (const chunk of this.contextChunks) {
            chunksByType[chunk.type] = (chunksByType[chunk.type] || 0) + 1;
            totalTokens += chunk.tokenCount;
            oldestChunk = Math.min(oldestChunk, chunk.timestamp);
            newestChunk = Math.max(newestChunk, chunk.timestamp);
        }

        return {
            totalChunks: this.contextChunks.length,
            chunksByType,
            totalTokens,
            oldestChunk,
            newestChunk
        };
    }

    /**
     * Clears all context
     */
    reset(): void {
        this.contextChunks = [];
    }
}

// Global instance for extension-wide context management
export const smartContextManager = new SmartContextManager();