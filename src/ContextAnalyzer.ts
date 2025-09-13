// Smart Context Analyzer - Determines when to include code context
import * as vscode from 'vscode';

export class ContextAnalyzer {
    
    /**
     * Determine if code context should be included based on the user's message
     */
    static shouldIncludeCodeContext(userMessage: string, hasSelectedText: boolean): boolean {
        // Always return false for testing
        console.log('DEBUG: ContextAnalyzer called with:', userMessage, 'hasSelectedText:', hasSelectedText);
        return false;
    }

    /**
     * Detect if the user is asking about workspace files/folders
     */
    private static isWorkspaceQuery(userMessage: string): boolean {
        const workspaceKeywords = [
            'workspace', 'project', 'code', 'file', 'files', 'directory', 'folder', 'codebase',
            'source', 'implementation', 'structure', 'overview', 'package.json',
            'tsconfig', 'build', 'compile', 'what does this', 'explain this', 'how does',
            'what is in', 'show me', 'list', 'find', 'search', 'analyze', 'review',
            // File count keywords  
            'how many', 'count of', 'total of', 'number of',
            'typescript files', '.ts files', 'ts files',
            'how many files', 'total files', 'file count', 'count files',
            'how many folders', 'total folders', 'folder count', 'count folders',
            'folders and files', 'files and folders', 'total count',
            'project root', 'root folder', 'in total',
            // Add README and file access keywords
            'readme', 'readme file', 'read me', 'access my readme',
            'can you access', 'access my', 'show my', 'read my',
            'my readme', 'the readme', 'readme.md', 'readme content'
        ];

        const messageLower = userMessage.toLowerCase();
        return workspaceKeywords.some(keyword => messageLower.includes(keyword));
    }    /**
     * Detect if this is a greeting or general conversation that should include workspace awareness
     */
    static isGreetingOrGeneral(userMessage: string): boolean {
        const greetingKeywords = [
            'hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening',
            'how are you', 'what can you do', 'help me', 'can you help',
            'what are you', 'who are you', 'introduce yourself'
        ];

        const messageLower = userMessage.toLowerCase().trim();
        console.log('🔍 GREETING DEBUG - Message:', `"${messageLower}"`);
        
        const isGreeting = greetingKeywords.some(keyword => messageLower.includes(keyword)) || 
                          messageLower.length <= 10; // Short messages like "hi", "help", etc.
        
        console.log('🔍 GREETING DEBUG - Is greeting/general:', isGreeting);
        return isGreeting;
    }

    /**
     * Detect if the user wants to analyze a specific file
     */
    static isFileAnalysisQuery(userMessage: string): boolean {
        const fileKeywords = [
            'analyze this file', 'explain this file', 'review this file',
            'what does this file do', 'help with this file', 'debug this file',
            'improve this file', 'optimize this file', 'refactor this file'
        ];

        const messageLower = userMessage.toLowerCase();
        return fileKeywords.some(keyword => messageLower.includes(keyword));
    }

    /**
     * Detect if the user wants to edit a file
     */
    static isFileEditQuery(userMessage: string): boolean {
        const editKeywords = [
            'edit my', 'modify my', 'update my', 'change my', 'fix my',
            'add to my', 'remove from my', 'edit the', 'modify the', 'update the',
            'change the', 'fix the', 'add to the', 'remove from the',
            'edit readme', 'modify readme', 'update readme', 'change readme',
            'add badges', 'add badge', 'add section', 'add description',
            'edit package.json', 'modify package.json', 'update package.json',
            'can you edit', 'can you modify', 'can you update', 'can you change',
            'please edit', 'please modify', 'please update', 'please change'
        ];

        const messageLower = userMessage.toLowerCase();
        return editKeywords.some(keyword => messageLower.includes(keyword));
    }

    /**
     * Detect the type of help the user is requesting
     */
    static getQueryType(userMessage: string, hasSelectedText: boolean, modelId?: string): 'general' | 'workspace' | 'file-analysis' | 'code-context' | 'file-edit' {
        const isWorkspace = this.isWorkspaceQuery(userMessage);
        if (isWorkspace) {
            return 'workspace';
        }
        
        const isFileEdit = this.isFileEditQuery(userMessage);
        if (isFileEdit) {
            return 'file-edit';
        }
        
        const isFileAnalysis = hasSelectedText || this.isFileAnalysisQuery(userMessage);
        if (isFileAnalysis) {
            return 'file-analysis';
        }

        const shouldIncludeCode = this.shouldIncludeCodeContext(userMessage, hasSelectedText);
        if (shouldIncludeCode) {
            return 'code-context';
        }

        // For greetings and general queries, provide workspace context ONLY for DeepSeek models
        // Other models get enhanced context through the general message flow
        const isGreeting = this.isGreetingOrGeneral(userMessage);
        const isDeepSeek = modelId?.startsWith('deepseek');
        if (isGreeting && isDeepSeek) {
            return 'workspace';
        }

        return 'general';
    }
}