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
    static isWorkspaceQuery(userMessage: string): boolean {
        const workspaceKeywords = [
            'files', 'folders', 'directories', 'workspace', 'project',
            'what files', 'show files', 'list files', 'file structure',
            'what can you see', 'what do you see', 'explore', 'structure',
            'what\'s in', 'contents', 'find file', 'search files',
            'package.json', 'package json', 'src directory', 'src folder',
            'typescript files', '.ts files', 'ts files'
        ];

        const messageLower = userMessage.toLowerCase();
        console.log('🔍 WORKSPACE DEBUG - Message:', `"${messageLower}"`);
        
        const matches = workspaceKeywords.filter(keyword => messageLower.includes(keyword));
        console.log('🔍 WORKSPACE DEBUG - Matching keywords:', matches);
        
        const isWorkspace = workspaceKeywords.some(keyword => messageLower.includes(keyword));
        console.log('🔍 WORKSPACE DEBUG - Is workspace query:', isWorkspace);
        
        return isWorkspace;
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
     * Detect the type of help the user is requesting
     */
    static getQueryType(userMessage: string, hasSelectedText: boolean): 'general' | 'workspace' | 'file-analysis' | 'code-context' {
        if (this.isWorkspaceQuery(userMessage)) {
            return 'workspace';
        }
        
        if (hasSelectedText || this.isFileAnalysisQuery(userMessage)) {
            return 'file-analysis';
        }

        if (this.shouldIncludeCodeContext(userMessage, hasSelectedText)) {
            return 'code-context';
        }

        return 'general';
    }
}