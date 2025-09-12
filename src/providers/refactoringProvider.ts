import * as vscode from 'vscode';
import axios from 'axios';

export class RefactoringProvider implements vscode.CodeActionProvider {
    
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.Refactor,
        vscode.CodeActionKind.RefactorExtract,
        vscode.CodeActionKind.RefactorInline,
        vscode.CodeActionKind.RefactorRewrite
    ];

    public async provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeAction[]> {
        const actions: vscode.CodeAction[] = [];

        // Only provide actions if there's selected text
        if (range.isEmpty) {
            return actions;
        }

        const selectedText = document.getText(range);
        if (!selectedText.trim()) {
            return actions;
        }

        // Create refactoring actions
        const refactorAction = this.createRefactorAction(document, range, selectedText);
        const optimizeAction = this.createOptimizeAction(document, range, selectedText);
        const extractAction = this.createExtractAction(document, range, selectedText);
        const explainAction = this.createExplainAction(document, range, selectedText);

        actions.push(refactorAction, optimizeAction, extractAction, explainAction);

        return actions;
    }

    private createRefactorAction(document: vscode.TextDocument, range: vscode.Range, selectedText: string): vscode.CodeAction {
        const action = new vscode.CodeAction('🤖 Refactor with DeepSeek', vscode.CodeActionKind.Refactor);
        action.command = {
            command: 'deepseek.refactorSelection',
            title: 'Refactor with DeepSeek',
            arguments: [document, range, selectedText, 'refactor']
        };
        return action;
    }

    private createOptimizeAction(document: vscode.TextDocument, range: vscode.Range, selectedText: string): vscode.CodeAction {
        const action = new vscode.CodeAction('⚡ Optimize Performance', vscode.CodeActionKind.RefactorRewrite);
        action.command = {
            command: 'deepseek.refactorSelection',
            title: 'Optimize Performance',
            arguments: [document, range, selectedText, 'optimize']
        };
        return action;
    }

    private createExtractAction(document: vscode.TextDocument, range: vscode.Range, selectedText: string): vscode.CodeAction {
        const action = new vscode.CodeAction('📦 Extract Function/Method', vscode.CodeActionKind.RefactorExtract);
        action.command = {
            command: 'deepseek.refactorSelection',
            title: 'Extract Function/Method',
            arguments: [document, range, selectedText, 'extract']
        };
        return action;
    }

    private createExplainAction(document: vscode.TextDocument, range: vscode.Range, selectedText: string): vscode.CodeAction {
        const action = new vscode.CodeAction('💡 Explain & Improve', vscode.CodeActionKind.Refactor);
        action.command = {
            command: 'deepseek.refactorSelection',
            title: 'Explain & Improve',
            arguments: [document, range, selectedText, 'explain']
        };
        return action;
    }

    public async refactorSelection() {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showWarningMessage('Please select code to refactor.');
            return;
        }

        const selection = activeEditor.selection;
        if (selection.isEmpty) {
            vscode.window.showWarningMessage('Please select code to refactor.');
            return;
        }

        const selectedText = activeEditor.document.getText(selection);
        
        // Show quick pick for refactoring options
        const refactorOptions = [
            { label: '🤖 General Refactoring', description: 'Improve code structure and readability', value: 'refactor' },
            { label: '⚡ Performance Optimization', description: 'Optimize for better performance', value: 'optimize' },
            { label: '📦 Extract Function/Method', description: 'Extract code into reusable functions', value: 'extract' },
            { label: '🔧 Fix Code Issues', description: 'Fix potential bugs and issues', value: 'fix' },
            { label: '📝 Add Documentation', description: 'Add comments and documentation', value: 'document' },
            { label: '🎯 Simplify Logic', description: 'Simplify complex logic', value: 'simplify' }
        ];

        const selectedOption = await vscode.window.showQuickPick(refactorOptions, {
            placeHolder: 'Select refactoring type'
        });

        if (!selectedOption) {
            return;
        }

        await this.performRefactoring(activeEditor.document, selection, selectedText, selectedOption.value);
    }

    public async performRefactoring(
        document: vscode.TextDocument,
        range: vscode.Range,
        selectedText: string,
        refactorType: string
    ) {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Refactoring code with DeepSeek...`,
            cancellable: false
        }, async (progress) => {
            try {
                const refactoredCode = await this._refactorWithDeepSeek(document, selectedText, refactorType);
                
                if (refactorType === 'explain') {
                    // Show explanation in a new document
                    const explanationDoc = await vscode.workspace.openTextDocument({
                        content: refactoredCode,
                        language: 'markdown'
                    });
                    await vscode.window.showTextDocument(explanationDoc, vscode.ViewColumn.Beside);
                } else {
                    // Replace the selected code
                    const activeEditor = vscode.window.activeTextEditor;
                    if (activeEditor) {
                        await activeEditor.edit(editBuilder => {
                            editBuilder.replace(range, refactoredCode);
                        });
                        vscode.window.showInformationMessage('Code refactored successfully!');
                    }
                }

            } catch (error) {
                console.error('Error refactoring code:', error);
                vscode.window.showErrorMessage('Failed to refactor code. Please check your API key and try again.');
            }
        });
    }

    private async _refactorWithDeepSeek(document: vscode.TextDocument, selectedText: string, refactorType: string): Promise<string> {
        const config = vscode.workspace.getConfiguration('deepseek');
        const apiKey = config.get<string>('apiKey');
        const model = config.get<string>('model', 'deepseek-coder');

        if (!apiKey) {
            throw new Error('API key not configured');
        }

        const language = document.languageId;
        const fileName = document.fileName;

        // Build prompts based on refactor type
        const prompts = {
            'refactor': `Refactor this ${language} code to improve readability, maintainability, and follow best practices:`,
            'optimize': `Optimize this ${language} code for better performance while maintaining functionality:`,
            'extract': `Extract reusable functions/methods from this ${language} code and reorganize it:`,
            'fix': `Analyze this ${language} code and fix any potential bugs, issues, or bad practices:`,
            'document': `Add comprehensive comments and documentation to this ${language} code:`,
            'simplify': `Simplify this ${language} code to make it more readable and less complex:`,
            'explain': `Analyze this ${language} code and provide a detailed explanation of what it does, how it works, any issues you find, and suggestions for improvement:`
        };

        const prompt = prompts[refactorType as keyof typeof prompts] || prompts['refactor'];

        const systemPrompt = `You are DeepSeek Code Companion, an expert code refactoring assistant. 
${refactorType === 'explain' ? 
    'Provide a detailed analysis in markdown format with sections for: Overview, How it works, Potential issues, and Improvement suggestions.' :
    'Return only the refactored code without explanations unless specifically requested. Maintain the original functionality while improving the code quality.'
}

Context:
- Language: ${language}
- File: ${fileName}
- Task: ${refactorType}`;

        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: `${prompt}\n\n\`\`\`${language}\n${selectedText}\n\`\`\``
                }
            ],
            max_tokens: 2000,
            temperature: 0.3
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        let result = response.data.choices[0].message.content;
        
        // If not explaining, clean up markdown code blocks
        if (refactorType !== 'explain') {
            result = result.replace(/```[\w]*\n?/g, '').replace(/```/g, '');
        }
        
        return result;
    }
}