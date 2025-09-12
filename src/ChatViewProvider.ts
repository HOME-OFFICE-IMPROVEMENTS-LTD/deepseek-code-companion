import * as vscode from 'vscode';
import { ModelManager } from './ModelManager';
import { ChatMessage } from './types';
import { ContextAnalyzer } from './ContextAnalyzer';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'deepSeekChatView';
    private _view?: vscode.WebviewView;
    private modelManager: ModelManager;
    private conversationHistory: ChatMessage[] = [];

    constructor(private readonly _extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this.modelManager = new ModelManager(context);
    }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async data => {
            console.log('🔍 CHAT DEBUG - Received message:', data);
            switch (data.type) {
                case 'sendMessage':
                    await this._handleChatMessage(data.message, data.selectedModel);
                    break;
                case 'getCurrentCode':
                    this._sendCurrentCode();
                    break;
                case 'insertCode':
                    this._insertCodeIntoEditor(data.code);
                    break;
                case 'requestModels':
                    await this._sendAvailableModels();
                    break;
                case 'requestCostInfo':
                    this._sendCostInfo();
                    break;
                case 'clearConversation':
                    this._clearConversation();
                    break;
            }
        });

        // Initialize with available models and cost info
        this._initializeWebview();
    }

    private async _initializeWebview() {
        await this._sendAvailableModels();
        this._sendCostInfo();
    }

    private async _sendAvailableModels() {
        try {
            const models = await this.modelManager.getAllAvailableModels();
            const providerStatus = this.modelManager.getProviderStatus();
            
            if (this._view) {
                this._view.webview.postMessage({
                    type: 'modelsData',
                    models: models.map(m => ({
                        id: m.id,
                        name: m.name,
                        provider: m.provider,
                        capabilities: m.capabilities
                    })),
                    providerStatus
                });
            }
        } catch (error) {
            console.error('Error loading models:', error);
            if (this._view) {
                this._view.webview.postMessage({
                    type: 'error',
                    message: 'Failed to load available models. Please check your API key configuration.'
                });
            }
        }
    }

    private _sendCostInfo() {
        const costTracker = this.modelManager.getCostTracker();
        if (this._view) {
            this._view.webview.postMessage({
                type: 'costInfo',
                dailyUsage: costTracker.dailyUsage,
                dailyLimit: costTracker.dailyLimit,
                totalUsage: costTracker.totalUsage
            });
        }
    }

    private _clearConversation() {
        this.conversationHistory = [];
        if (this._view) {
            this._view.webview.postMessage({
                type: 'conversationCleared'
            });
        }
    }

    private async _handleChatMessage(userMessage: string, selectedModel?: string) {
        console.log('🔍 CHAT DEBUG - Handling message:', userMessage);
        
        try {
            // Determine the model to use
            const config = vscode.workspace.getConfiguration('deepseekCodeCompanion');
            const defaultModel = config.get<string>('defaultModel') || 'deepseek-chat';
            const modelToUse = selectedModel || defaultModel;
            
            // Add user message to conversation history
            const userChatMessage: ChatMessage = {
                role: 'user',
                content: userMessage,
                timestamp: new Date()
            };
            this.conversationHistory.push(userChatMessage);
            
            // Get current context information
            const codeContext = this._getCurrentCodeContext();
            const hasSelectedText = codeContext?.selectedText !== undefined && codeContext.selectedText.length > 0;
            
            console.log('🔍 CHAT DEBUG - Has selected text:', hasSelectedText);
            console.log('🔍 CHAT DEBUG - Using model:', modelToUse);
            
            // Determine query type using smart context analyzer
            const queryType = ContextAnalyzer.getQueryType(userMessage, hasSelectedText, modelToUse);
            console.log('🔍 CHAT DEBUG - Query type:', queryType);

            let responseContent: string;

            switch (queryType) {
                case 'workspace':
                    responseContent = await this._handleWorkspaceQuery(userMessage);
                    this._sendResponse(responseContent);
                    break;
                case 'file-edit':
                    responseContent = await this._handleFileEditQuery(userMessage);
                    this._sendResponse(responseContent);
                    break;
                case 'file-analysis':
                case 'code-context':
                    const enhancedMessage = codeContext?.code 
                        ? `${userMessage}\n\nHere is my current code:\n\`\`\`${codeContext.language}\n${codeContext.code}\n\`\`\``
                        : userMessage;
                    
                    // Create messages array for API call
                    const messagesWithCode = [...this.conversationHistory];
                    messagesWithCode[messagesWithCode.length - 1].content = enhancedMessage;
                    
                    const codeResponse = await this.modelManager.sendMessage(messagesWithCode, modelToUse);
                    responseContent = codeResponse.content;
                    
                    // Add assistant response to conversation history
                    this.conversationHistory.push({
                        role: 'assistant',
                        content: responseContent,
                        timestamp: new Date()
                    });
                    
                    // Show response with cost information
                    this._sendResponse(responseContent, codeResponse.usage);
                    break;
                case 'general':
                default:
                    // For non-DeepSeek models, add workspace context to help them understand the environment
                    let enhancedMessages = [...this.conversationHistory];
                    
                    // Add workspace context for non-DeepSeek models when relevant
                    if (!modelToUse.startsWith('deepseek')) {
                        let additionalContext = '';
                        
                        // Check for specific file requests
                        const fileContent = await this._getFileContentForAI(userMessage);
                        if (fileContent) {
                            additionalContext += fileContent + '\n\n';
                        }
                        
                        // Add general workspace context if relevant
                        const workspaceContext = await this._getWorkspaceContextForAI();
                        if (workspaceContext && this._shouldIncludeWorkspaceContext(userMessage)) {
                            additionalContext += workspaceContext;
                        }
                        
                        // Enhance the message if we have context to add
                        if (additionalContext) {
                            const lastMessage = enhancedMessages[enhancedMessages.length - 1];
                            const enhancedContent = `${lastMessage.content}\n\n${additionalContext}`;
                            enhancedMessages[enhancedMessages.length - 1] = {
                                ...lastMessage,
                                content: enhancedContent
                            };
                        }
                    }
                    
                    const generalResponse = await this.modelManager.sendMessage(enhancedMessages, modelToUse);
                    responseContent = generalResponse.content;
                    
                    // Add assistant response to conversation history
                    this.conversationHistory.push({
                        role: 'assistant',
                        content: responseContent,
                        timestamp: new Date()
                    });
                    
                    // Show response with cost information
                    this._sendResponse(responseContent, generalResponse.usage);
                    break;
            }

            // Update cost info in UI
            this._sendCostInfo();
            
        } catch (error: any) {
            console.error('🔍 CHAT DEBUG - Error:', error);
            this._sendResponse(`❌ **Error:** ${error.message}`);
        }
    }

    private async _handleWorkspaceQuery(userMessage: string): Promise<string> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                return "❌ No workspace is currently open in VS Code.";
            }
            
            const lowerMessage = userMessage.toLowerCase();
            
            // Check for greetings - provide friendly workspace-aware response
            const greetingKeywords = ['hi', 'hello', 'hey', 'greetings'];
            const isGreeting = greetingKeywords.some(keyword => lowerMessage.includes(keyword)) || 
                              lowerMessage.trim().length <= 10;
            
            if (isGreeting) {
                let response = "👋 **Hello! I'm your DeepSeek Code Companion.**\n\n";
                response += "✅ I have access to your workspace and can see:\n\n";
                
                // Get a quick file count
                const allFiles = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 100);
                const tsFiles = await vscode.workspace.findFiles('**/*.ts', '**/node_modules/**', 50);
                const jsFiles = await vscode.workspace.findFiles('**/*.js', '**/node_modules/**', 50);
                
                for (const folder of workspaceFolders) {
                    response += `📂 **${folder.name}**\n`;
                    response += `   📍 ${vscode.workspace.asRelativePath(folder.uri)}\n`;
                }
                
                response += `\n📊 **Quick Stats:**\n`;
                response += `   📄 ${allFiles.length}${allFiles.length >= 100 ? '+' : ''} total files\n`;
                if (tsFiles.length > 0) {
                    response += `   🔷 ${tsFiles.length} TypeScript files\n`;
                }
                if (jsFiles.length > 0) {
                    response += `   🟨 ${jsFiles.length} JavaScript files\n`;
                }
                
                response += "\n🤖 **I can help you with:**\n";
                response += "• 💬 **Code questions** - Ask about any file or function\n";
                response += "• 🔍 **Code analysis** - Review and improve your code\n";
                response += "• 🛠️ **Debugging** - Find and fix issues\n";
                response += "• ⚡ **Code generation** - Create new functions, classes, or features\n";
                response += "• 📋 **Refactoring** - Optimize and restructure code\n\n";
                response += "💡 **Try asking:** \"What files do I have?\", \"Analyze this code\", or just describe what you want to build!";
                
                return response;
            }
            
            // Check for file structure queries
            if (lowerMessage.includes('structure') || lowerMessage.includes('tree') || lowerMessage.includes('hierarchy')) {
                return await this._getFileStructure();
            }
            
            // Check for file count queries
            if (lowerMessage.includes('how many files') || lowerMessage.includes('total files') || lowerMessage.includes('file count') || lowerMessage.includes('count files')) {
                return await this._getFileCount();
            }
            
            // Check for src directory queries
            if (lowerMessage.includes('src directory') || lowerMessage.includes('files in src') || lowerMessage.includes('src folder')) {
                return await this._getSrcDirectoryContents();
            }
            
            // Check for TypeScript file queries
            if (lowerMessage.includes('typescript') || lowerMessage.includes('.ts') || lowerMessage.includes('ts files')) {
                return await this._getTypeScriptFiles();
            }
            
            // Check for package.json queries
            if (lowerMessage.includes('package.json') || lowerMessage.includes('package json')) {
                return await this._findPackageJson();
            }
            
            // Default workspace access response
            let response = "📁 **Workspace Access:**\n\n";
            response += "✅ Yes, I have access to your VS Code workspace!\n\n";
            
            for (const folder of workspaceFolders) {
                response += `🗂️ **${folder.name}**\n`;
                response += `📂 \`${folder.uri.fsPath}\`\n\n`;
            }
            
            response += "🤖 **What I can help with:**\n";
            response += "• Analyze your code files\n";
            response += "• Review and refactor code\n";
            response += "• Answer questions about your project\n";
            response += "• Generate new code based on your existing files\n\n";
            response += "📝 Just share your code or ask me about specific files!";
            
            return response;
        } catch (error) {
            console.error('Error handling workspace query:', error);
            return 'Sorry, I encountered an error while checking workspace access.';
        }
    }

    private async _handleFileEditQuery(userMessage: string): Promise<string> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                return "❌ No workspace is currently open in VS Code.";
            }
            
            const lowerMessage = userMessage.toLowerCase();
            
            // Detect which file to edit
            let targetFile = '';
            let editType = '';
            
            if (lowerMessage.includes('readme')) {
                targetFile = 'README.md';
                editType = 'README';
            } else if (lowerMessage.includes('package.json')) {
                targetFile = 'package.json';
                editType = 'Package JSON';
            } else if (lowerMessage.includes('my file') || lowerMessage.includes('this file')) {
                // Check current active editor
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor) {
                    targetFile = vscode.workspace.asRelativePath(activeEditor.document.uri);
                    editType = 'Current File';
                } else {
                    return "❌ No file is currently open. Please open the file you want to edit or specify the filename.";
                }
            }
            
            if (!targetFile) {
                return "🤔 **File Edit Request**\n\n" +
                       "I can help you edit files! Please specify which file you'd like to edit:\n\n" +
                       "• `\"Edit my README file\"` - Edit README.md\n" +
                       "• `\"Modify package.json\"` - Edit package.json\n" +
                       "• `\"Update this file\"` - Edit currently open file\n\n" +
                       "💡 **What I can do:**\n" +
                       "• Add badges and sections to README\n" +
                       "• Update package.json dependencies\n" +
                       "• Add comments and documentation\n" +
                       "• Refactor and improve code structure\n" +
                       "• Fix formatting and syntax issues";
            }
            
            // Find the target file
            const files = await vscode.workspace.findFiles(`**/${targetFile}`, '**/node_modules/**', 5);
            if (files.length === 0) {
                return `❌ Could not find \`${targetFile}\` in your workspace.`;
            }
            
            const fileUri = files[0];
            
            // Read current file content
            let currentContent = '';
            try {
                const fileContent = await vscode.workspace.fs.readFile(fileUri);
                currentContent = fileContent.toString();
            } catch (error) {
                return `❌ Error reading \`${targetFile}\`: ${error}`;
            }
            
            // Handle specific edit requests
            if (lowerMessage.includes('badge') && targetFile === 'README.md') {
                return await this._addBadgesToReadme(fileUri, currentContent, userMessage);
            }
            
            if (lowerMessage.includes('section') && targetFile === 'README.md') {
                return await this._addSectionToReadme(fileUri, currentContent, userMessage);
            }
            
            // General edit request - use AI to help
            return `📝 **Edit ${editType}**\n\n` +
                   `✅ Found: \`${targetFile}\`\n` +
                   `📄 Current size: ${currentContent.length} characters\n\n` +
                   `🤖 **What would you like me to do?** Please be specific:\n\n` +
                   `• \"Add badges to my README\"\n` +
                   `• \"Add a new section about installation\"\n` +
                   `• \"Update the description\"\n` +
                   `• \"Fix the formatting\"\n` +
                   `• \"Add documentation comments\"\n\n` +
                   `💡 **Tip:** The more specific you are, the better I can help!`;
                   
        } catch (error) {
            console.error('Error handling file edit query:', error);
            return 'Sorry, I encountered an error while processing your file edit request.';
        }
    }

    private async _addBadgesToReadme(fileUri: vscode.Uri, currentContent: string, userMessage: string): Promise<string> {
        try {
            // Get package.json info for badges
            const packageFiles = await vscode.workspace.findFiles('**/package.json', '**/node_modules/**', 1);
            let packageInfo = null;
            
            if (packageFiles.length > 0) {
                try {
                    const packageContent = await vscode.workspace.fs.readFile(packageFiles[0]);
                    packageInfo = JSON.parse(packageContent.toString());
                } catch (error) {
                    console.error('Error reading package.json:', error);
                }
            }
            
            // Common badges to add
            const badges = [
                `![Version](https://img.shields.io/badge/version-${packageInfo?.version || '1.0.0'}-blue)`,
                `![License](https://img.shields.io/badge/License-MIT-yellow.svg)`,
                `![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)`,
                `![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-blue)`
            ];
            
            // Find where to insert badges (after title)
            const lines = currentContent.split('\n');
            let insertIndex = 0;
            
            // Find the first heading
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('# ')) {
                    insertIndex = i + 1;
                    break;
                }
            }
            
            // Skip existing description line
            if (insertIndex < lines.length && lines[insertIndex].trim() && !lines[insertIndex].startsWith('!')) {
                insertIndex++;
            }
            
            // Insert badges
            const badgeSection = '\n' + badges.join('\n') + '\n';
            lines.splice(insertIndex, 0, badgeSection);
            
            const newContent = lines.join('\n');
            
            // Write the updated content
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(newContent, 'utf8'));
            
            return `✅ **Badges Added Successfully!**\n\n` +
                   `📝 Updated: \`README.md\`\n` +
                   `🏷️ **Added badges:**\n` +
                   `• Version badge (${packageInfo?.version || '1.0.0'})\n` +
                   `• MIT License badge\n` +
                   `• TypeScript badge\n` +
                   `• VS Code Extension badge\n\n` +
                   `💡 The badges have been automatically inserted after your project title!`;
                   
        } catch (error) {
            console.error('Error adding badges to README:', error);
            return `❌ Error adding badges to README: ${error}`;
        }
    }

    private async _addSectionToReadme(fileUri: vscode.Uri, currentContent: string, userMessage: string): Promise<string> {
        // This is a placeholder for section adding functionality
        return `🚧 **Section Adding**\n\n` +
               `This feature is coming soon! I can currently add badges to your README.\n\n` +
               `💡 Try: \"Add badges to my README file\"`;
    }

    private async _getWorkspaceContextForAI(): Promise<string | null> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                return null;
            }

            // Get basic workspace info
            let context = `**VS Code Workspace Context:**\n`;
            context += `Project: ${workspaceFolders[0].name}\n`;
            context += `Path: ${workspaceFolders[0].uri.fsPath}\n\n`;

            // Get file counts
            const allFiles = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 50);
            const tsFiles = await vscode.workspace.findFiles('**/*.ts', '**/node_modules/**', 20);
            const jsFiles = await vscode.workspace.findFiles('**/*.js', '**/node_modules/**', 20);
            
            context += `Files: ${allFiles.length}${allFiles.length >= 50 ? '+' : ''} total`;
            if (tsFiles.length > 0) {
                context += `, ${tsFiles.length} TypeScript`;
            }
            if (jsFiles.length > 0) {
                context += `, ${jsFiles.length} JavaScript`;
            }
            context += `\n`;

            // Get package.json info if available
            const packageFiles = await vscode.workspace.findFiles('**/package.json', '**/node_modules/**', 1);
            if (packageFiles.length > 0) {
                try {
                    const packageContent = await vscode.workspace.fs.readFile(packageFiles[0]);
                    const packageData = JSON.parse(packageContent.toString());
                    context += `Package: ${packageData.name || 'N/A'} v${packageData.version || 'N/A'}\n`;
                    if (packageData.description) {
                        context += `Description: ${packageData.description}\n`;
                    }
                } catch (error) {
                    // Ignore package.json parsing errors
                }
            }

            return context;
        } catch (error) {
            console.error('Error getting workspace context:', error);
            return null;
        }
    }

    private _shouldIncludeWorkspaceContext(userMessage: string): boolean {
        const workspaceKeywords = [
            'file', 'files', 'folder', 'folders', 'directory', 'directories',
            'project', 'workspace', 'code', 'readme', 'package.json',
            'what can you see', 'what do you see', 'access', 'read',
            'my project', 'this project', 'current project',
            'analyze', 'review', 'explain', 'help with',
            // Add greeting keywords so OpenRouter models get workspace context
            'hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon',
            'what can you do', 'help me', 'who are you', 'what are you'
        ];

        const lowerMessage = userMessage.toLowerCase();
        return workspaceKeywords.some(keyword => lowerMessage.includes(keyword));
    }

    private async _getFileContentForAI(userMessage: string): Promise<string | null> {
        const lowerMessage = userMessage.toLowerCase();
        
        // Check for specific file requests
        if (lowerMessage.includes('readme')) {
            try {
                const readmeFiles = await vscode.workspace.findFiles('**/README.md', '**/node_modules/**', 1);
                if (readmeFiles.length > 0) {
                    const content = await vscode.workspace.fs.readFile(readmeFiles[0]);
                    return `**README.md Content:**\n\`\`\`markdown\n${content.toString()}\n\`\`\``;
                }
            } catch (error) {
                console.error('Error reading README:', error);
            }
        }
        
        if (lowerMessage.includes('package.json')) {
            try {
                const packageFiles = await vscode.workspace.findFiles('**/package.json', '**/node_modules/**', 1);
                if (packageFiles.length > 0) {
                    const content = await vscode.workspace.fs.readFile(packageFiles[0]);
                    return `**package.json Content:**\n\`\`\`json\n${content.toString()}\n\`\`\``;
                }
            } catch (error) {
                console.error('Error reading package.json:', error);
            }
        }
        
        return null;
    }

    private async _getFileStructure(): Promise<string> {
        try {
            const allFiles = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 50);
            
            let response = "📁 **File Structure:**\n\n";
            
            // Group files by directory
            const filesByDir: { [key: string]: string[] } = {};
            
            allFiles.forEach(file => {
                const relativePath = vscode.workspace.asRelativePath(file);
                const dir = relativePath.includes('/') ? relativePath.substring(0, relativePath.lastIndexOf('/')) : '.';
                const fileName = relativePath.split('/').pop() || '';
                
                if (!filesByDir[dir]) {
                    filesByDir[dir] = [];
                }
                filesByDir[dir].push(fileName);
            });
            
            // Display structure
            const sortedDirs = Object.keys(filesByDir).sort();
            
            for (const dir of sortedDirs.slice(0, 10)) { // Limit directories
                if (dir === '.') {
                    response += `📄 **Root files:**\n`;
                } else {
                    response += `📁 **${dir}/**\n`;
                }
                
                const files = filesByDir[dir].slice(0, 8); // Limit files per directory
                files.forEach(file => {
                    const icon = this._getFileIcon(file);
                    response += `   ${icon} ${file}\n`;
                });
                
                if (filesByDir[dir].length > 8) {
                    response += `   ... and ${filesByDir[dir].length - 8} more files\n`;
                }
                response += '\n';
            }
            
            if (sortedDirs.length > 10) {
                response += `... and ${sortedDirs.length - 10} more directories\n`;
            }
            
            return response;
        } catch (error) {
            return `❌ Error reading file structure: ${error}`;
        }
    }

    private async _getSrcDirectoryContents(): Promise<string> {
        try {
            const srcFiles = await vscode.workspace.findFiles('src/**/*', '**/node_modules/**', 30);
            
            if (srcFiles.length === 0) {
                return "📁 **src/ Directory:**\n\n❌ No src directory found or it's empty.";
            }
            
            let response = "📁 **src/ Directory Contents:**\n\n";
            
            srcFiles.forEach(file => {
                const relativePath = vscode.workspace.asRelativePath(file);
                const fileName = relativePath.split('/').pop() || '';
                const icon = this._getFileIcon(fileName);
                
                response += `${icon} ${relativePath}\n`;
            });
            
            response += `\n📊 Total: ${srcFiles.length} files in src/`;
            return response;
            
        } catch (error) {
            return `❌ Error reading src directory: ${error}`;
        }
    }

    private async _getTypeScriptFiles(): Promise<string> {
        try {
            const tsFiles = await vscode.workspace.findFiles('**/*.ts', '**/node_modules/**', 30);
            
            if (tsFiles.length === 0) {
                return "🔷 **TypeScript Files:**\n\n❌ No TypeScript files found in the workspace.";
            }
            
            let response = "🔷 **TypeScript Files:**\n\n";
            
            tsFiles.forEach(file => {
                const relativePath = vscode.workspace.asRelativePath(file);
                response += `📄 ${relativePath}\n`;
            });
            
            response += `\n📊 Total: ${tsFiles.length} TypeScript files`;
            return response;
            
        } catch (error) {
            return `❌ Error finding TypeScript files: ${error}`;
        }
    }

    private async _findPackageJson(): Promise<string> {
        try {
            const packageJsonFiles = await vscode.workspace.findFiles('**/package.json', '**/node_modules/**', 5);
            
            if (packageJsonFiles.length === 0) {
                return "📋 **package.json:**\n\n❌ No package.json found in the workspace.";
            }
            
            let response = "📋 **package.json Files:**\n\n";
            
            for (const file of packageJsonFiles) {
                const relativePath = vscode.workspace.asRelativePath(file);
                response += `📄 Found: ${relativePath}\n`;
                
                try {
                    const content = await vscode.workspace.fs.readFile(file);
                    const packageData = JSON.parse(content.toString());
                    
                    response += `📋 **Details:**\n`;
                    response += `   • Name: ${packageData.name || 'N/A'}\n`;
                    response += `   • Version: ${packageData.version || 'N/A'}\n`;
                    response += `   • Description: ${packageData.description || 'N/A'}\n`;
                    
                    if (packageData.scripts) {
                        const scriptCount = Object.keys(packageData.scripts).length;
                        response += `   • Scripts: ${scriptCount} available\n`;
                    }
                    
                } catch (parseError) {
                    response += `❌ Error parsing package.json\n`;
                }
                response += '\n';
            }
            
            return response;
            
        } catch (error) {
            return `❌ Error finding package.json: ${error}`;
        }
    }

    private _getFileIcon(fileName: string): string {
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        
        switch (extension) {
            case 'ts': return '🔷';
            case 'js': return '🟨';
            case 'json': return '📋';
            case 'md': return '📝';
            case 'css': return '🎨';
            case 'html': return '🌐';
            case 'png': 
            case 'jpg': 
            case 'gif': 
            case 'svg': return '🖼️';
            default: return '📄';
        }
    }

    private async _getFileCount(): Promise<string> {
        try {
            const allFiles = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 1000);
            const tsFiles = await vscode.workspace.findFiles('**/*.ts', '**/node_modules/**', 200);
            const jsFiles = await vscode.workspace.findFiles('**/*.js', '**/node_modules/**', 200);
            const jsonFiles = await vscode.workspace.findFiles('**/*.json', '**/node_modules/**', 50);
            const srcFiles = await vscode.workspace.findFiles('src/**/*', '**/node_modules/**', 200);
            
            let response = "📊 **File Count Summary:**\n\n";
            response += `📄 **Total files:** ${allFiles.length}${allFiles.length >= 1000 ? '+' : ''}\n`;
            response += `🔷 **TypeScript files:** ${tsFiles.length}\n`;
            response += `🟨 **JavaScript files:** ${jsFiles.length}\n`;
            response += `📋 **JSON files:** ${jsonFiles.length}\n`;
            response += `📁 **Files in src/:** ${srcFiles.length}\n\n`;
            
            // Add breakdown by directory
            const filesByDir: { [key: string]: number } = {};
            
            allFiles.slice(0, 500).forEach(file => {  // Limit to prevent performance issues
                const relativePath = vscode.workspace.asRelativePath(file);
                const dir = relativePath.includes('/') ? relativePath.substring(0, relativePath.lastIndexOf('/')) : '.';
                filesByDir[dir] = (filesByDir[dir] || 0) + 1;
            });
            
            const sortedDirs = Object.entries(filesByDir)
                .sort(([,a], [,b]) => b - a)  // Sort by file count descending
                .slice(0, 8);  // Top 8 directories
            
            if (sortedDirs.length > 0) {
                response += "📁 **Top directories by file count:**\n";
                sortedDirs.forEach(([dir, count]) => {
                    const displayDir = dir === '.' ? 'Root' : dir;
                    response += `   ${displayDir}: ${count} files\n`;
                });
            }
            
            return response;
        } catch (error) {
            return `❌ Error counting files: ${error}`;
        }
    }

    private _getCurrentCodeContext(): { code: string; language: string; selectedText: string } | null {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }

        const document = editor.document;
        const selection = editor.selection;
        const selectedText = document.getText(selection);

        // If user has selected text, use that. Otherwise, use the entire file.
        const code = selectedText || document.getText();
        const language = document.languageId;

        return { code, language, selectedText };
    }

    private _sendCurrentCode() {
        const codeContext = this._getCurrentCodeContext();
        if (codeContext && this._view) {
            this._view.webview.postMessage({
                type: 'currentCode',
                code: codeContext.code,
                language: codeContext.language
            });
        }
    }

    private async _insertCodeIntoEditor(code: string) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            await editor.edit(editBuilder => {
                if (editor.selection.isEmpty) {
                    // Insert at cursor position
                    editBuilder.insert(editor.selection.active, code);
                } else {
                    // Replace selection
                    editBuilder.replace(editor.selection, code);
                }
            });
        }
    }

    private _sendResponse(response: string, usage?: { inputTokens: number; outputTokens: number; totalCost: number }) {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'addResponse',
                message: response,
                usage: usage
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { 
                        padding: 10px; 
                        font-family: var(--vscode-font-family);
                        background: var(--vscode-sideBar-background);
                        color: var(--vscode-sideBar-foreground);
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        margin: 0;
                    }
                    
                    #header-container {
                        margin-bottom: 10px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                        padding-bottom: 10px;
                    }
                    
                    #model-selector {
                        width: 100%;
                        margin-bottom: 8px;
                        padding: 6px;
                        background: var(--vscode-dropdown-background);
                        color: var(--vscode-dropdown-foreground);
                        border: 1px solid var(--vscode-dropdown-border);
                        border-radius: 3px;
                    }
                    
                    #cost-display {
                        font-size: 11px;
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 5px;
                    }
                    
                    #chat-container { 
                        flex: 1; 
                        overflow-y: auto;
                        margin-bottom: 10px;
                        padding: 5px;
                        border-radius: 4px;
                    }
                    #input-container { 
                        display: flex; 
                        gap: 10px;
                        margin-bottom: 10px;
                    }
                    #button-container {
                        display: flex;
                        gap: 5px;
                        margin-bottom: 10px;
                    }
                    #user-input { 
                        flex: 1; 
                        padding: 8px;
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 3px;
                    }
                    button { 
                        padding: 6px 12px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        cursor: pointer;
                        font-size: 12px;
                        border-radius: 3px;
                    }
                    button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    button.secondary {
                        background: var(--vscode-button-secondaryBackground);
                    }
                    button.secondary:hover {
                        background: var(--vscode-button-secondaryHoverBackground);
                    }
                    .message { 
                        margin-bottom: 16px; 
                        line-height: 1.6;
                        padding: 12px;
                        border-radius: 6px;
                        border-left: 3px solid transparent;
                        word-wrap: break-word;
                    }
                    .user { 
                        background: var(--vscode-textCodeBlock-background);
                        border-left-color: var(--vscode-textLink-foreground);
                        color: var(--vscode-editor-foreground);
                    }
                    .assistant { 
                        background: var(--vscode-editor-background);
                        border-left-color: var(--vscode-charts-blue);
                        color: var(--vscode-editor-foreground);
                    }
                    .message strong {
                        color: var(--vscode-textLink-foreground);
                        margin-bottom: 8px;
                        display: block;
                        font-size: 13px;
                    }
                    .usage-info {
                        font-size: 10px;
                        color: var(--vscode-descriptionForeground);
                        margin-top: 8px;
                        padding-top: 5px;
                        border-top: 1px solid var(--vscode-panel-border);
                    }
                    /* Code formatting */
                    .message code {
                        background: var(--vscode-textCodeBlock-background);
                        color: var(--vscode-textPreformat-foreground);
                        padding: 2px 6px;
                        border-radius: 3px;
                        font-family: var(--vscode-editor-font-family);
                        font-size: 0.9em;
                        border: 1px solid var(--vscode-textSeparator-foreground);
                    }
                    .message pre {
                        background: var(--vscode-textCodeBlock-background);
                        padding: 12px 16px;
                        border-radius: 6px;
                        margin: 12px 0;
                        overflow-x: auto;
                        border: 1px solid var(--vscode-textSeparator-foreground);
                    }
                    .message pre code {
                        background: none;
                        padding: 0;
                        border-radius: 0;
                        border: none;
                        font-size: 0.9em;
                        line-height: 1.4;
                    }
                    /* Loading indicator */
                    .loading {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-style: italic;
                        color: var(--vscode-descriptionForeground);
                    }
                    .loading::before {
                        content: "⟳";
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                </style>
            </head>
            <body>
                <div id="header-container">
                    <select id="model-selector">
                        <option value="">Loading models...</option>
                    </select>
                    <div id="cost-display">Daily usage: $0.0000 / $5.00</div>
                </div>
                
                <div id="button-container">
                    <button id="send-code-btn" class="secondary" title="Send current code to chat">📋 Send Code</button>
                    <button id="clear-btn" class="secondary" title="Clear conversation">🗑️ Clear</button>
                </div>
                
                <div id="chat-container"></div>
                
                <div id="input-container">
                    <input type="text" id="user-input" placeholder="Ask about your workspace, code, or anything else...">
                    <button id="send-btn">Send</button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    const chatContainer = document.getElementById('chat-container');
                    const userInput = document.getElementById('user-input');
                    const modelSelector = document.getElementById('model-selector');
                    const costDisplay = document.getElementById('cost-display');

                    // Request initial data
                    vscode.postMessage({ type: 'requestModels' });
                    vscode.postMessage({ type: 'requestCostInfo' });

                    function escapeHtml(unsafe) {
                        return unsafe
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/"/g, "&quot;")
                            .replace(/'/g, "&#039;");
                    }

                    function addMessage(text, isUser = false, usage = null) {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = 'message ' + (isUser ? 'user' : 'assistant');
                        
                        if (isUser) {
                            messageDiv.innerHTML = '<strong>You:</strong> ' + escapeHtml(text);
                        } else {
                            let formattedText = escapeHtml(text);
                            
                            // Basic markdown-like formatting
                            formattedText = formattedText.replace(/\\*\\*([^\\*]+)\\*\\*/g, '<strong>$1</strong>');
                            formattedText = formattedText.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
                            formattedText = formattedText.replace(/\\n\\n/g, '</p><p>');
                            formattedText = formattedText.replace(/\\n/g, '<br>');
                            
                            if (!formattedText.includes('<')) {
                                formattedText = '<p>' + formattedText + '</p>';
                            }
                            
                            messageDiv.innerHTML = '<strong>AI:</strong><br>' + formattedText;
                            
                            // Add usage info if available
                            if (usage) {
                                const usageDiv = document.createElement('div');
                                usageDiv.className = 'usage-info';
                                usageDiv.innerHTML = \`💰 Cost: \$\${usage.totalCost.toFixed(6)} | 📥 \${usage.inputTokens} in | 📤 \${usage.outputTokens} out\`;
                                messageDiv.appendChild(usageDiv);
                            }
                        }
                        
                        chatContainer.appendChild(messageDiv);
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                    
                    function sendMessage() {
                        const message = userInput.value.trim();
                        const selectedModel = modelSelector.value;
                        
                        if (message) {
                            addMessage(message, true);
                            showLoading();
                            vscode.postMessage({ 
                                type: 'sendMessage', 
                                message: message,
                                selectedModel: selectedModel 
                            });
                            userInput.value = '';
                        }
                    }
                    
                    function showLoading() {
                        const loadingDiv = document.createElement('div');
                        loadingDiv.id = 'loading';
                        loadingDiv.className = 'message assistant loading';
                        loadingDiv.innerHTML = '<strong>AI:</strong> Thinking...';
                        chatContainer.appendChild(loadingDiv);
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                    
                    function hideLoading() {
                        const loading = document.getElementById('loading');
                        if (loading) loading.remove();
                    }

                    function clearConversation() {
                        chatContainer.innerHTML = '';
                        vscode.postMessage({ type: 'clearConversation' });
                    }

                    // Button event listeners
                    document.getElementById('send-btn').addEventListener('click', sendMessage);
                    document.getElementById('send-code-btn').addEventListener('click', () => {
                        vscode.postMessage({ type: 'getCurrentCode' });
                    });
                    document.getElementById('clear-btn').addEventListener('click', clearConversation);

                    userInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') sendMessage();
                    });

                    window.addEventListener('message', (event) => {
                        const message = event.data;
                        switch (message.type) {
                            case 'addResponse':
                                hideLoading();
                                addMessage(message.message, false, message.usage);
                                break;
                            case 'currentCode':
                                addMessage('✓ Current code sent to AI', true);
                                break;
                            case 'modelsData':
                                // Update model selector
                                modelSelector.innerHTML = '';
                                message.models.forEach(model => {
                                    const option = document.createElement('option');
                                    option.value = model.id;
                                    option.textContent = \`\${model.name} (\${model.provider})\`;
                                    modelSelector.appendChild(option);
                                });
                                break;
                            case 'costInfo':
                                costDisplay.textContent = \`Daily usage: \$\${message.dailyUsage.toFixed(4)} / \$\${message.dailyLimit.toFixed(2)}\`;
                                break;
                            case 'conversationCleared':
                                // UI already cleared by clearConversation function
                                break;
                            case 'error':
                                hideLoading();
                                addMessage(message.message, false);
                                break;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}
