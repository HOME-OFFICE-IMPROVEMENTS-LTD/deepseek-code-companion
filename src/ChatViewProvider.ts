import * as vscode from 'vscode';
import { getDeepSeekResponse } from './deepSeekAPI';
import { ContextAnalyzer } from './ContextAnalyzer';
import { WorkspaceExplorer } from './WorkspaceExplorer';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'deepSeekChatView';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

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
                    await this._handleChatMessage(data.message);
                    break;
                case 'getCurrentCode':
                    this._sendCurrentCode();
                    break;
                case 'insertCode':
                    this._insertCodeIntoEditor(data.code);
                    break;
            }
        });
    }

    private async _handleChatMessage(userMessage: string) {
        console.log('🔍 CHAT DEBUG - Handling message:', userMessage);
        
        try {
            // Get current context information
            const codeContext = this._getCurrentCodeContext();
            const hasSelectedText = codeContext?.selectedText !== undefined && codeContext.selectedText.length > 0;
            
            console.log('🔍 CHAT DEBUG - Has selected text:', hasSelectedText);
            
            // Determine query type using smart context analyzer
            const queryType = ContextAnalyzer.getQueryType(userMessage, hasSelectedText);
            console.log('🔍 CHAT DEBUG - Query type:', queryType);

            switch (queryType) {
                case 'workspace':
                    const workspaceResponse = await this._handleWorkspaceQuery(userMessage);
                    this._sendResponse(workspaceResponse);
                    break;
                case 'file-analysis':
                case 'code-context':
                    const enhancedMessage = codeContext?.code 
                        ? `${userMessage}\n\nHere is my current code:\n\`\`\`${codeContext.language}\n${codeContext.code}\n\`\`\``
                        : userMessage;
                    const response = await getDeepSeekResponse(enhancedMessage);
                    this._sendResponse(response);
                    break;
                case 'general':
                default:
                    const generalResponse = await getDeepSeekResponse(userMessage);
                    this._sendResponse(generalResponse);
                    break;
            }
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
            
            // Check for file structure queries
            if (lowerMessage.includes('structure') || lowerMessage.includes('tree') || lowerMessage.includes('hierarchy')) {
                return await this._getFileStructure();
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
                response += `� \`${folder.uri.fsPath}\`\n\n`;
            }
            
            response += "� **What I can help with:**\n";
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

    private _sendResponse(response: string) {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'addResponse',
                message: response
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
                    /* Markdown-style formatting */
                    .message h1, .message h2, .message h3, .message h4 {
                        margin: 16px 0 8px 0;
                        color: var(--vscode-editor-foreground);
                        font-weight: 600;
                        line-height: 1.3;
                    }
                    .message h1 { font-size: 1.4em; border-bottom: 2px solid var(--vscode-textLink-foreground); padding-bottom: 4px; }
                    .message h2 { font-size: 1.3em; border-bottom: 1px solid var(--vscode-textBlockQuote-border); padding-bottom: 2px; }
                    .message h3 { font-size: 1.2em; }
                    .message h4 { font-size: 1.1em; }
                    
                    .message p {
                        margin: 8px 0;
                        line-height: 1.6;
                    }
                    .message ul, .message ol {
                        margin: 8px 0;
                        padding-left: 24px;
                    }
                    .message li {
                        margin: 4px 0;
                        line-height: 1.5;
                    }
                    .message blockquote {
                        margin: 12px 0;
                        padding: 8px 16px;
                        border-left: 4px solid var(--vscode-textBlockQuote-border);
                        background: var(--vscode-textBlockQuote-background);
                        font-style: italic;
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
                        position: relative;
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
                    
                    /* Scrollbar styling */
                    #chat-container::-webkit-scrollbar {
                        width: 8px;
                    }
                    #chat-container::-webkit-scrollbar-track {
                        background: var(--vscode-scrollbarSlider-background);
                    }
                    #chat-container::-webkit-scrollbar-thumb {
                        background: var(--vscode-scrollbarSlider-hoverBackground);
                        border-radius: 4px;
                    }
                </style>
            </head>
            <body>
                <div id="button-container">
                    <button id="send-code-btn" class="secondary" title="Send current code to chat">📋 Send Code</button>
                </div>
                <div id="chat-container"></div>
                <div id="input-container">
                    <input type="text" id="user-input" placeholder="Ask DeepSeek about your code...">
                    <button id="send-btn">Send</button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    const chatContainer = document.getElementById('chat-container');
                    const userInput = document.getElementById('user-input');

                    function escapeHtml(unsafe) {
                        return unsafe
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/"/g, "&quot;")
                            .replace(/'/g, "&#039;");
                    }

        function addMessage(text, isUser = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + (isUser ? 'user' : 'assistant');
            
            if (isUser) {
                messageDiv.innerHTML = '<strong>You:</strong> ' + escapeHtml(text);
            } else {
                // Enhanced formatting for DeepSeek responses
                let formattedText = escapeHtml(text);
                
                // Basic markdown-like formatting
                // Headers
                formattedText = formattedText.replace(/^### (.*)$/gim, '<h3>$1</h3>');
                formattedText = formattedText.replace(/^## (.*)$/gim, '<h2>$1</h2>');
                formattedText = formattedText.replace(/^# (.*)$/gim, '<h1>$1</h1>');
                
                // Code blocks (simple version)
                formattedText = formattedText.replace(/\`\`\`[\\w]*\\n([\\s\\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>');
                formattedText = formattedText.replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>');
                
                // Inline code
                formattedText = formattedText.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
                
                // Bold and italic
                formattedText = formattedText.replace(/\\*\\*([^\\*]+)\\*\\*/g, '<strong>$1</strong>');
                formattedText = formattedText.replace(/\\*([^\\*]+)\\*/g, '<em>$1</em>');
                
                // Line breaks
                formattedText = formattedText.replace(/\\n\\n/g, '</p><p>');
                formattedText = formattedText.replace(/\\n/g, '<br>');
                
                // Simple lists
                formattedText = formattedText.replace(/^- (.*)$/gim, '<li>$1</li>');
                
                // Wrap in paragraphs if needed
                if (!formattedText.includes('<h') && !formattedText.includes('<pre') && !formattedText.includes('<li>')) {
                    formattedText = '<p>' + formattedText + '</p>';
                }
                
                messageDiv.innerHTML = '<strong>DeepSeek:</strong><br>' + formattedText;
            }
            
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        function sendMessage() {
            const message = userInput.value.trim();
            if (message) {
                addMessage(message, true);
                showLoading();
                vscode.postMessage({ type: 'sendMessage', message: message });
                userInput.value = '';
            }
        }
        
        function showLoading() {
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'loading';
            loadingDiv.className = 'message assistant loading';
            loadingDiv.innerHTML = '<strong>DeepSeek:</strong> Thinking...';
            chatContainer.appendChild(loadingDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        function hideLoading() {
            const loading = document.getElementById('loading');
            if (loading) loading.remove();
        }

                    function getCurrentCode() {
                        vscode.postMessage({ type: 'getCurrentCode' });
                    }

                    function insertCode(code) {
                        vscode.postMessage({ type: 'insertCode', code: code });
                    }

                    // Add button event listeners
                    const sendBtn = document.getElementById('send-btn');
                    const sendCodeBtn = document.getElementById('send-code-btn');
                    
                    if (sendBtn) {
                        sendBtn.addEventListener('click', sendMessage);
                    }
                    
                    if (sendCodeBtn) {
                        sendCodeBtn.addEventListener('click', function() {
                            vscode.postMessage({ type: 'getCurrentCode' });
                        });
                    }

                    userInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') sendMessage();
                    });

                    window.addEventListener('message', (event) => {
                        const message = event.data;
                        switch (message.type) {
                            case 'addResponse':
                                hideLoading();
                                addMessage(message.message, false);
                                break;
                            case 'currentCode':
                                addMessage(\`✓ Current code sent to AI\`, true);
                                break;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}