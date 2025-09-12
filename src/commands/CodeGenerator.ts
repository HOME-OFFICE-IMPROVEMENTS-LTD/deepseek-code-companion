import * as vscode from 'vscode';
import { DeepSeekAPI } from '../api/DeepSeekAPI';

export class CodeGenerator {
    constructor(private api: DeepSeekAPI) {}

    async generateCode(): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showWarningMessage('No active editor found. Please open a file to generate code.');
            return;
        }

        try {
            // Get user input for what to generate
            const prompt = await vscode.window.showInputBox({
                prompt: 'What code would you like me to generate?',
                placeHolder: 'e.g., "Create a function to sort an array of objects by a specific property"',
                ignoreFocusOut: true
            });

            if (!prompt) {
                return;
            }

            // Get current context
            const context = this.getCurrentContext(activeEditor);
            
            // Show progress
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Generating code...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });

                const messages = [
                    {
                        role: 'user' as const,
                        content: `${context ? `Context:\n${context}\n\n` : ''}Generate code for: ${prompt}\n\nPlease provide clean, well-documented code with appropriate comments.`
                    }
                ];

                const queryType = this.api.detectQueryType(prompt, context);
                const response = await this.api.chatCompletion(messages, queryType);

                progress.report({ increment: 100 });

                // Extract code from response
                const extractedCode = this.extractCodeFromResponse(response);
                
                if (extractedCode) {
                    await this.insertGeneratedCode(activeEditor, extractedCode, response);
                } else {
                    // Show full response in a new document if no code blocks found
                    await this.showResponseInNewDocument(response, 'Generated Code');
                }
            });

        } catch (error) {
            console.error('Error generating code:', error);
            vscode.window.showErrorMessage(`Failed to generate code: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private getCurrentContext(editor: vscode.TextEditor): string {
        const document = editor.document;
        const selection = editor.selection;
        
        let context = '';
        
        // Get selected text if any
        if (!selection.isEmpty) {
            context += `Selected code:\n${document.getText(selection)}\n\n`;
        }
        
        // Get surrounding context (function, class, etc.)
        const surroundingContext = this.getSurroundingContext(document, selection.active);
        if (surroundingContext) {
            context += `Current context:\n${surroundingContext}\n\n`;
        }
        
        // Add file information
        context += `File: ${document.fileName}\n`;
        context += `Language: ${document.languageId}\n`;
        
        return context;
    }

    private getSurroundingContext(document: vscode.TextDocument, position: vscode.Position): string {
        const text = document.getText();
        const lines = text.split('\n');
        const currentLine = position.line;
        
        // Look for function/class/method boundaries
        let startLine = Math.max(0, currentLine - 10);
        let endLine = Math.min(lines.length - 1, currentLine + 10);
        
        // Try to find more intelligent boundaries based on language
        const language = document.languageId;
        if (language === 'typescript' || language === 'javascript') {
            startLine = this.findJavaScriptFunctionStart(lines, currentLine);
            endLine = this.findJavaScriptFunctionEnd(lines, currentLine);
        }
        
        return lines.slice(startLine, endLine + 1).join('\n');
    }

    private findJavaScriptFunctionStart(lines: string[], currentLine: number): number {
        for (let i = currentLine; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.includes('function ') || line.includes('class ') || 
                line.includes('=>') || line.match(/^\s*(async\s+)?(\w+)\s*\(/)) {
                return i;
            }
        }
        return Math.max(0, currentLine - 10);
    }

    private findJavaScriptFunctionEnd(lines: string[], currentLine: number): number {
        let braceCount = 0;
        let started = false;
        
        for (let i = currentLine; i < lines.length; i++) {
            const line = lines[i];
            for (const char of line) {
                if (char === '{') {
                    braceCount++;
                    started = true;
                } else if (char === '}') {
                    braceCount--;
                    if (started && braceCount === 0) {
                        return i;
                    }
                }
            }
        }
        return Math.min(lines.length - 1, currentLine + 10);
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

    private async insertGeneratedCode(editor: vscode.TextEditor, code: string, fullResponse: string): Promise<void> {
        const options = ['Insert at cursor', 'Replace selection', 'Insert in new file', 'Show full response'];
        
        const choice = await vscode.window.showQuickPick(options, {
            placeHolder: 'How would you like to use the generated code?'
        });

        if (!choice) {
            return;
        }

        switch (choice) {
            case 'Insert at cursor':
                await editor.edit(editBuilder => {
                    editBuilder.insert(editor.selection.active, code);
                });
                break;
                
            case 'Replace selection':
                await editor.edit(editBuilder => {
                    editBuilder.replace(editor.selection, code);
                });
                break;
                
            case 'Insert in new file':
                await this.createNewFileWithCode(code, editor.document.languageId);
                break;
                
            case 'Show full response':
                await this.showResponseInNewDocument(fullResponse, 'Generated Code');
                break;
        }
    }

    private async createNewFileWithCode(code: string, languageId: string): Promise<void> {
        const newFile = await vscode.workspace.openTextDocument({
            content: code,
            language: languageId
        });
        
        await vscode.window.showTextDocument(newFile);
    }

    private async showResponseInNewDocument(content: string, _title: string): Promise<void> {
        const newFile = await vscode.workspace.openTextDocument({
            content: content,
            language: 'markdown'
        });
        
        await vscode.window.showTextDocument(newFile);
    }

    async generateFromComment(): Promise<void> {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }

        const document = activeEditor.document;
        const position = activeEditor.selection.active;
        const line = document.lineAt(position);
        const lineText = line.text.trim();

        // Check if current line is a comment
        const commentPrefixes = ['//', '#', '/*', '*', '--', '%'];
        const isComment = commentPrefixes.some(prefix => lineText.startsWith(prefix));

        if (!isComment) {
            vscode.window.showInformationMessage('Place cursor on a comment line to generate code from it.');
            return;
        }

        try {
            // Extract comment text
            let commentText = lineText;
            commentPrefixes.forEach(prefix => {
                if (commentText.startsWith(prefix)) {
                    commentText = commentText.substring(prefix.length).trim();
                }
            });

            // Remove additional comment markers
            commentText = commentText.replace(/\*+/g, '').trim();

            if (!commentText) {
                vscode.window.showWarningMessage('Comment appears to be empty.');
                return;
            }

            const context = this.getCurrentContext(activeEditor);
            
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Generating code from comment...',
                cancellable: false
            }, async (_progress) => {
                const messages = [
                    {
                        role: 'user' as const,
                        content: `${context ? `Context:\n${context}\n\n` : ''}Generate code based on this comment: "${commentText}"\n\nPlease provide clean, well-documented code that implements what the comment describes.`
                    }
                ];

                const queryType = this.api.detectQueryType(`generate ${commentText}`, context);
                const response = await this.api.chatCompletion(messages, queryType);

                const extractedCode = this.extractCodeFromResponse(response);
                
                if (extractedCode) {
                    // Insert the code below the comment
                    const nextLinePosition = new vscode.Position(position.line + 1, 0);
                    await activeEditor.edit(editBuilder => {
                        editBuilder.insert(nextLinePosition, `\n${extractedCode}\n`);
                    });
                } else {
                    await this.showResponseInNewDocument(response, 'Generated Code from Comment');
                }
            });

        } catch (error) {
            console.error('Error generating code from comment:', error);
            vscode.window.showErrorMessage(`Failed to generate code: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}