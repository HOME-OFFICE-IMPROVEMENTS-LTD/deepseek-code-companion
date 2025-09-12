import * as vscode from 'vscode';
import { ChatViewProvider } from './ChatViewProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('DeepSeek Code Companion is now active!');

    const provider = new ChatViewProvider(context.extensionUri, context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, provider)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('deepSeek-code-companion.focusChat', () => {
            vscode.commands.executeCommand('deepSeekChatView.focus');
        })
    );
}

export function deactivate() {}