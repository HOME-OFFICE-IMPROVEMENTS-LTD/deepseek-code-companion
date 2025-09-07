// src/DeepSeekPanel.ts
import * as vscode from 'vscode';
import { getDeepSeekResponse } from './deepSeekAPI';

export class DeepSeekPanel {
    public static currentPanel: DeepSeekPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async (message: any) => {
                if (message.command === 'sendMessage') {
                    try {
                        const response = await getDeepSeekResponse(message.text);
                        this.sendResponse(response);
                    } catch (error: any) {
                        this.sendResponse(`Error: ${error.message}`);
                    }
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow() {
        const column = vscode.window.activeTextEditor?.viewColumn;
        if (DeepSeekPanel.currentPanel) {
            DeepSeekPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'deepSeekChat',
            'DeepSeek Code Companion',
            column || vscode.ViewColumn.One,
            { enableScripts: true }
        );

        DeepSeekPanel.currentPanel = new DeepSeekPanel(panel);
    }

    private async _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>DeepSeek Chat</title>
                <style>
                    body { 
                        font-family: 'Segoe UI', Tahoma, sans-serif; 
                        padding: 20px; 
                        background: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                    }
                    #chat-container { 
                        height: 80vh; 
                        border: 1px solid var(--vscode-input-border);
                        padding: 10px; 
                        overflow-y: auto; 
                    }
                    #input-container { 
                        display: flex; 
                        margin-top: 10px; 
                    }
                    #user-input { 
                        flex: 1; 
                        padding: 10px; 
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                    }
                    button { 
                        padding: 10px; 
                        margin-left: 10px; 
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                    }
                </style>
            </head>
            <body>
                <div id="chat-container"></div>
                <div id="input-container">
                    <input type="text" id="user-input" placeholder="Ask DeepSeek a question...">
                    <button onclick="sendMessage()">Send</button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    const chatContainer = document.getElementById('chat-container');
                    const userInput = document.getElementById('user-input');

                    function sendMessage() {
                        const message = userInput.value;
                        if (message) {
                            // Add user message to chat
                            const userElement = document.createElement('div');
                            userElement.textContent = 'You: ' + message;
                            userElement.style.color = 'var(--vscode-input-foreground)';
                            userElement.style.marginBottom = '10px';
                            chatContainer.appendChild(userElement);
                            
                            vscode.postMessage({ command: 'sendMessage', text: message });
                            userInput.value = '';
                        }
                    }

                    userInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            sendMessage();
                        }
                    });

                    window.addEventListener('message', (event) => {
                        const message = event.data;
                        if (message.command === 'addResponse') {
                            const responseElement = document.createElement('div');
                            responseElement.textContent = 'DeepSeek: ' + message.text;
                            responseElement.style.color = 'var(--vscode-descriptionForeground)';
                            responseElement.style.marginBottom = '20px';
                            chatContainer.appendChild(responseElement);
                            chatContainer.scrollTop = chatContainer.scrollHeight;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }

    public sendResponse(responseText: string) {
        this._panel.webview.postMessage({ 
            command: 'addResponse', 
            text: responseText 
        });
    }

    public dispose() {
        DeepSeekPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) { x.dispose(); }
        }
    }
}