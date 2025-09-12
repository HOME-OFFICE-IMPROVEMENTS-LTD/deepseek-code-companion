import * as vscode from 'vscode';
import { DeepSeekAPI, DeepSeekMessage } from '../api/DeepSeekAPI';

export class ChatPanel {
    public static currentPanel: ChatPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _api: DeepSeekAPI;
    private _disposables: vscode.Disposable[] = [];
    private _chatHistory: DeepSeekMessage[] = [];

    public static createOrShow(extensionUri: vscode.Uri, api: DeepSeekAPI) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (ChatPanel.currentPanel) {
            ChatPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'deepseekChat',
            'DeepSeek Chat',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'out')
                ]
            }
        );

        ChatPanel.currentPanel = new ChatPanel(panel, extensionUri, api);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, api: DeepSeekAPI) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._api = api;

        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'sendMessage':
                        await this._handleSendMessage(message.text);
                        break;
                    case 'clearChat':
                        this._handleClearChat();
                        break;
                    case 'insertCode':
                        this._handleInsertCode(message.code);
                        break;
                    case 'copyCode':
                        this._handleCopyCode(message.code);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private async _handleSendMessage(text: string) {
        if (!text.trim()) {
            return;
        }

        // Add user message to history
        const userMessage: DeepSeekMessage = { role: 'user', content: text };
        this._chatHistory.push(userMessage);

        // Update UI to show user message and loading state
        this._panel.webview.postMessage({
            command: 'addMessage',
            message: userMessage,
            isLoading: true
        });

        try {
            // Get current editor context for better responses
            const activeEditor = vscode.window.activeTextEditor;
            let context = '';
            if (activeEditor && activeEditor.selection && !activeEditor.selection.isEmpty) {
                context = activeEditor.document.getText(activeEditor.selection);
            }

            // Detect query type
            const queryType = this._api.detectQueryType(text, context);

            // Get response from DeepSeek
            const response = await this._api.chatCompletion(this._chatHistory, queryType);
            
            // Add assistant response to history
            const assistantMessage: DeepSeekMessage = { role: 'assistant', content: response };
            this._chatHistory.push(assistantMessage);

            // Update UI with response
            this._panel.webview.postMessage({
                command: 'addMessage',
                message: assistantMessage,
                isLoading: false,
                queryType: queryType.type
            });

        } catch (error) {
            console.error('Error getting response:', error);
            
            // Show error message in chat
            this._panel.webview.postMessage({
                command: 'addMessage',
                message: {
                    role: 'assistant',
                    content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
                },
                isLoading: false,
                isError: true
            });
        }
    }

    private _handleClearChat() {
        this._chatHistory = [];
        this._panel.webview.postMessage({ command: 'clearMessages' });
    }

    private _handleInsertCode(code: string) {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            activeEditor.edit(editBuilder => {
                editBuilder.insert(activeEditor.selection.active, code);
            });
        } else {
            vscode.window.showWarningMessage('No active editor to insert code into.');
        }
    }

    private _handleCopyCode(code: string) {
        vscode.env.clipboard.writeText(code);
        vscode.window.showInformationMessage('Code copied to clipboard!');
    }

    public dispose() {
        ChatPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(_webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DeepSeek Chat</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 0;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .message {
            margin: 10px 0;
            padding: 10px;
            border-radius: 5px;
            max-width: 80%;
        }
        
        .user-message {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            margin-left: auto;
        }
        
        .assistant-message {
            background-color: var(--vscode-editor-selectionBackground);
            border: 1px solid var(--vscode-panel-border);
        }
        
        .error-message {
            background-color: var(--vscode-errorBackground);
            border: 1px solid var(--vscode-errorBorder);
            color: var(--vscode-errorForeground);
        }
        
        .loading {
            opacity: 0.7;
        }
        
        .loading::after {
            content: " ●●●";
            animation: loading 1.5s infinite;
        }
        
        @keyframes loading {
            0%, 60%, 100% { opacity: 1; }
            30% { opacity: 0.3; }
        }
        
        .input-container {
            display: flex;
            padding: 10px;
            background-color: var(--vscode-panel-background);
            border-top: 1px solid var(--vscode-panel-border);
        }
        
        .input-container textarea {
            flex: 1;
            resize: vertical;
            min-height: 40px;
            max-height: 200px;
            padding: 10px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
            font-family: inherit;
            font-size: inherit;
        }
        
        .input-container button {
            margin-left: 10px;
            padding: 10px 20px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .input-container button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .input-container button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .message-content {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .message-content code {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 2px 4px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
        }
        
        .message-content pre {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
            position: relative;
        }
        
        .code-actions {
            position: absolute;
            top: 5px;
            right: 5px;
            display: flex;
            gap: 5px;
        }
        
        .code-action-btn {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 4px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .code-action-btn:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .clear-btn {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .clear-btn:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .query-type-badge {
            font-size: 12px;
            padding: 2px 6px;
            border-radius: 10px;
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            margin-bottom: 5px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="chat-container" id="chatContainer">
        <div class="message assistant-message">
            <div class="message-content">
                Welcome to DeepSeek Code Companion! I'm here to help you with:
                <br>• Code generation and completion
                <br>• Code refactoring and optimization
                <br>• Code explanations and analysis
                <br>• Workspace and project insights
                <br><br>How can I assist you today?
            </div>
        </div>
    </div>
    
    <div class="input-container">
        <textarea id="messageInput" placeholder="Ask me anything about your code..."></textarea>
        <button id="sendBtn">Send</button>
        <button id="clearBtn" class="clear-btn">Clear</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const chatContainer = document.getElementById('chatContainer');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const clearBtn = document.getElementById('clearBtn');
        
        let isLoading = false;

        function addMessage(message, queryType, isError = false, loading = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${message.role}-message\${isError ? ' error-message' : ''}\${loading ? ' loading' : ''}\`;
            
            let content = '';
            if (queryType) {
                content += \`<div class="query-type-badge">\${queryType.replace('_', ' ')}</div>\`;
            }
            
            const messageContent = marked.parse ? marked.parse(message.content) : message.content;
            content += \`<div class="message-content">\${messageContent}</div>\`;
            
            messageDiv.innerHTML = content;
            
            // Add copy/insert buttons to code blocks
            const codeBlocks = messageDiv.querySelectorAll('pre');
            codeBlocks.forEach(pre => {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'code-actions';
                
                const copyBtn = document.createElement('button');
                copyBtn.className = 'code-action-btn';
                copyBtn.textContent = 'Copy';
                copyBtn.onclick = () => {
                    vscode.postMessage({
                        command: 'copyCode',
                        code: pre.textContent
                    });
                };
                
                const insertBtn = document.createElement('button');
                insertBtn.className = 'code-action-btn';
                insertBtn.textContent = 'Insert';
                insertBtn.onclick = () => {
                    vscode.postMessage({
                        command: 'insertCode',
                        code: pre.textContent
                    });
                };
                
                actionsDiv.appendChild(copyBtn);
                actionsDiv.appendChild(insertBtn);
                pre.appendChild(actionsDiv);
            });
            
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            
            return messageDiv;
        }

        function sendMessage() {
            const text = messageInput.value.trim();
            if (!text || isLoading) return;
            
            addMessage({ role: 'user', content: text });
            messageInput.value = '';
            isLoading = true;
            sendBtn.disabled = true;
            sendBtn.textContent = 'Sending...';
            
            vscode.postMessage({
                command: 'sendMessage',
                text: text
            });
        }

        function clearChat() {
            vscode.postMessage({ command: 'clearChat' });
        }

        sendBtn.addEventListener('click', sendMessage);
        clearBtn.addEventListener('click', clearChat);
        
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'addMessage':
                    if (message.isLoading) {
                        // This is just to show user message
                        return;
                    }
                    
                    addMessage(message.message, message.queryType, message.isError);
                    isLoading = false;
                    sendBtn.disabled = false;
                    sendBtn.textContent = 'Send';
                    break;
                    
                case 'clearMessages':
                    chatContainer.innerHTML = '';
                    addMessage({
                        role: 'assistant',
                        content: 'Chat cleared. How can I help you?'
                    });
                    break;
            }
        });
        
        // Include marked.js for markdown parsing
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        document.head.appendChild(script);
    </script>
</body>
</html>`;
    }
}