import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

interface WorkspaceItem {
    label: string;
    description?: string;
    iconPath?: vscode.ThemeIcon;
    children?: WorkspaceItem[];
    command?: vscode.Command;
    contextValue?: string;
}

export class WorkspaceAnalyzer implements vscode.TreeDataProvider<WorkspaceItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<WorkspaceItem | undefined | null | void> = new vscode.EventEmitter<WorkspaceItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<WorkspaceItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private workspaceAnalysis: any = null;

    constructor() {
        // Auto-analyze workspace when extension loads
        this.analyzeWorkspace();
    }

    getTreeItem(element: WorkspaceItem): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(element.label, element.children ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
        treeItem.description = element.description;
        treeItem.iconPath = element.iconPath;
        treeItem.command = element.command;
        treeItem.contextValue = element.contextValue;
        return treeItem;
    }

    getChildren(element?: WorkspaceItem): Thenable<WorkspaceItem[]> {
        if (!element) {
            return Promise.resolve(this.getRootItems());
        }
        return Promise.resolve(element.children || []);
    }

    private getRootItems(): WorkspaceItem[] {
        const items: WorkspaceItem[] = [];

        if (!this.workspaceAnalysis) {
            items.push({
                label: "🔍 Analyzing workspace...",
                description: "Please wait",
                iconPath: new vscode.ThemeIcon('loading~spin')
            });
            return items;
        }

        // Project Overview
        items.push({
            label: "📊 Project Overview",
            iconPath: new vscode.ThemeIcon('project'),
            children: [
                {
                    label: `Files: ${this.workspaceAnalysis.fileCount}`,
                    iconPath: new vscode.ThemeIcon('files')
                },
                {
                    label: `Languages: ${this.workspaceAnalysis.languages.join(', ')}`,
                    iconPath: new vscode.ThemeIcon('code')
                },
                {
                    label: `Total Lines: ${this.workspaceAnalysis.totalLines}`,
                    iconPath: new vscode.ThemeIcon('symbol-number')
                }
            ]
        });

        // Code Quality
        if (this.workspaceAnalysis.codeQuality) {
            items.push({
                label: "✅ Code Quality",
                iconPath: new vscode.ThemeIcon('verified'),
                children: this.workspaceAnalysis.codeQuality.map((item: any) => ({
                    label: item.type,
                    description: item.description,
                    iconPath: new vscode.ThemeIcon(item.severity === 'high' ? 'error' : item.severity === 'medium' ? 'warning' : 'info'),
                    command: item.file ? {
                        command: 'vscode.open',
                        title: 'Open File',
                        arguments: [vscode.Uri.file(item.file)]
                    } : undefined
                }))
            });
        }

        // Suggestions
        if (this.workspaceAnalysis.suggestions) {
            items.push({
                label: "💡 AI Suggestions",
                iconPath: new vscode.ThemeIcon('lightbulb'),
                children: this.workspaceAnalysis.suggestions.map((suggestion: any) => ({
                    label: suggestion.title,
                    description: suggestion.description,
                    iconPath: new vscode.ThemeIcon('gear'),
                    command: {
                        command: 'deepseek.applySuggestion',
                        title: 'Apply Suggestion',
                        arguments: [suggestion]
                    }
                }))
            });
        }

        // Dependencies
        if (this.workspaceAnalysis.dependencies) {
            items.push({
                label: "📦 Dependencies",
                iconPath: new vscode.ThemeIcon('package'),
                children: Object.keys(this.workspaceAnalysis.dependencies).map(dep => ({
                    label: dep,
                    description: this.workspaceAnalysis.dependencies[dep],
                    iconPath: new vscode.ThemeIcon('symbol-package')
                }))
            });
        }

        // Quick Actions
        items.push({
            label: "⚡ Quick Actions",
            iconPath: new vscode.ThemeIcon('zap'),
            children: [
                {
                    label: "Re-analyze Workspace",
                    iconPath: new vscode.ThemeIcon('refresh'),
                    command: {
                        command: 'deepseek.analyzeWorkspace',
                        title: 'Re-analyze Workspace'
                    }
                },
                {
                    label: "Generate Project Documentation",
                    iconPath: new vscode.ThemeIcon('book'),
                    command: {
                        command: 'deepseek.generateDocs',
                        title: 'Generate Documentation'
                    }
                },
                {
                    label: "Find Code Smells",
                    iconPath: new vscode.ThemeIcon('search'),
                    command: {
                        command: 'deepseek.findCodeSmells',
                        title: 'Find Code Smells'
                    }
                }
            ]
        });

        return items;
    }

    public async analyzeWorkspace() {
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showWarningMessage('No workspace folder open.');
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Analyzing workspace with DeepSeek...",
            cancellable: false
        }, async (progress) => {
            try {
                progress.report({ increment: 20, message: "Scanning files..." });
                const workspaceInfo = await this._scanWorkspace();
                
                progress.report({ increment: 40, message: "Analyzing code quality..." });
                const analysis = await this._analyzeWithDeepSeek(workspaceInfo);
                
                progress.report({ increment: 40, message: "Generating insights..." });
                this.workspaceAnalysis = analysis;
                this._onDidChangeTreeData.fire();
                
                vscode.window.showInformationMessage('Workspace analysis completed!');

            } catch (error) {
                console.error('Error analyzing workspace:', error);
                vscode.window.showErrorMessage('Failed to analyze workspace. Please check your API key and try again.');
            }
        });
    }

    private async _scanWorkspace(): Promise<any> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder open');
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const fileInfo = {
            fileCount: 0,
            totalLines: 0,
            languages: new Set<string>(),
            files: [] as string[],
            dependencies: {} as Record<string, string>
        };

        const excludePatterns = [
            'node_modules', '.git', 'dist', 'build', 'out', '.vscode', 
            'coverage', '.nyc_output', 'tmp', 'temp'
        ];

        const scanDirectory = async (dirPath: string) => {
            const items = await fs.promises.readdir(dirPath);
            
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stat = await fs.promises.stat(itemPath);
                
                if (stat.isDirectory()) {
                    if (!excludePatterns.some(pattern => item.includes(pattern))) {
                        await scanDirectory(itemPath);
                    }
                } else if (stat.isFile()) {
                    const ext = path.extname(item);
                    const codeExtensions = ['.js', '.ts', '.py', '.java', '.cs', '.cpp', '.c', '.php', '.rb', '.go', '.rs', '.swift', '.kt'];
                    
                    if (codeExtensions.includes(ext)) {
                        fileInfo.fileCount++;
                        fileInfo.files.push(itemPath);
                        
                        // Determine language
                        const langMap: Record<string, string> = {
                            '.js': 'JavaScript', '.ts': 'TypeScript', '.py': 'Python',
                            '.java': 'Java', '.cs': 'C#', '.cpp': 'C++', '.c': 'C',
                            '.php': 'PHP', '.rb': 'Ruby', '.go': 'Go', '.rs': 'Rust',
                            '.swift': 'Swift', '.kt': 'Kotlin'
                        };
                        
                        if (langMap[ext]) {
                            fileInfo.languages.add(langMap[ext]);
                        }
                        
                        // Count lines
                        try {
                            const content = await fs.promises.readFile(itemPath, 'utf8');
                            fileInfo.totalLines += content.split('\n').length;
                        } catch (error) {
                            // Skip files that can't be read
                        }
                    }
                    
                    // Check for dependency files
                    if (item === 'package.json') {
                        try {
                            const content = await fs.promises.readFile(itemPath, 'utf8');
                            const packageInfo = JSON.parse(content);
                            if (packageInfo.dependencies) {
                                Object.assign(fileInfo.dependencies, packageInfo.dependencies);
                            }
                        } catch (error) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        };

        await scanDirectory(rootPath);
        
        return {
            ...fileInfo,
            languages: Array.from(fileInfo.languages),
            rootPath
        };
    }

    private async _analyzeWithDeepSeek(workspaceInfo: any): Promise<any> {
        const config = vscode.workspace.getConfiguration('deepseek');
        const apiKey = config.get<string>('apiKey');
        const model = config.get<string>('model', 'deepseek-coder');

        if (!apiKey) {
            throw new Error('API key not configured');
        }

        // Sample a few files for analysis
        const sampleFiles = workspaceInfo.files.slice(0, 3);
        let sampleCode = '';
        
        for (const filePath of sampleFiles) {
            try {
                const content = await fs.promises.readFile(filePath, 'utf8');
                const relativePath = path.relative(workspaceInfo.rootPath, filePath);
                sampleCode += `\n\n// File: ${relativePath}\n${content.slice(0, 1000)}`;
            } catch (error) {
                // Skip files that can't be read
            }
        }

        const prompt = `Analyze this software project and provide insights:

Project Overview:
- ${workspaceInfo.fileCount} files
- Languages: ${workspaceInfo.languages.join(', ')}
- ${workspaceInfo.totalLines} total lines of code
- Dependencies: ${Object.keys(workspaceInfo.dependencies).join(', ')}

Sample Code:${sampleCode}

Please provide a JSON response with the following structure:
{
  "codeQuality": [
    {"type": "Issue Type", "description": "Description", "severity": "high|medium|low", "file": "optional file path"}
  ],
  "suggestions": [
    {"title": "Suggestion Title", "description": "Detailed description", "type": "improvement|refactor|optimization"}
  ],
  "architecture": {
    "pattern": "Detected pattern",
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"]
  },
  "recommendations": [
    "General recommendation 1",
    "General recommendation 2"
  ]
}`;

        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'You are DeepSeek Code Companion, an expert software architect and code analyst. Analyze the provided project information and code samples to give insightful feedback about code quality, architecture, and potential improvements. Always respond with valid JSON.'
                },
                {
                    role: 'user',
                    content: prompt
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

        let analysisResult;
        try {
            // Try to parse the JSON response
            const content = response.data.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysisResult = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (error) {
            // Fallback if JSON parsing fails
            console.error('Failed to parse analysis JSON:', error);
            analysisResult = {
                codeQuality: [
                    { type: "Analysis Complete", description: "Basic workspace scan completed", severity: "low" }
                ],
                suggestions: [
                    { title: "Manual Review", description: "Consider reviewing the code manually for improvements", type: "improvement" }
                ]
            };
        }

        return {
            ...workspaceInfo,
            ...analysisResult
        };
    }

    public refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}