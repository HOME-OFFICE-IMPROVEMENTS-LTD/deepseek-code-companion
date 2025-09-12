import * as vscode from 'vscode';
import axios from 'axios';

export class CodeGenerationProvider {
    
    public async generateCode() {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showWarningMessage('Please open a file to generate code.');
            return;
        }

        // Get user input for what to generate
        const prompt = await vscode.window.showInputBox({
            prompt: 'What would you like me to generate?',
            placeHolder: 'e.g., "a function to sort an array", "a REST API endpoint", "unit tests for this function"'
        });

        if (!prompt) {
            return;
        }

        // Show progress indicator
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating code with DeepSeek...",
            cancellable: false
        }, async (progress) => {
            try {
                const generatedCode = await this._generateCodeWithDeepSeek(prompt, activeEditor);
                
                // Insert the generated code at cursor position
                await activeEditor.edit(editBuilder => {
                    const position = activeEditor.selection.active;
                    editBuilder.insert(position, generatedCode);
                });

                vscode.window.showInformationMessage('Code generated successfully!');

            } catch (error) {
                console.error('Error generating code:', error);
                vscode.window.showErrorMessage('Failed to generate code. Please check your API key and try again.');
            }
        });
    }

    private async _generateCodeWithDeepSeek(prompt: string, editor: vscode.TextEditor): Promise<string> {
        const config = vscode.workspace.getConfiguration('deepseek');
        const apiKey = config.get<string>('apiKey');
        const model = config.get<string>('model', 'deepseek-coder');

        if (!apiKey) {
            throw new Error('API key not configured');
        }

        // Get context from the current file
        const document = editor.document;
        const language = document.languageId;
        const fileName = document.fileName;
        const cursorPosition = editor.selection.active;
        
        // Get surrounding context (previous 10 lines and next 5 lines)
        const startLine = Math.max(0, cursorPosition.line - 10);
        const endLine = Math.min(document.lineCount - 1, cursorPosition.line + 5);
        const contextRange = new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
        const contextCode = document.getText(contextRange);

        // Build the prompt with context
        const systemPrompt = `You are DeepSeek Code Companion, an expert coding assistant. Generate clean, efficient, and well-documented code based on the user's request. Always follow best practices for the given programming language.

Current context:
- Language: ${language}
- File: ${fileName}
- Current code context:
\`\`\`${language}
${contextCode}
\`\`\`

Generate only the requested code without explanations unless specifically asked. The code should fit naturally into the existing context.`;

        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 1500,
            temperature: 0.3 // Lower temperature for more consistent code generation
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        let generatedCode = response.data.choices[0].message.content;
        
        // Clean up the response - remove markdown code blocks if present
        generatedCode = generatedCode.replace(/```[\w]*\n?/g, '').replace(/```/g, '');
        
        // Add proper indentation based on cursor position
        const currentLine = document.lineAt(cursorPosition.line);
        const indentation = currentLine.text.substring(0, currentLine.firstNonWhitespaceCharacterIndex);
        
        // Apply indentation to each line of generated code
        const lines = generatedCode.split('\n');
        const indentedLines = lines.map((line: string, index: number) => {
            if (index === 0 && cursorPosition.character > 0) {
                // First line might be on the same line as existing code
                return line;
            }
            return line.trim() ? indentation + line : line;
        });

        return indentedLines.join('\n');
    }

    public async generateCodeFromComment() {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }

        const document = activeEditor.document;
        const selection = activeEditor.selection;
        
        // Look for comments that might describe what to implement
        const currentLine = document.lineAt(selection.active.line);
        const lineText = currentLine.text.trim();
        
        // Check if current line is a comment
        const language = document.languageId;
        const commentPatterns = {
            'javascript': /^\s*\/\/\s*(.+)$/,
            'typescript': /^\s*\/\/\s*(.+)$/,
            'python': /^\s*#\s*(.+)$/,
            'java': /^\s*\/\/\s*(.+)$/,
            'csharp': /^\s*\/\/\s*(.+)$/,
            'cpp': /^\s*\/\/\s*(.+)$/,
            'c': /^\s*\/\/\s*(.+)$/
        };

        const pattern = commentPatterns[language as keyof typeof commentPatterns];
        if (pattern) {
            const match = lineText.match(pattern);
            if (match) {
                const commentText = match[1];
                
                // Generate code based on the comment
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Implementing comment with DeepSeek...",
                    cancellable: false
                }, async () => {
                    try {
                        const generatedCode = await this._generateCodeWithDeepSeek(
                            `Implement this: ${commentText}`, 
                            activeEditor
                        );
                        
                        // Insert the generated code after the comment
                        await activeEditor.edit(editBuilder => {
                            const position = new vscode.Position(currentLine.lineNumber + 1, 0);
                            editBuilder.insert(position, '\n' + generatedCode + '\n');
                        });

                        vscode.window.showInformationMessage('Code implemented from comment!');

                    } catch (error) {
                        console.error('Error implementing comment:', error);
                        vscode.window.showErrorMessage('Failed to implement comment. Please check your API key and try again.');
                    }
                });
            }
        }
    }
}