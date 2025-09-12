import * as vscode from 'vscode';
import { ChatProvider } from './providers/chatProvider';
import { CodeGenerationProvider } from './providers/codeGenerationProvider';
import { RefactoringProvider } from './providers/refactoringProvider';
import { WorkspaceAnalyzer } from './providers/workspaceAnalyzer';

export function activate(context: vscode.ExtensionContext) {
    console.log('DeepSeek Code Companion is now active!');

    // Initialize providers
    const chatProvider = new ChatProvider(context);
    const codeGenerationProvider = new CodeGenerationProvider();
    const refactoringProvider = new RefactoringProvider();
    const workspaceAnalyzer = new WorkspaceAnalyzer();

    // Register commands
    const openChatCommand = vscode.commands.registerCommand('deepseek.openChat', () => {
        chatProvider.openChat();
    });

    const generateCodeCommand = vscode.commands.registerCommand('deepseek.generateCode', async () => {
        await codeGenerationProvider.generateCode();
    });

    const refactorCodeCommand = vscode.commands.registerCommand('deepseek.refactorCode', async (document?: vscode.TextDocument, range?: vscode.Range, selectedText?: string, refactorType?: string) => {
        if (document && range && selectedText && refactorType) {
            await refactoringProvider.performRefactoring(document, range, selectedText, refactorType);
        } else {
            await refactoringProvider.refactorSelection();
        }
    });

    const analyzeWorkspaceCommand = vscode.commands.registerCommand('deepseek.analyzeWorkspace', async () => {
        await workspaceAnalyzer.analyzeWorkspace();
    });

    // Additional commands
    const generateFromCommentCommand = vscode.commands.registerCommand('deepseek.generateFromComment', async () => {
        await codeGenerationProvider.generateCodeFromComment();
    });

    const generateDocsCommand = vscode.commands.registerCommand('deepseek.generateDocs', async () => {
        vscode.window.showInformationMessage('Documentation generation coming soon!');
    });

    const findCodeSmellsCommand = vscode.commands.registerCommand('deepseek.findCodeSmells', async () => {
        vscode.window.showInformationMessage('Code smell detection coming soon!');
    });

    const applySuggestionCommand = vscode.commands.registerCommand('deepseek.applySuggestion', async (suggestion: any) => {
        vscode.window.showInformationMessage(`Applying suggestion: ${suggestion.title}`);
    });

    // Register providers
    const chatViewProvider = vscode.window.registerWebviewViewProvider('deepseek.chatView', chatProvider);
    const workspaceViewProvider = vscode.window.registerTreeDataProvider('deepseek.workspaceView', workspaceAnalyzer);

    // Register code action provider for refactoring
    const codeActionProvider = vscode.languages.registerCodeActionsProvider(
        { scheme: 'file' },
        refactoringProvider
    );

    // Register completion item provider for AI-powered completions
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file' },
        {
            async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                // Simple AI completion items
                const completionItems: vscode.CompletionItem[] = [];
                
                const item = new vscode.CompletionItem('🤖 Generate with DeepSeek', vscode.CompletionItemKind.Snippet);
                item.detail = 'AI-powered code generation';
                item.documentation = 'Use DeepSeek AI to generate code based on context';
                item.command = {
                    command: 'deepseek.generateCode',
                    title: 'Generate Code'
                };
                
                completionItems.push(item);
                return completionItems;
            }
        },
        ' ', '\n' // Trigger on space and newline
    );

    // Add all disposables to context
    context.subscriptions.push(
        openChatCommand,
        generateCodeCommand,
        refactorCodeCommand,
        analyzeWorkspaceCommand,
        generateFromCommentCommand,
        generateDocsCommand,
        findCodeSmellsCommand,
        applySuggestionCommand,
        chatViewProvider,
        workspaceViewProvider,
        codeActionProvider,
        completionProvider
    );

    // Show welcome message
    vscode.window.showInformationMessage('DeepSeek Code Companion is ready to assist you! 🚀');
}

export function deactivate() {
    console.log('DeepSeek Code Companion has been deactivated.');
}