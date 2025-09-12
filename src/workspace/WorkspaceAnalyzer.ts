import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface FileInfo {
    path: string;
    name: string;
    size: number;
    extension: string;
    language: string;
    lineCount: number;
}

export interface ProjectStructure {
    totalFiles: number;
    totalLines: number;
    languages: { [key: string]: number };
    fileTypes: { [key: string]: number };
    largestFiles: FileInfo[];
    dependencies: string[];
    projectType: string;
}

export class WorkspaceAnalyzer {
    private readonly maxFilesToAnalyze = 1000;
    private readonly supportedExtensions = new Set([
        '.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cs', '.cpp', '.c', '.h',
        '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.scala', '.clj', '.hs',
        '.ml', '.fs', '.vb', '.pas', '.ada', '.cob', '.for', '.lua', '.r',
        '.pl', '.sh', '.ps1', '.bat', '.sql', '.html', '.css', '.scss', '.less',
        '.xml', '.json', '.yaml', '.yml', '.toml', '.ini', '.conf', '.md',
        '.txt', '.log'
    ]);

    async analyzeWorkspace(): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showWarningMessage('No workspace folder open to analyze.');
            return;
        }

        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Analyzing workspace...',
                cancellable: true
            }, async (progress, token) => {
                const structure = await this.analyzeProjectStructure(workspaceFolders[0], progress, token);
                
                if (token.isCancellationRequested) {
                    return;
                }

                await this.showAnalysisResults(structure);
            });
        } catch (error) {
            console.error('Error analyzing workspace:', error);
            vscode.window.showErrorMessage(`Failed to analyze workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async analyzeProjectStructure(
        workspaceFolder: vscode.WorkspaceFolder,
        progress: vscode.Progress<{ message?: string; increment?: number }>,
        token: vscode.CancellationToken
    ): Promise<ProjectStructure> {
        const structure: ProjectStructure = {
            totalFiles: 0,
            totalLines: 0,
            languages: {},
            fileTypes: {},
            largestFiles: [],
            dependencies: [],
            projectType: 'Unknown'
        };

        progress.report({ message: 'Scanning files...', increment: 10 });

        const files = await this.getAllFiles(workspaceFolder.uri.fsPath);
        structure.totalFiles = files.length;

        progress.report({ message: 'Analyzing file contents...', increment: 20 });

        // Analyze project type
        structure.projectType = this.detectProjectType(workspaceFolder.uri.fsPath, files);
        
        // Extract dependencies
        structure.dependencies = await this.extractDependencies(workspaceFolder.uri.fsPath);

        let processedFiles = 0;
        const fileInfos: FileInfo[] = [];

        for (const filePath of files) {
            if (token.isCancellationRequested) {
                break;
            }

            if (processedFiles >= this.maxFilesToAnalyze) {
                break;
            }

            try {
                const fileInfo = await this.analyzeFile(filePath);
                if (fileInfo) {
                    fileInfos.push(fileInfo);
                    structure.totalLines += fileInfo.lineCount;
                    
                    // Count languages
                    if (fileInfo.language) {
                        structure.languages[fileInfo.language] = (structure.languages[fileInfo.language] || 0) + 1;
                    }
                    
                    // Count file types
                    structure.fileTypes[fileInfo.extension] = (structure.fileTypes[fileInfo.extension] || 0) + 1;
                }
                
                processedFiles++;
                if (processedFiles % 50 === 0) {
                    progress.report({ 
                        message: `Analyzed ${processedFiles}/${Math.min(files.length, this.maxFilesToAnalyze)} files...`,
                        increment: (processedFiles / Math.min(files.length, this.maxFilesToAnalyze)) * 60
                    });
                }
            } catch (error) {
                console.warn(`Failed to analyze file ${filePath}:`, error);
            }
        }

        // Get largest files
        structure.largestFiles = fileInfos
            .sort((a, b) => b.lineCount - a.lineCount)
            .slice(0, 10);

        progress.report({ message: 'Analysis complete!', increment: 100 });

        return structure;
    }

    private async getAllFiles(dirPath: string): Promise<string[]> {
        const files: string[] = [];
        const excludePatterns = [
            'node_modules', '.git', '.vscode', 'dist', 'build', 'out',
            '.next', '.nuxt', 'coverage', '.nyc_output', 'target',
            'bin', 'obj', 'Debug', 'Release'
        ];

        const scanDirectory = async (currentPath: string): Promise<void> => {
            try {
                const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(currentPath, entry.name);

                    if (entry.isDirectory()) {
                        if (!excludePatterns.some(pattern => entry.name.includes(pattern))) {
                            await scanDirectory(fullPath);
                        }
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name).toLowerCase();
                        if (this.supportedExtensions.has(ext)) {
                            files.push(fullPath);
                        }
                    }
                }
            } catch (error) {
                // Ignore errors for inaccessible directories
                console.warn(`Cannot access directory ${currentPath}:`, error);
            }
        };

        await scanDirectory(dirPath);
        return files;
    }

    private async analyzeFile(filePath: string): Promise<FileInfo | null> {
        try {
            const stats = await fs.promises.stat(filePath);
            const content = await fs.promises.readFile(filePath, 'utf8');
            const ext = path.extname(filePath).toLowerCase();
            
            return {
                path: filePath,
                name: path.basename(filePath),
                size: stats.size,
                extension: ext,
                language: this.getLanguageFromExtension(ext),
                lineCount: content.split('\n').length
            };
        } catch (error) {
            return null;
        }
    }

    private getLanguageFromExtension(ext: string): string {
        const languageMap: { [key: string]: string } = {
            '.ts': 'TypeScript',
            '.tsx': 'TypeScript React',
            '.js': 'JavaScript',
            '.jsx': 'JavaScript React',
            '.py': 'Python',
            '.java': 'Java',
            '.cs': 'C#',
            '.cpp': 'C++',
            '.c': 'C',
            '.h': 'C/C++ Header',
            '.go': 'Go',
            '.rs': 'Rust',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.swift': 'Swift',
            '.kt': 'Kotlin',
            '.scala': 'Scala',
            '.clj': 'Clojure',
            '.hs': 'Haskell',
            '.ml': 'OCaml',
            '.fs': 'F#',
            '.vb': 'Visual Basic',
            '.pas': 'Pascal',
            '.ada': 'Ada',
            '.cob': 'COBOL',
            '.for': 'Fortran',
            '.lua': 'Lua',
            '.r': 'R',
            '.pl': 'Perl',
            '.sh': 'Shell',
            '.ps1': 'PowerShell',
            '.bat': 'Batch',
            '.sql': 'SQL',
            '.html': 'HTML',
            '.css': 'CSS',
            '.scss': 'SCSS',
            '.less': 'Less',
            '.xml': 'XML',
            '.json': 'JSON',
            '.yaml': 'YAML',
            '.yml': 'YAML',
            '.toml': 'TOML',
            '.ini': 'INI',
            '.conf': 'Config',
            '.md': 'Markdown',
            '.txt': 'Text',
            '.log': 'Log'
        };

        return languageMap[ext] || 'Unknown';
    }

    private detectProjectType(workspacePath: string, files: string[]): string {
        const fileNames = files.map(f => path.basename(f));
        
        // Check for specific project files
        if (fileNames.includes('package.json')) {
            const packageJsonPath = path.join(workspacePath, 'package.json');
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                if (packageJson.dependencies && packageJson.dependencies.react) {
                    return 'React Application';
                } else if (packageJson.dependencies && packageJson.dependencies.vue) {
                    return 'Vue.js Application';
                } else if (packageJson.dependencies && packageJson.dependencies.angular) {
                    return 'Angular Application';
                } else if (packageJson.dependencies && packageJson.dependencies.express) {
                    return 'Node.js/Express Application';
                }
                return 'Node.js Project';
            } catch {
                return 'Node.js Project';
            }
        }
        
        if (fileNames.includes('pom.xml')) return 'Maven Java Project';
        if (fileNames.includes('build.gradle')) return 'Gradle Project';
        if (fileNames.includes('Cargo.toml')) return 'Rust Project';
        if (fileNames.includes('go.mod')) return 'Go Module';
        if (fileNames.includes('requirements.txt') || fileNames.includes('setup.py')) return 'Python Project';
        if (fileNames.includes('Gemfile')) return 'Ruby Project';
        if (fileNames.includes('composer.json')) return 'PHP Project';
        if (fileNames.some(f => f.endsWith('.csproj'))) return 'C# Project';
        if (fileNames.some(f => f.endsWith('.sln'))) return '.NET Solution';
        if (fileNames.includes('pubspec.yaml')) return 'Dart/Flutter Project';
        if (fileNames.includes('mix.exs')) return 'Elixir Project';
        
        return 'Mixed/Other';
    }

    private async extractDependencies(workspacePath: string): Promise<string[]> {
        const dependencies: string[] = [];
        
        try {
            // Node.js dependencies
            const packageJsonPath = path.join(workspacePath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                if (packageJson.dependencies) {
                    dependencies.push(...Object.keys(packageJson.dependencies));
                }
                if (packageJson.devDependencies) {
                    dependencies.push(...Object.keys(packageJson.devDependencies));
                }
            }
        } catch (error) {
            console.warn('Failed to extract Node.js dependencies:', error);
        }

        // Could add more dependency extractors for other project types here

        return dependencies.slice(0, 20); // Limit to top 20 dependencies
    }

    private async showAnalysisResults(structure: ProjectStructure): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'workspaceAnalysis',
            'Workspace Analysis',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );

        panel.webview.html = this.getAnalysisHtml(structure);
    }

    private getAnalysisHtml(structure: ProjectStructure): string {
        const languagesList = Object.entries(structure.languages)
            .sort(([,a], [,b]) => b - a)
            .map(([lang, count]) => `<li>${lang}: ${count} files</li>`)
            .join('');

        const fileTypesList = Object.entries(structure.fileTypes)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([ext, count]) => `<li>${ext}: ${count} files</li>`)
            .join('');

        const largestFilesList = structure.largestFiles
            .map(file => `<li><strong>${file.name}</strong> (${file.lineCount} lines) - ${path.dirname(file.path.replace(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', ''))}</li>`)
            .join('');

        const dependenciesList = structure.dependencies
            .slice(0, 15)
            .map(dep => `<li>${dep}</li>`)
            .join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workspace Analysis</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 20px;
            line-height: 1.6;
        }
        
        .section {
            margin-bottom: 30px;
            padding: 15px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 5px;
            background-color: var(--vscode-panel-background);
        }
        
        h1 { color: var(--vscode-foreground); margin-top: 0; }
        h2 { color: var(--vscode-descriptionForeground); border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 5px; }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 15px 0;
        }
        
        .stat-box {
            padding: 10px;
            background-color: var(--vscode-button-secondaryBackground);
            border-radius: 3px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: var(--vscode-button-foreground);
        }
        
        .stat-label {
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
        }
        
        ul {
            list-style-type: none;
            padding-left: 0;
        }
        
        li {
            margin: 5px 0;
            padding: 5px 10px;
            background-color: var(--vscode-editor-selectionBackground);
            border-radius: 3px;
        }
        
        .project-type {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 5px 10px;
            border-radius: 10px;
            display: inline-block;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <h1>📊 Workspace Analysis Results</h1>
    
    <div class="section">
        <h2>📈 Overview</h2>
        <div class="project-type">Project Type: ${structure.projectType}</div>
        
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-number">${structure.totalFiles}</div>
                <div class="stat-label">Total Files</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${structure.totalLines.toLocaleString()}</div>
                <div class="stat-label">Total Lines</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${Object.keys(structure.languages).length}</div>
                <div class="stat-label">Languages</div>
            </div>
            <div class="stat-box">
                <div class="stat-number">${structure.dependencies.length}</div>
                <div class="stat-label">Dependencies</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>💻 Languages</h2>
        <ul>${languagesList}</ul>
    </div>

    <div class="section">
        <h2>📄 File Types</h2>
        <ul>${fileTypesList}</ul>
    </div>

    <div class="section">
        <h2>📏 Largest Files</h2>
        <ul>${largestFilesList}</ul>
    </div>

    ${structure.dependencies.length > 0 ? `
    <div class="section">
        <h2>📦 Dependencies</h2>
        <ul>${dependenciesList}</ul>
        ${structure.dependencies.length > 15 ? `<p><em>...and ${structure.dependencies.length - 15} more</em></p>` : ''}
    </div>
    ` : ''}

</body>
</html>`;
    }
}