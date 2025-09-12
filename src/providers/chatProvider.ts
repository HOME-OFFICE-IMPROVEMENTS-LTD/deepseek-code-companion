import * as vscode from 'vscode';
import axios from 'axios';

export class ChatProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'deepseek.chatView';
    private _view?: vscode.WebviewView;

    constructor(private readonly _context: vscode.ExtensionContext) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._context.extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'sendMessage':
                    await this._handleUserMessage(data.message);
                    break;
                case 'clearChat':
                    this._clearChat();
                    break;
            }
        });
    }

    public openChat() {
        if (this._view) {
            this._view.show?.(true);
        } else {
            vscode.commands.executeCommand('deepseek.chatView.focus');
        }
    }

    private async _handleUserMessage(message: string) {
        if (!this._view) {
            return;
        }

        // Add user message to chat
        this._view.webview.postMessage({
            type: 'addMessage',
            message: {
                role: 'user',
                content: message,
                timestamp: new Date().toLocaleTimeString()
            }
        });

        try {
            // Get configuration
            const config = vscode.workspace.getConfiguration('deepseek');
            const apiKey = config.get<string>('apiKey');
            const model = config.get<string>('model', 'deepseek-coder');

            if (!apiKey) {
                this._view.webview.postMessage({
                    type: 'addMessage',
                    message: {
                        role: 'assistant',
                        content: 'Please configure your DeepSeek API key in the extension settings.',
                        timestamp: new Date().toLocaleTimeString()
                    }
                });
                return;
            }

            // Get current file context for better responses
            const activeEditor = vscode.window.activeTextEditor;
            let contextualMessage = message;
            
            if (activeEditor) {
                const document = activeEditor.document;
                const selection = activeEditor.selection;
                
                if (!selection.isEmpty) {
                    const selectedText = document.getText(selection);
                    contextualMessage = `Context: I'm working with ${document.languageId} code.\n\nSelected code:\n\`\`\`${document.languageId}\n${selectedText}\n\`\`\`\n\nQuestion: ${message}`;
                } else {
                    contextualMessage = `Context: I'm working with a ${document.languageId} file (${document.fileName}).\n\nQuestion: ${message}`;
                }
            }

            // Call DeepSeek API
            const response = await this._callDeepSeekAPI(apiKey, model, contextualMessage);

            // Add assistant response to chat
            this._view.webview.postMessage({
                type: 'addMessage',
                message: {
                    role: 'assistant',
                    content: response,
                    timestamp: new Date().toLocaleTimeString()
                }
            });

        } catch (error) {
            console.error('Error calling DeepSeek API:', error);
            this._view.webview.postMessage({
                type: 'addMessage',
                message: {
                    role: 'assistant',
                    content: 'Sorry, I encountered an error while processing your request. Please check your API key and try again.',
                    timestamp: new Date().toLocaleTimeString()
                }
            });
        }
    }

    private async _callDeepSeekAPI(apiKey: string, model: string, message: string): Promise<string> {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'You are DeepSeek Code Companion, a helpful AI assistant for VS Code. You help developers with code generation, refactoring, debugging, and answering questions about their code. Always provide clear, practical solutions and explain your reasoning.'
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            max_tokens: 2000,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    }

    private _clearChat() {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'clearChat'
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
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
                    padding: 10px;
                    box-sizing: border-box;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                
                .chat-container {
                    flex: 1;
                    overflow-y: auto;
                    margin-bottom: 10px;
                    padding: 10px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                }
                
                .message {
                    margin-bottom: 15px;
                    padding: 10px;
                    border-radius: 8px;
                }
                
                .user-message {
                    background-color: var(--vscode-inputOption-activeBackground);
                    margin-left: 20px;
                }
                
                .assistant-message {
                    background-color: var(--vscode-editor-selectionBackground);
                    margin-right: 20px;
                }
                
                .message-header {
                    font-weight: bold;
                    margin-bottom: 5px;
                    font-size: 0.9em;
                    opacity: 0.8;
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
                    border-radius: 4px;
                    overflow-x: auto;
                    font-family: var(--vscode-editor-font-family);
                }
                
                .input-container {
                    display: flex;
                    gap: 10px;
                }
                
                .message-input {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    font-family: inherit;
                    font-size: inherit;
                    resize: vertical;
                    min-height: 40px;
                }
                
                .send-button, .clear-button {
                    padding: 10px 15px;
                    border: none;
                    border-radius: 4px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    cursor: pointer;
                    font-family: inherit;
                    font-size: inherit;
                }
                
                .send-button:hover, .clear-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .clear-button {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                
                .clear-button:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
                
                .welcome-message {
                    text-align: center;
                    color: var(--vscode-descriptionForeground);
                    margin: 20px 0;
                    font-style: italic;
                }
            </style>
        </head>
        <body>
            <div class="chat-container" id="chatContainer">
                <div class="welcome-message">
                    Welcome to DeepSeek Code Companion! 🚀<br>
                    Ask me anything about your code, and I'll help you generate, refactor, or analyze it.
                </div>
            </div>
            <div class="input-container">
                <textarea class="message-input" id="messageInput" placeholder="Ask DeepSeek anything about your code..." rows="2"></textarea>
                <button class="send-button" id="sendButton">Send</button>
                <button class="clear-button" id="clearButton">Clear</button>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                const chatContainer = document.getElementById('chatContainer');
                const messageInput = document.getElementById('messageInput');
                const sendButton = document.getElementById('sendButton');
                const clearButton = document.getElementById('clearButton');

                function sendMessage() {
                    const message = messageInput.value.trim();
                    if (message) {
                        vscode.postMessage({
                            type: 'sendMessage',
                            message: message
                        });
                        messageInput.value = '';
                        messageInput.focus();
                    }
                }

                function clearChat() {
                    vscode.postMessage({
                        type: 'clearChat'
                    });
                }

                function addMessage(message) {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = \`message \${message.role}-message\`;
                    
                    const headerDiv = document.createElement('div');
                    headerDiv.className = 'message-header';
                    headerDiv.textContent = \`\${message.role === 'user' ? '👤 You' : '🤖 DeepSeek'} - \${message.timestamp}\`;
                    
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'message-content';
                    
                    // Simple markdown-like formatting
                    let content = message.content;
                    content = content.replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>');
                    content = content.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
                    content = content.replace(/\\*\\*([^\\*]+)\\*\\*/g, '<strong>$1</strong>');
                    content = content.replace(/\\*([^\\*]+)\\*/g, '<em>$1</em>');
                    
                    contentDiv.innerHTML = content;
                    
                    messageDiv.appendChild(headerDiv);
                    messageDiv.appendChild(contentDiv);
                    chatContainer.appendChild(messageDiv);
                    
                    // Scroll to bottom
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }

                sendButton.addEventListener('click', sendMessage);
                clearButton.addEventListener('click', clearChat);
                
                messageInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                });

                // Listen for messages from the extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.type) {
                        case 'addMessage':
                            addMessage(message.message);
                            break;
                        case 'clearChat':
                            const welcomeMsg = chatContainer.querySelector('.welcome-message');
                            chatContainer.innerHTML = '';
                            if (welcomeMsg) {
                                chatContainer.appendChild(welcomeMsg.cloneNode(true));
                            }
                            break;
                    }
                });

                // Focus input on load
                messageInput.focus();
            </script>
        </body>
        </html>`;
    }
}