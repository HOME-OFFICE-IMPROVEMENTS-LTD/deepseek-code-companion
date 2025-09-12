import * as vscode from 'vscode';
import { ModelManager } from './ModelManager';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'deepSeekChatView';
    private _view?: vscode.WebviewView;
    private modelManager?: ModelManager;

    constructor(private readonly _extensionUri: vscode.Uri, context?: vscode.ExtensionContext) {
        if (context) {
            this.modelManager = new ModelManager(context);
        }
    }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = '<html><body><h1>OpenRouter Integration Ready - Testing Phase</h1></body></html>';
    }
}
