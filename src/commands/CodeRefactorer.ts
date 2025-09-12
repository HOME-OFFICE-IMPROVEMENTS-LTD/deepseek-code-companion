import * as vscode from 'vscode';
import { DeepSeekAPI } from '../api/DeepSeekAPI';

export interface RefactoringOption {
    id: string;
    label: string;
    description: string;
    prompt: string;
}

export class CodeRefactorer {
    private readonly refactoringOptions: RefactoringOption[] = [
        {
            id: 'optimize',
            label: 'Optimize Performance',
            description: 'Improve code performance and efficiency',
            prompt: 'Optimize this code for better performance while maintaining functionality. Focus on algorithmic improvements, reducing complexity, and eliminating bottlenecks.'
        },
        {
            id: 'readability',
            label: 'Improve Readability',
            description: 'Make code more readable and maintainable',
            prompt: 'Refactor this code to improve readability and maintainability. Use clear variable names, add appropriate comments, and follow best practices.'
        },
        {
            id: 'extract_function',
            label: 'Extract Functions',
            description: 'Break down code into smaller, reusable functions',
            prompt: 'Refactor this code by extracting logical pieces into separate, well-named functions. Improve modularity and reusability.'
        },
        {
            id: 'simplify',
            label: 'Simplify Logic',
            description: 'Simplify complex logic and reduce nesting',
            prompt: 'Simplify this code by reducing complexity, eliminating unnecessary nesting, and making the logic more straightforward.'
        },
        {
            id: 'modern_syntax',
            label: 'Modernize Syntax',
            description: 'Update to modern language features',
            prompt: 'Modernize this code using the latest language features, syntax improvements, and best practices while maintaining compatibility.'
        },
        {
            id: 'error_handling',
            label: 'Add Error Handling',
            description: 'Improve error handling and robustness',
            prompt: 'Add proper error handling, input validation, and make this code more robust and resilient to edge cases.'
        },
        {
            id: 'type_safety',
            label: 'Improve Type Safety',
            description: 'Add or improve type annotations',
            prompt: 'Improve type safety by adding proper type annotations, interfaces, and type guards where appropriate.'
        },
        {
            id: 'security',
            label: 'Security Improvements',
            description: 'Address potential security vulnerabilities',
            prompt: 'Review and improve the security of this code, addressing potential vulnerabilities and following security best practices.'
        }
    ];

    constructor(private api: DeepSeekAPI) {}

