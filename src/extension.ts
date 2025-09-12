import * as vscode from 'vscode';
import { ChatPanel } from './chat/ChatPanel';
import { WorkspaceAnalyzer } from './workspace/WorkspaceAnalyzer';
import { DeepSeekAPI } from './api/DeepSeekAPI';
import { CodeGenerator } from './commands/CodeGenerator';
import { CodeRefactorer } from './commands/CodeRefactorer';

export function activate(context: vscode.ExtensionContext) {
    console.log('DeepSeek Code Companion is now active!');

    // Initialize API client
    const api = new DeepSeekAPI();
    const workspaceAnalyzer = new WorkspaceAnalyzer();
    const codeGenerator = new CodeGenerator(api);
    const codeRefactorer = new CodeRefactorer(api);

    // Register commands
    const openChatCommand = vscode.commands.registerCommand('deepseek.openChat', () => {
        ChatPanel.createOrShow(context.extensionUri, api);
    });

    const analyzeWorkspaceCommand = vscode.commands.registerCommand('deepseek.analyzeWorkspace', () => {
        workspaceAnalyzer.analyzeWorkspace();
    });

    const generateCodeCommand = vscode.commands.registerCommand('deepseek.generateCode', () => {
        codeGenerator.generateCode();
    });

    const generateFromCommentCommand = vscode.commands.registerCommand('deepseek.generateFromComment', () => {
        codeGenerator.generateFromComment();
    });

    const refactorCodeCommand = vscode.commands.registerCommand('deepseek.refactorCode', () => {
        codeRefactorer.refactorCode();
    });

    const quickFixCommand = vscode.commands.registerCommand('deepseek.quickFix', () => {
        codeRefactorer.quickFix();
    });

    // Add commands to subscription list
    context.subscriptions.push(
        openChatCommand,
        analyzeWorkspaceCommand,
        generateCodeCommand,
        generateFromCommentCommand,
        refactorCodeCommand,
        quickFixCommand
    );

    // Show welcome message on first activation
    const isFirstTime = context.globalState.get('deepseek.firstTime', true);
    if (isFirstTime) {
        vscode.window.showInformationMessage(
            'Welcome to DeepSeek Code Companion! Click "Open Chat" to get started.',
            'Open Chat'
        ).then(selection => {
            if (selection === 'Open Chat') {
                vscode.commands.executeCommand('deepseek.openChat');
            }
        });
        context.globalState.update('deepseek.firstTime', false);
    }
}

export function deactivate() {
    console.log('DeepSeek Code Companion is now deactivated');
}