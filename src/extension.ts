import * as vscode from 'vscode';
import { ChatViewProvider } from './ChatViewProvider';
import { Phase5Integration } from './phase5/Phase5Integration';
import { ModelManager } from './ModelManager';

export function activate(context: vscode.ExtensionContext) {
    console.log('DeepSeek Code Companion is now active!');

    // Initialize ModelManager for AI capabilities
    const modelManager = new ModelManager(context);

    // Register chat functionality
    const provider = new ChatViewProvider(context.extensionUri, context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, provider)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('deepSeek-code-companion.focusChat', () => {
            vscode.commands.executeCommand('deepSeekChatView.focus');
        })
    );

    // Initialize Phase 5 Advanced Features
    const phase5Integration = new Phase5Integration(context, modelManager);
    context.subscriptions.push({
        dispose: () => phase5Integration.dispose()
    });

    console.log('✅ Phase 5 Advanced Features initialized');
}

export function deactivate() {}