    async refactorCode(): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showWarningMessage('No active editor found. Please select code to refactor.');
            return;
        }

        const selection = activeEditor.selection;
        if (selection.isEmpty) {
            vscode.window.showWarningMessage('Please select the code you want to refactor.');
            return;
        }

        try {
            // Show refactoring options
            const selectedOption = await this.showRefactoringOptions();
            if (!selectedOption) {
                return;
            }

            const selectedCode = activeEditor.document.getText(selection);
            const context = this.getCodeContext(activeEditor, selection);

            await this.performRefactoring(activeEditor, selection, selectedCode, selectedOption, context);

        } catch (error) {
            console.error('Error refactoring code:', error);
            vscode.window.showErrorMessage(`Failed to refactor code: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async showRefactoringOptions(): Promise<RefactoringOption | undefined> {
        const quickPickItems = this.refactoringOptions.map(option => ({
            label: option.label,
            description: option.description,
            option: option
        }));

        // Add custom option
        quickPickItems.push({
            label: '$(edit) Custom Refactoring',
            description: 'Specify your own refactoring instructions',
            option: {
                id: 'custom',
                label: 'Custom',
                description: 'Custom refactoring',
                prompt: ''
            }
        });

        const selected = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: 'Choose a refactoring option',
            matchOnDescription: true
        });

        if (!selected) {
            return undefined;
        }

        if (selected.option.id === 'custom') {
            const customPrompt = await vscode.window.showInputBox({
                prompt: 'Enter your refactoring instructions',
                placeHolder: 'e.g., "Convert this to use async/await instead of promises"',
                ignoreFocusOut: true
            });

            if (!customPrompt) {
                return undefined;
            }

            return {
                id: 'custom',
                label: 'Custom',
                description: 'Custom refactoring',
                prompt: customPrompt
            };
        }

        return selected.option;
    }

    private getCodeContext(editor: vscode.TextEditor, selection: vscode.Range): string {
        const document = editor.document;
        let context = '';

        // Get surrounding context
        const startLine = Math.max(0, selection.start.line - 5);
        const endLine = Math.min(document.lineCount - 1, selection.end.line + 5);
        
        const beforeSelection = document.getText(new vscode.Range(startLine, 0, selection.start.line, 0));
        const afterSelection = document.getText(new vscode.Range(selection.end.line + 1, 0, endLine + 1, 0));

        if (beforeSelection.trim()) {
            context += `Code before:\n${beforeSelection}\n\n`;
        }

        if (afterSelection.trim()) {
            context += `Code after:\n${afterSelection}\n\n`;
        }

        // Add file information
        context += `File: ${document.fileName}\n`;
        context += `Language: ${document.languageId}\n`;

        return context;
    }

    private async performRefactoring(
        editor: vscode.TextEditor,
        selection: vscode.Range,
        selectedCode: string,
        option: RefactoringOption,
        context: string
    ): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Refactoring: ${option.label}...`,
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0 });

            const messages = [
                {
                    role: 'user' as const,
                    content: `${context ? `Context:\n${context}\n\n` : ''}Code to refactor:\n${selectedCode}\n\nRefactoring instruction: ${option.prompt}\n\nPlease provide the refactored code with explanations of the changes made.`
                }
            ];

            const queryType = this.api.detectQueryType(`refactor ${option.prompt}`, selectedCode);
            const response = await this.api.chatCompletion(messages, queryType);

            progress.report({ increment: 100 });

            await this.handleRefactoringResponse(editor, selection, selectedCode, response, option);
        });
    }

    private async handleRefactoringResponse(
        editor: vscode.TextEditor,
        selection: vscode.Range,
        originalCode: string,
        response: string,
        option: RefactoringOption
    ): Promise<void> {
        const refactoredCode = this.extractCodeFromResponse(response);

        if (!refactoredCode) {
            await this.showResponseInNewDocument(response, `Refactoring: ${option.label}`);
            return;
        }

        // Show comparison and options
        const actions = [
            'Replace original code',
            'Insert below original',
            'Show side-by-side comparison',
            'Save to new file',
            'Show full response'
        ];

        const choice = await vscode.window.showQuickPick(actions, {
            placeHolder: 'How would you like to apply the refactored code?'
        });

        if (!choice) {
            return;
        }

        switch (choice) {
            case 'Replace original code':
                await editor.edit(editBuilder => {
                    editBuilder.replace(selection, refactoredCode);
                });
                vscode.window.showInformationMessage(`Code refactored: ${option.label}`);
                break;

            case 'Insert below original': {
                const insertPosition = new vscode.Position(selection.end.line + 1, 0);
                await editor.edit(editBuilder => {
                    editBuilder.insert(insertPosition, `\n// Refactored version (${option.label}):\n${refactoredCode}\n`);
                });
                break;
            }
            
            case 'Show side-by-side comparison': {
                await this.showSideBySideComparison(originalCode, refactoredCode, option.label);
                break;
            }

            case 'Save to new file':
                await this.createNewFileWithCode(refactoredCode, editor.document.languageId, `Refactored: ${option.label}`);
                break;

            case 'Show full response':
                await this.showResponseInNewDocument(response, `Refactoring: ${option.label}`);
                break;
        }
    }

    private extractCodeFromResponse(response: string): string | null {
        // Look for code blocks
        const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
        const matches = response.match(codeBlockRegex);

        if (matches && matches.length > 0) {
            // Extract the largest code block
            let largestBlock = '';
            matches.forEach(match => {
                const code = match.replace(/```[\w]*\n/, '').replace(/```$/, '');
                if (code.length > largestBlock.length) {
                    largestBlock = code;
                }
            });
            return largestBlock.trim();
        }

        return null;
    }

    private async showSideBySideComparison(original: string, refactored: string, refactoringType: string): Promise<void> {
        // Create temporary files for comparison
        const originalDoc = await vscode.workspace.openTextDocument({
            content: original,
            language: vscode.window.activeTextEditor?.document.languageId || 'plaintext'
        });

        const refactoredDoc = await vscode.workspace.openTextDocument({
            content: refactored,
            language: vscode.window.activeTextEditor?.document.languageId || 'plaintext'
        });

        // Show documents side by side
        await vscode.window.showTextDocument(originalDoc, vscode.ViewColumn.One);
        await vscode.window.showTextDocument(refactoredDoc, vscode.ViewColumn.Two);

        // Execute diff command
        await vscode.commands.executeCommand('vscode.diff', originalDoc.uri, refactoredDoc.uri, `Refactoring Comparison: ${refactoringType}`);
    }

    private async createNewFileWithCode(code: string, languageId: string, title: string): Promise<void> {
        const newFile = await vscode.workspace.openTextDocument({
            content: `// ${title}\n\n${code}`,
            language: languageId
        });

        await vscode.window.showTextDocument(newFile);
    }

    private async showResponseInNewDocument(content: string, title: string): Promise<void> {
        const newFile = await vscode.workspace.openTextDocument({
            content: `# ${title}\n\n${content}`,
            language: 'markdown'
        });

        await vscode.window.showTextDocument(newFile);
    }

    async quickFix(): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }

        const selection = activeEditor.selection;
        if (selection.isEmpty) {
            vscode.window.showInformationMessage('Please select the code you want to fix.');
            return;
        }

        try {
            const selectedCode = activeEditor.document.getText(selection);
            const context = this.getCodeContext(activeEditor, selection);

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Analyzing and fixing code...',
                cancellable: false
            }, async (_progress) => {
                const messages = [
                    {
                        role: 'user' as const,
                        content: `${context ? `Context:\n${context}\n\n` : ''}Please analyze this code and fix any issues you find:\n\n${selectedCode}\n\nFocus on:\n- Syntax errors\n- Logic bugs\n- Performance issues\n- Best practice violations\n\nProvide the corrected code with explanations of what was fixed.`
                    }
                ];

                const queryType = this.api.detectQueryType('fix bugs and issues', selectedCode);
                const response = await this.api.chatCompletion(messages, queryType);

                await this.handleRefactoringResponse(activeEditor, selection, selectedCode, response, {
                    id: 'quick_fix',
                    label: 'Quick Fix',
                    description: 'Fix issues in code',
                    prompt: 'Fix issues'
                });
            });

        } catch (error) {
            console.error('Error in quick fix:', error);
            vscode.window.showErrorMessage(`Failed to fix code: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}