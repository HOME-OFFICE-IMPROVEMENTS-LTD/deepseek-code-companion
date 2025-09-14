import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ModelManager } from '../ModelManager';
import { DocumentationConfig, GeneratedDocs } from '../types';

/**
 * AI-powered documentation generator for automatic API docs, README, and architecture documentation
 */
export class DocumentationGenerator {
    private modelManager: ModelManager;
    private workspaceRoot: string;

    constructor(modelManager: ModelManager) {
        this.modelManager = modelManager;
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    }

    /**
     * Generate comprehensive API documentation from source code
     */
    async generateAPIDocumentation(sourceFiles: string[], config: DocumentationConfig): Promise<GeneratedDocs> {
        const startTime = Date.now();
        
        try {
            const codeAnalysis = await this.analyzeSourceCode(sourceFiles);
            const apiStructure = await this.extractAPIStructure(codeAnalysis);
            const documentation = await this.generateAPIContent(apiStructure, config);

            const result: GeneratedDocs = {
                type: 'api',
                content: documentation,
                metadata: {
                    generatedAt: new Date(),
                    source: `${sourceFiles.length} source files`,
                    version: '1.0.0'
                }
            };

            console.log(`📚 API documentation generated in ${Date.now() - startTime}ms`);
            return result;

        } catch (error) {
            console.error('API documentation generation failed:', error);
            throw new Error(`Documentation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Generate project README from codebase analysis
     */
    async generateREADME(): Promise<GeneratedDocs> {
        try {
            const projectAnalysis = await this.analyzeProjectStructure();
            const packageInfo = await this.getPackageInfo();
            const readmeContent = await this.generateREADMEContent(projectAnalysis, packageInfo);

            return {
                type: 'readme',
                content: readmeContent,
                metadata: {
                    generatedAt: new Date(),
                    source: 'Project analysis',
                    version: packageInfo.version || '1.0.0'
                }
            };

        } catch (error) {
            console.error('README generation failed:', error);
            throw new Error(`README generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Generate architecture documentation from codebase
     */
    async generateArchitectureDocs(): Promise<GeneratedDocs> {
        try {
            const architectureAnalysis = await this.analyzeArchitecture();
            const dependencies = await this.analyzeDependencies();
            const archContent = await this.generateArchitectureContent(architectureAnalysis, dependencies);

            return {
                type: 'architecture',
                content: archContent,
                metadata: {
                    generatedAt: new Date(),
                    source: 'Architecture analysis',
                    version: '1.0.0'
                }
            };

        } catch (error) {
            console.error('Architecture documentation generation failed:', error);
            throw new Error(`Architecture documentation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Generate changelog from git history and commits
     */
    async generateChangelog(): Promise<GeneratedDocs> {
        try {
            const gitHistory = await this.getGitHistory();
            const changelogContent = await this.generateChangelogContent(gitHistory);

            return {
                type: 'changelog',
                content: changelogContent,
                metadata: {
                    generatedAt: new Date(),
                    source: 'Git history',
                    version: '1.0.0'
                }
            };

        } catch (error) {
            console.error('Changelog generation failed:', error);
            throw new Error(`Changelog generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Analyze source code to extract structure and patterns
     */
    private async analyzeSourceCode(sourceFiles: string[]): Promise<any> {
        const analysis: any = {
            classes: [],
            functions: [],
            interfaces: [],
            exports: [],
            imports: []
        };

        for (const filePath of sourceFiles) {
            try {
                const content = await fs.promises.readFile(filePath, 'utf-8');
                const fileAnalysis = await this.analyzeFile(content, filePath);
                
                analysis.classes.push(...fileAnalysis.classes);
                analysis.functions.push(...fileAnalysis.functions);
                analysis.interfaces.push(...fileAnalysis.interfaces);
                analysis.exports.push(...fileAnalysis.exports);
                analysis.imports.push(...fileAnalysis.imports);

            } catch (error) {
                console.warn(`Failed to analyze ${filePath}:`, error);
            }
        }

        return analysis;
    }

    /**
     * Analyze individual file for code structures
     */
    private async analyzeFile(content: string, filePath: string): Promise<any> {
        const prompt = `
Analyze this TypeScript/JavaScript file and extract:

1. Classes with their methods and properties
2. Functions with parameters and return types
3. Interfaces and type definitions
4. Exported members
5. Dependencies and imports

File: ${path.basename(filePath)}
\`\`\`typescript
${content.substring(0, 3000)} // Limit for token efficiency
\`\`\`

Return JSON with structure:
{
  "classes": [{"name": "string", "methods": ["string"], "properties": ["string"], "description": "string"}],
  "functions": [{"name": "string", "parameters": ["string"], "returnType": "string", "description": "string"}],
  "interfaces": [{"name": "string", "properties": ["string"], "description": "string"}],
  "exports": ["string"],
  "imports": ["string"]
}
`;

        try {
            const response = await this.modelManager.sendMessage([
                { role: 'user', content: prompt }
            ], 'claude-3-sonnet');

            return this.parseCodeAnalysis(response.content);

        } catch (error) {
            console.warn(`AI analysis failed for ${filePath}, using basic parsing`);
            return this.basicFileAnalysis(content);
        }
    }

    /**
     * Parse AI code analysis response
     */
    private parseCodeAnalysis(response: string): any {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.warn('Failed to parse AI analysis:', error);
        }

        return {
            classes: [],
            functions: [],
            interfaces: [],
            exports: [],
            imports: []
        };
    }

    /**
     * Basic file analysis fallback
     */
    private basicFileAnalysis(content: string): any {
        const lines = content.split('\n');
        const analysis = {
            classes: [] as any[],
            functions: [] as any[],
            interfaces: [] as any[],
            exports: [] as string[],
            imports: [] as string[]
        };

        lines.forEach(line => {
            // Extract class names
            const classMatch = line.match(/class\s+(\w+)/);
            if (classMatch) {
                analysis.classes.push({
                    name: classMatch[1],
                    methods: [],
                    properties: [],
                    description: `Class ${classMatch[1]}`
                });
            }

            // Extract function names
            const functionMatch = line.match(/function\s+(\w+)|(\w+)\s*\(/);
            if (functionMatch) {
                analysis.functions.push({
                    name: functionMatch[1] || functionMatch[2],
                    parameters: [],
                    returnType: 'unknown',
                    description: `Function ${functionMatch[1] || functionMatch[2]}`
                });
            }

            // Extract exports
            const exportMatch = line.match(/export\s+.*\s+(\w+)/);
            if (exportMatch) {
                analysis.exports.push(exportMatch[1]);
            }

            // Extract imports
            const importMatch = line.match(/import.*from\s+['"]([^'"]+)['"]/);
            if (importMatch) {
                analysis.imports.push(importMatch[1]);
            }
        });

        return analysis;
    }

    /**
     * Extract API structure from code analysis
     */
    private async extractAPIStructure(codeAnalysis: any): Promise<any> {
        const prompt = `
Based on this code analysis, create an API structure documentation:

Classes: ${JSON.stringify(codeAnalysis.classes.slice(0, 10))}
Functions: ${JSON.stringify(codeAnalysis.functions.slice(0, 10))}
Interfaces: ${JSON.stringify(codeAnalysis.interfaces.slice(0, 10))}

Create a structured API documentation outline with:
1. Main modules/sections
2. Public API endpoints
3. Core classes and their purposes
4. Key interfaces and types
5. Usage examples

Return JSON structure for documentation.
`;

        try {
            const response = await this.modelManager.sendMessage([
                { role: 'user', content: prompt }
            ], 'gpt-4o');

            return this.parseAPIStructure(response.content);

        } catch (error) {
            console.warn('AI API structure extraction failed:', error);
            return this.createBasicAPIStructure(codeAnalysis);
        }
    }

    /**
     * Parse API structure from AI response
     */
    private parseAPIStructure(response: string): any {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.warn('Failed to parse API structure:', error);
        }

        return { modules: [], endpoints: [], classes: [] };
    }

    /**
     * Create basic API structure fallback
     */
    private createBasicAPIStructure(codeAnalysis: any): any {
        return {
            modules: ['Core', 'Utils', 'Types'],
            endpoints: codeAnalysis.functions.map((f: any) => ({
                name: f.name,
                description: f.description
            })),
            classes: codeAnalysis.classes.map((c: any) => ({
                name: c.name,
                description: c.description,
                methods: c.methods
            }))
        };
    }

    /**
     * Generate API documentation content
     */
    private async generateAPIContent(apiStructure: any, config: DocumentationConfig): Promise<string> {
        const prompt = `
Generate comprehensive API documentation in ${config.format} format:

API Structure: ${JSON.stringify(apiStructure)}

Requirements:
- ${config.includeExamples ? 'Include code examples' : 'No code examples'}
- ${config.includeTypes ? 'Include type definitions' : 'No type definitions'}
- ${config.includeTests ? 'Include test examples' : 'No test examples'}

Create professional, clear documentation with:
1. Overview and getting started
2. API reference with all endpoints/methods
3. Examples and usage patterns
4. Error handling information
5. Best practices

Format: ${config.format}
`;

        try {
            const response = await this.modelManager.sendMessage([
                { role: 'user', content: prompt }
            ], 'claude-3-sonnet');

            return response.content;

        } catch (error) {
            console.warn('AI documentation generation failed:', error);
            return this.generateBasicAPIDoc(apiStructure, config);
        }
    }

    /**
     * Generate basic API documentation fallback
     */
    private generateBasicAPIDoc(apiStructure: any, config: DocumentationConfig): string {
        let doc = '# API Documentation\n\n';
        
        if (apiStructure.classes && apiStructure.classes.length > 0) {
            doc += '## Classes\n\n';
            apiStructure.classes.forEach((cls: any) => {
                doc += `### ${cls.name}\n`;
                doc += `${cls.description}\n\n`;
                if (cls.methods && cls.methods.length > 0) {
                    doc += '#### Methods:\n';
                    cls.methods.forEach((method: string) => {
                        doc += `- ${method}\n`;
                    });
                    doc += '\n';
                }
            });
        }

        if (apiStructure.endpoints && apiStructure.endpoints.length > 0) {
            doc += '## Functions\n\n';
            apiStructure.endpoints.forEach((endpoint: any) => {
                doc += `### ${endpoint.name}\n`;
                doc += `${endpoint.description}\n\n`;
            });
        }

        return doc;
    }

    /**
     * Analyze project structure
     */
    private async analyzeProjectStructure(): Promise<any> {
        const packageJson = await this.getPackageInfo();
        const fileStructure = await this.getFileStructure();
        
        return {
            name: packageJson.name || 'Unknown Project',
            description: packageJson.description || '',
            dependencies: Object.keys(packageJson.dependencies || {}),
            devDependencies: Object.keys(packageJson.devDependencies || {}),
            scripts: packageJson.scripts || {},
            fileStructure
        };
    }

    /**
     * Get package.json information
     */
    private async getPackageInfo(): Promise<any> {
        try {
            const packagePath = path.join(this.workspaceRoot, 'package.json');
            const content = await fs.promises.readFile(packagePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.warn('Failed to read package.json:', error);
            return {};
        }
    }

    /**
     * Get file structure
     */
    private async getFileStructure(): Promise<string[]> {
        try {
            const files = await vscode.workspace.findFiles('**/*.{ts,js,json,md}', '**/node_modules/**');
            return files.map(file => 
                path.relative(this.workspaceRoot, file.fsPath)
            ).slice(0, 50); // Limit for token efficiency
        } catch (error) {
            console.warn('Failed to get file structure:', error);
            return [];
        }
    }

    /**
     * Generate README content
     */
    private async generateREADMEContent(projectAnalysis: any, packageInfo: any): Promise<string> {
        const prompt = `
Generate a comprehensive README.md for this project:

Project Name: ${projectAnalysis.name}
Description: ${projectAnalysis.description}
Dependencies: ${projectAnalysis.dependencies.join(', ')}
Scripts: ${Object.keys(projectAnalysis.scripts).join(', ')}
File Structure: ${projectAnalysis.fileStructure.slice(0, 20).join(', ')}

Create a professional README with:
1. Project title and description
2. Features and capabilities
3. Installation instructions
4. Usage examples
5. API documentation links
6. Contributing guidelines
7. License information
8. Contact/support information

Make it engaging and informative for developers.
`;

        try {
            const response = await this.modelManager.sendMessage([
                { role: 'user', content: prompt }
            ], 'claude-3-sonnet');

            return response.content;

        } catch (error) {
            console.warn('AI README generation failed:', error);
            return this.generateBasicREADME(projectAnalysis);
        }
    }

    /**
     * Generate basic README fallback
     */
    private generateBasicREADME(projectAnalysis: any): string {
        return `# ${projectAnalysis.name}

${projectAnalysis.description}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Dependencies

${projectAnalysis.dependencies.map((dep: string) => `- ${dep}`).join('\n')}

## License

MIT
`;
    }

    /**
     * Analyze architecture
     */
    private async analyzeArchitecture(): Promise<any> {
        // This would analyze the overall architecture patterns, modules, and relationships
        return {
            patterns: ['MVC', 'Singleton', 'Observer'],
            modules: ['Core', 'UI', 'API', 'Utils'],
            layers: ['Presentation', 'Business Logic', 'Data Access']
        };
    }

    /**
     * Analyze dependencies
     */
    private async analyzeDependencies(): Promise<any> {
        const packageInfo = await this.getPackageInfo();
        return {
            production: packageInfo.dependencies || {},
            development: packageInfo.devDependencies || {},
            peer: packageInfo.peerDependencies || {}
        };
    }

    /**
     * Generate architecture content
     */
    private async generateArchitectureContent(architectureAnalysis: any, dependencies: any): Promise<string> {
        const prompt = `
Generate architecture documentation for this project:

Architecture Patterns: ${architectureAnalysis.patterns.join(', ')}
Modules: ${architectureAnalysis.modules.join(', ')}
Layers: ${architectureAnalysis.layers.join(', ')}
Dependencies: ${Object.keys(dependencies.production).join(', ')}

Create comprehensive architecture documentation with:
1. System overview and design principles
2. Architecture patterns used
3. Module structure and responsibilities
4. Data flow and interactions
5. Deployment architecture
6. Security considerations
7. Performance considerations
8. Scalability aspects

Use professional technical writing style.
`;

        try {
            const response = await this.modelManager.sendMessage([
                { role: 'user', content: prompt }
            ], 'gpt-4o');

            return response.content;

        } catch (error) {
            console.warn('AI architecture documentation failed:', error);
            return this.generateBasicArchitectureDoc(architectureAnalysis);
        }
    }

    /**
     * Generate basic architecture documentation
     */
    private generateBasicArchitectureDoc(architectureAnalysis: any): string {
        return `# Architecture Documentation

## Overview

This project follows a modular architecture with the following patterns:

${architectureAnalysis.patterns.map((pattern: string) => `- ${pattern}`).join('\n')}

## Modules

${architectureAnalysis.modules.map((module: string) => `### ${module}\nCore functionality for ${module.toLowerCase()}\n`).join('\n')}

## Layers

${architectureAnalysis.layers.map((layer: string) => `- ${layer}`).join('\n')}
`;
    }

    /**
     * Get git history for changelog
     */
    private async getGitHistory(): Promise<any[]> {
        // This would use git commands to get commit history
        // For now, return mock data
        return [
            { hash: 'abc123', date: '2023-09-13', message: 'Initial commit', author: 'Developer' },
            { hash: 'def456', date: '2023-09-14', message: 'Add new features', author: 'Developer' }
        ];
    }

    /**
     * Generate changelog content
     */
    private async generateChangelogContent(gitHistory: any[]): Promise<string> {
        let changelog = '# Changelog\n\n';
        
        gitHistory.forEach(commit => {
            changelog += `## ${commit.date}\n`;
            changelog += `- ${commit.message} (${commit.hash.substring(0, 7)})\n\n`;
        });

        return changelog;
    }

    /**
     * Save generated documentation to file
     */
    async saveDocumentation(docs: GeneratedDocs, outputPath?: string): Promise<string> {
        const fileName = outputPath || this.getDefaultFileName(docs.type);
        const fullPath = path.join(this.workspaceRoot, fileName);

        try {
            await fs.promises.writeFile(fullPath, docs.content, 'utf-8');
            console.log(`📚 Documentation saved to ${fileName}`);
            return fullPath;

        } catch (error) {
            throw new Error(`Failed to save documentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get default file name for documentation type
     */
    private getDefaultFileName(type: string): string {
        const fileNames = {
            'api': 'API.md',
            'readme': 'README.md',
            'architecture': 'ARCHITECTURE.md',
            'changelog': 'CHANGELOG.md'
        };

        return fileNames[type as keyof typeof fileNames] || 'documentation.md';
    }

    /**
     * Get documentation generator statistics
     */
    public getStats() {
        return {
            docsGenerated: 0,
            totalFiles: 0,
            lastGenerated: new Date().toISOString()
        };
    }

    /**
     * Generate comprehensive documentation for the entire project
     */
    public async generateDocumentation(): Promise<GeneratedDocs> {
        try {
            // Generate all types of documentation
            const readme = await this.generateREADME();
            const architecture = await this.generateArchitectureDocs();
            const changelog = await this.generateChangelog();

            return {
                type: 'readme', // Use a valid type from the interface
                content: `${readme.content}\n\n${architecture.content}\n\n${changelog.content}`,
                metadata: {
                    generatedAt: new Date(),
                    source: 'DocumentationGenerator',
                    version: '1.0.0'
                }
            };
        } catch (error) {
            console.error('Failed to generate comprehensive documentation:', error);
            return {
                type: 'readme', // Use a valid type
                content: '# Documentation Generation Failed\n\nAn error occurred while generating documentation.',
                metadata: {
                    generatedAt: new Date(),
                    source: 'DocumentationGenerator',
                    version: '1.0.0'
                }
            };
        }
    }
}