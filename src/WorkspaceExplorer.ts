// Workspace File Explorer for DeepSeek Extension
import * as vscode from 'vscode';
import * as path from 'path';

export interface FileInfo {
    name: string;
    path: string;
    type: 'file' | 'directory';
    extension?: string;
    size?: number;
    language?: string;
}

export class WorkspaceExplorer {
    
    /**
     * Get all files and folders in the workspace
     */
    static async getWorkspaceStructure(): Promise<FileInfo[]> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return [];
        }

        const files: FileInfo[] = [];
        
        for (const folder of workspaceFolders) {
            const folderFiles = await this.scanDirectory(folder.uri, folder.uri);
            files.push(...folderFiles);
        }

        return files.sort((a, b) => {
            // Directories first, then files
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Recursively scan a directory
     */
    private static async scanDirectory(dirUri: vscode.Uri, rootUri: vscode.Uri): Promise<FileInfo[]> {
        const files: FileInfo[] = [];
        
        try {
            const entries = await vscode.workspace.fs.readDirectory(dirUri);
            
            for (const [name, type] of entries) {
                // Skip hidden files and common ignore patterns
                if (this.shouldSkipFile(name)) {
                    continue;
                }

                const fileUri = vscode.Uri.joinPath(dirUri, name);
                const relativePath = path.relative(rootUri.fsPath, fileUri.fsPath);
                
                if (type === vscode.FileType.Directory) {
                    files.push({
                        name,
                        path: relativePath,
                        type: 'directory'
                    });
                    
                    // Recursively scan subdirectories (limit depth to avoid huge structures)
                    const depth = relativePath.split(path.sep).length;
                    if (depth <= 3) {
                        const subFiles = await this.scanDirectory(fileUri, rootUri);
                        files.push(...subFiles);
                    }
                } else if (type === vscode.FileType.File) {
                    const stat = await vscode.workspace.fs.stat(fileUri);
                    const extension = path.extname(name);
                    
                    files.push({
                        name,
                        path: relativePath,
                        type: 'file',
                        extension: extension || undefined,
                        size: stat.size,
                        language: this.getLanguageFromExtension(extension)
                    });
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${dirUri.fsPath}:`, error);
        }

        return files;
    }

    /**
     * Check if a file/folder should be skipped
     */
    private static shouldSkipFile(name: string): boolean {
        const skipPatterns = [
            '.git',
            '.vscode',
            'node_modules',
            '.npm',
            'dist',
            'build',
            'out',
            '.next',
            '.cache',
            'coverage',
            '.nyc_output',
            'logs',
            '*.log',
            '.DS_Store',
            'Thumbs.db'
        ];

        return skipPatterns.some(pattern => {
            if (pattern.includes('*')) {
                return new RegExp(pattern.replace('*', '.*')).test(name);
            }
            return name === pattern || name.startsWith(pattern);
        });
    }

    /**
     * Get programming language from file extension
     */
    private static getLanguageFromExtension(extension: string): string | undefined {
        const languageMap: { [key: string]: string } = {
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.jsx': 'React/JSX',
            '.tsx': 'React/TSX',
            '.py': 'Python',
            '.java': 'Java',
            '.c': 'C',
            '.cpp': 'C++',
            '.cs': 'C#',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.go': 'Go',
            '.rs': 'Rust',
            '.swift': 'Swift',
            '.kt': 'Kotlin',
            '.html': 'HTML',
            '.css': 'CSS',
            '.scss': 'SCSS',
            '.sass': 'Sass',
            '.less': 'Less',
            '.json': 'JSON',
            '.xml': 'XML',
            '.yaml': 'YAML',
            '.yml': 'YAML',
            '.md': 'Markdown',
            '.sql': 'SQL',
            '.sh': 'Shell',
            '.ps1': 'PowerShell',
            '.dockerfile': 'Docker',
            '.gitignore': 'Git',
            '.env': 'Environment'
        };

        return languageMap[extension.toLowerCase()];
    }

    /**
     * Get file content if it's a text file
     */
    static async getFileContent(relativePath: string): Promise<string | null> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return null;
        }

        try {
            const fileUri = vscode.Uri.joinPath(workspaceFolders[0].uri, relativePath);
            const content = await vscode.workspace.fs.readFile(fileUri);
            return new TextDecoder().decode(content);
        } catch (error) {
            console.error(`Error reading file ${relativePath}:`, error);
            return null;
        }
    }

    /**
     * Find files by name or extension
     */
    static async findFiles(query: string): Promise<FileInfo[]> {
        const allFiles = await this.getWorkspaceStructure();
        const queryLower = query.toLowerCase();

        return allFiles.filter(file => 
            file.name.toLowerCase().includes(queryLower) ||
            file.extension?.toLowerCase().includes(queryLower) ||
            file.language?.toLowerCase().includes(queryLower)
        );
    }

    /**
     * Get a formatted summary of workspace structure
     */
    static async getWorkspaceSummary(): Promise<string> {
        const files = await this.getWorkspaceStructure();
        
        if (files.length === 0) {
            return "No workspace is currently open.";
        }

        const directories = files.filter(f => f.type === 'directory');
        const filesByType: { [key: string]: number } = {};
        
        files.filter(f => f.type === 'file').forEach(file => {
            const lang = file.language || 'Other';
            filesByType[lang] = (filesByType[lang] || 0) + 1;
        });

        let summary = `📁 **Workspace Structure:**\n`;
        summary += `- ${directories.length} directories\n`;
        summary += `- ${files.filter(f => f.type === 'file').length} files\n\n`;
        
        summary += `📄 **File Types:**\n`;
        Object.entries(filesByType)
            .sort(([,a], [,b]) => b - a)
            .forEach(([lang, count]) => {
                summary += `- ${lang}: ${count} files\n`;
            });

        summary += `\n🔍 **Key Files:**\n`;
        const importantFiles = files.filter(f => 
            f.type === 'file' && (
                f.name === 'package.json' ||
                f.name === 'README.md' ||
                f.name === 'tsconfig.json' ||
                f.name === 'webpack.config.js' ||
                f.extension === '.ts' ||
                f.extension === '.js'
            )
        ).slice(0, 10);

        importantFiles.forEach(file => {
            summary += `- ${file.name} (${file.language || 'Unknown'})\n`;
        });

        return summary;
    }
}