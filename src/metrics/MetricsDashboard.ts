import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ModelManager } from '../ModelManager';

// Type definitions for metrics
export interface CodeMetrics {
    linesOfCode: number;
    complexity: number;
    functions: number;
    classes: number;
    duplicateBlocks: number;
    maintainabilityIndex: number;
    dependencies: number;
}

export interface PerformanceMetrics {
    bundleSize: number;
    loadTime: number;
    circularDependencies: number;
    unusedDependencies: number;
    optimizations: string[];
}

export interface QualityMetrics {
    testCoverage: number;
    codeSmells: number;
    technicalDebt: number;
    qualityScore: number;
    securityIssues: number;
}

export interface CodeSmell {
    file: string;
    line: number;
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
}

export interface TrendData {
    timestamp: number;
    value: number;
}

export interface IMetricsDashboard {
    timestamp: number;
    codeMetrics: CodeMetrics;
    performanceMetrics: PerformanceMetrics;
    qualityMetrics: QualityMetrics;
    trends: Record<string, TrendData[]>;
    recommendations: string[];
    insights: string[];
}

export interface MetricsConfig {
    enableRealTimeAnalysis: boolean;
    trackingInterval: number;
    alertThresholds: {
        complexity: number;
        duplicateBlocks: number;
        testCoverage: number;
    };
}

/**
 * Advanced Metrics Dashboard for real-time code analysis and quality tracking
 */
export class MetricsDashboard {
    private context: vscode.ExtensionContext;
    private outputChannel: vscode.OutputChannel;
    private modelManager: ModelManager;
    private metricsHistory: Map<string, TrendData[]> = new Map();
    private config: MetricsConfig;
    private fileWatcher?: vscode.FileSystemWatcher;

    constructor(context: vscode.ExtensionContext, modelManager: ModelManager) {
        this.context = context;
        this.modelManager = modelManager;
        this.outputChannel = vscode.window.createOutputChannel('Metrics Dashboard');
        this.config = this.loadConfig();
    }

    /**
     * Generate comprehensive metrics dashboard
     */
    public async generateDashboard(): Promise<IMetricsDashboard> {
        const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspacePath) {
            throw new Error('No workspace folder found');
        }

        this.outputChannel.appendLine('Generating comprehensive metrics dashboard...');
        
        try {
            const [codeMetrics, performanceMetrics, qualityMetrics] = await Promise.all([
                this.analyzeCodeMetrics(workspacePath),
                this.analyzePerformanceMetrics(workspacePath),
                this.analyzeQualityMetrics(workspacePath)
            ]);

            const dashboard: IMetricsDashboard = {
                timestamp: Date.now(),
                codeMetrics,
                performanceMetrics,
                qualityMetrics,
                trends: this.calculateTrends(),
                recommendations: await this.generateRecommendations(codeMetrics, qualityMetrics),
                insights: await this.generateAIInsights(codeMetrics, performanceMetrics, qualityMetrics)
            };

            await this.saveDashboard(dashboard);
            await this.updateTrends(dashboard);

            this.outputChannel.appendLine('Dashboard generated successfully');
            return dashboard;

        } catch (error) {
            this.outputChannel.appendLine(`Error generating dashboard: ${error}`);
            throw error;
        }
    }

    /**
     * Analyze code metrics
     */
    private async analyzeCodeMetrics(workspacePath: string): Promise<CodeMetrics> {
        const files = await this.getSourceFiles(workspacePath);
        let totalLines = 0;
        let totalComplexity = 0;
        let totalFunctions = 0;
        let totalClasses = 0;

        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                totalLines += content.split('\n').length;
                totalComplexity += this.calculateCyclomaticComplexity(content);
                totalFunctions += this.countFunctions(content, path.extname(file));
                totalClasses += this.countClasses(content, path.extname(file));
            } catch (error) {
                // Skip files that can't be read
            }
        }

        const duplicateBlocks = await this.detectCodeDuplication(files);
        const maintainabilityIndex = this.calculateMaintainabilityIndex(
            totalComplexity, 
            totalLines / files.length, 
            duplicateBlocks
        );

        // Count dependencies
        const dependencies = await this.countDependencies(workspacePath);

        return {
            linesOfCode: totalLines,
            complexity: totalComplexity,
            functions: totalFunctions,
            classes: totalClasses,
            duplicateBlocks,
            maintainabilityIndex,
            dependencies
        };
    }

    /**
     * Analyze performance metrics
     */
    private async analyzePerformanceMetrics(workspacePath: string): Promise<PerformanceMetrics> {
        const files = await this.getSourceFiles(workspacePath);
        const dependencies = this.extractDependencies(workspacePath);
        const dependencyGraph = this.buildDependencyGraph(files);

        const bundleSize = await this.estimateBundleSize(workspacePath, dependencies);
        const loadTime = this.estimateLoadTime(bundleSize);
        const circularDependencies = this.detectCircularDependencies(dependencyGraph);
        const unusedDependencies = await this.detectUnusedDependencies(workspacePath, dependencies, files);
        const optimizations = await this.identifyOptimizationOpportunities(files, dependencyGraph);

        return {
            bundleSize,
            loadTime,
            circularDependencies,
            unusedDependencies,
            optimizations
        };
    }

    /**
     * Analyze quality metrics
     */
    private async analyzeQualityMetrics(workspacePath: string): Promise<QualityMetrics> {
        const files = await this.getSourceFiles(workspacePath);
        const testCoverage = await this.analyzeTestCoverage(workspacePath);
        
        let totalCodeSmells = 0;
        let totalTechnicalDebt = 0;
        let securityIssues = 0;

        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                const codeSmells = this.detectCodeSmells(content, file, workspacePath);
                totalCodeSmells += codeSmells.length;
                totalTechnicalDebt += this.calculateTechnicalDebt(content, codeSmells.length);
            } catch (error) {
                // Skip files that can't be read
            }
        }

        securityIssues = await this.detectSecurityVulnerabilities(files);
        const qualityScore = this.calculateQualityScore(testCoverage, totalCodeSmells, totalTechnicalDebt, files.length);

        return {
            testCoverage,
            codeSmells: totalCodeSmells,
            technicalDebt: totalTechnicalDebt,
            qualityScore,
            securityIssues
        };
    }

    /**
     * Calculate cyclomatic complexity
     */
    private calculateCyclomaticComplexity(content: string): number {
        // Count decision points
        const decisionPoints = [
            /\bif\b/g,
            /\belse\b/g,
            /\bfor\b/g,
            /\bwhile\b/g,
            /\bdo\b/g,
            /\bswitch\b/g,
            /\bcase\b/g,
            /\bcatch\b/g,
            /\?\s*.*\s*:/g, // ternary operators
            /&&/g,
            /\|\|/g
        ];

        let complexity = 1; // Base complexity
        
        decisionPoints.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        });

        return complexity;
    }

    /**
     * Count functions in code
     */
    private countFunctions(content: string, extension: string): number {
        const patterns: Record<string, RegExp[]> = {
            '.ts': [/function\s+\w+/g, /\w+\s*=\s*\([^)]*\)\s*=>/g, /\w+\s*:\s*\([^)]*\)\s*=>/g],
            '.js': [/function\s+\w+/g, /\w+\s*=\s*\([^)]*\)\s*=>/g],
            '.py': [/def\s+\w+/g],
            '.java': [/\w+\s+\w+\s*\([^)]*\)\s*\{/g],
            '.cs': [/\w+\s+\w+\s*\([^)]*\)\s*\{/g],
        };

        const filePatterns = patterns[extension] || patterns['.js'];
        let count = 0;

        filePatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                count += matches.length;
            }
        });

        return count;
    }

    /**
     * Count classes in code
     */
    private countClasses(content: string, extension: string): number {
        const patterns: Record<string, RegExp> = {
            '.ts': /class\s+\w+/g,
            '.js': /class\s+\w+/g,
            '.py': /class\s+\w+/g,
            '.java': /class\s+\w+/g,
            '.cs': /class\s+\w+/g,
        };

        const pattern = patterns[extension] || patterns['.js'];
        const matches = content.match(pattern);
        return matches ? matches.length : 0;
    }

    /**
     * Calculate complexity score for code analysis
     */
    public calculateComplexity(content: string): number {
        return this.calculateCyclomaticComplexity(content);
    }

    /**
     * Detect code duplication
     */
    private async detectCodeDuplication(files: string[]): Promise<number> {
        const blockSize = 5; // Minimum lines for duplication
        const blocks = new Map<string, number>();
        
        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                const lines = content.split('\n').filter(line => line.trim().length > 0);
                
                for (let i = 0; i <= lines.length - blockSize; i++) {
                    const block = lines.slice(i, i + blockSize).join('\n').trim();
                    if (block.length > 20) { // Ignore very small blocks
                        const hash = this.simpleHash(block);
                        blocks.set(hash, (blocks.get(hash) || 0) + 1);
                    }
                }
            } catch (error) {
                // Skip files that can't be read
            }
        }

        // Count blocks that appear more than once
        let duplicates = 0;
        blocks.forEach(count => {
            if (count > 1) {
                duplicates += count - 1;
            }
        });

        return duplicates;
    }

    /**
     * Simple hash function for duplicate detection
     */
    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    /**
     * Calculate maintainability index
     */
    private calculateMaintainabilityIndex(complexity: number, linesPerFile: number, duplicateBlocks: number): number {
        // Simplified maintainability index calculation
        const complexityScore = Math.max(0, 100 - (complexity * 2));
        const sizeScore = Math.max(0, 100 - (linesPerFile / 10));
        const duplicationScore = Math.max(0, 100 - (duplicateBlocks * 5));
        
        return Math.round((complexityScore + sizeScore + duplicationScore) / 3);
    }

    /**
     * Extract imports and dependencies
     */
    private extractImports(content: string): string[] {
        const importPatterns = [
            /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
            /import\s+['"]([^'"]+)['"]/g,
            /require\(['"]([^'"]+)['"]\)/g,
            /@import\s+['"]([^'"]+)['"]/g,
        ];

        const imports: string[] = [];
        importPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                imports.push(match[1]);
            }
        });

        return imports;
    }

    /**
     * Extract dependencies from package.json
     */
    private extractDependencies(workspacePath: string): string[] {
        try {
            const packageJsonPath = path.join(workspacePath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                return Object.keys({
                    ...packageJson.dependencies,
                    ...packageJson.devDependencies
                });
            }
        } catch (error) {
            // No package.json or invalid JSON
        }
        return [];
    }

    /**
     * Build dependency graph
     */
    private buildDependencyGraph(files: string[]): Map<string, string[]> {
        const graph = new Map<string, string[]>();
        
        files.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                const imports = this.extractImports(content);
                graph.set(file, imports);
            } catch (error) {
                graph.set(file, []);
            }
        });

        return graph;
    }

    /**
     * Detect performance issues
     */
    private detectPerformanceIssues(content: string, file: string, workspacePath: string): Array<{ file: string; issue: string; severity: 'low' | 'medium' | 'high' }> {
        const issues = [];
        const relativePath = path.relative(workspacePath, file);

        // Check for common performance anti-patterns
        if (content.includes('document.write')) {
            issues.push({ file: relativePath, issue: 'document.write usage', severity: 'high' as const });
        }
        
        if (content.match(/for\s*\(\s*.*\s*in\s*.*\)/g)) {
            issues.push({ file: relativePath, issue: 'for...in loop (consider for...of)', severity: 'medium' as const });
        }

        if (content.includes('eval(')) {
            issues.push({ file: relativePath, issue: 'eval() usage', severity: 'high' as const });
        }

        // Check for large functions (over 50 lines)
        const functions = content.split(/function|=>/);
        functions.forEach(func => {
            if (func.split('\n').length > 50) {
                issues.push({ file: relativePath, issue: 'Large function detected', severity: 'medium' as const });
            }
        });

        return issues;
    }

    /**
     * Detect circular dependencies
     */
    private detectCircularDependencies(dependencyGraph: Map<string, string[]>): number {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        let cycles = 0;

        const dfs = (file: string): boolean => {
            if (recursionStack.has(file)) {
                cycles++;
                return true;
            }
            if (visited.has(file)) {
                return false;
            }

            visited.add(file);
            recursionStack.add(file);

            const dependencies = dependencyGraph.get(file) || [];
            for (const dep of dependencies) {
                // Find actual file path for dependency
                const depFile = this.findFileForDependency(dep, dependencyGraph);
                if (depFile && dfs(depFile)) {
                    return true;
                }
            }

            recursionStack.delete(file);
            return false;
        };

        for (const file of dependencyGraph.keys()) {
            if (!visited.has(file)) {
                dfs(file);
            }
        }

        return cycles;
    }

    /**
     * Find file path for a dependency
     */
    private findFileForDependency(dep: string, dependencyGraph: Map<string, string[]>): string | null {
        // Simple implementation - in real world, this would be more sophisticated
        for (const file of dependencyGraph.keys()) {
            if (file.includes(dep) || dep.includes(path.basename(file, path.extname(file)))) {
                return file;
            }
        }
        return null;
    }

    /**
     * Estimate bundle size
     */
    private async estimateBundleSize(workspacePath: string, dependencies: string[]): Promise<number> {
        // Simplified estimation based on file sizes and known library sizes
        const files = await this.getSourceFiles(workspacePath);
        let totalSize = 0;

        files.forEach(file => {
            try {
                const stats = fs.statSync(file);
                totalSize += stats.size;
            } catch (error) {
                // Skip files that can't be accessed
            }
        });

        // Add estimated size for dependencies (rough estimates)
        const dependencySizes: Record<string, number> = {
            'react': 45000,
            'lodash': 70000,
            'moment': 67000,
            'axios': 15000,
            'typescript': 0, // Dev dependency
        };

        dependencies.forEach(dep => {
            totalSize += dependencySizes[dep] || 10000; // Default 10KB for unknown deps
        });

        return Math.round(totalSize / 1024); // Return in KB
    }

    /**
     * Detect unused dependencies
     */
    private async detectUnusedDependencies(workspacePath: string, dependencies: string[], files: string[]): Promise<number> {
        const usedDeps = new Set<string>();

        files.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                dependencies.forEach(dep => {
                    if (content.includes(dep)) {
                        usedDeps.add(dep);
                    }
                });
            } catch (error) {
                // Skip files that can't be read
            }
        });

        return dependencies.length - usedDeps.size;
    }

    /**
     * Estimate load time based on bundle size
     */
    private estimateLoadTime(bundleSizeKB: number): number {
        // Rough estimation: 1KB = 10ms on average connection
        return bundleSizeKB * 10;
    }

    /**
     * Identify optimization opportunities
     */
    private async identifyOptimizationOpportunities(files: string[], dependencyGraph: Map<string, string[]>): Promise<string[]> {
        const opportunities: string[] = [];

        // Check for large files
        files.forEach(file => {
            try {
                const stats = fs.statSync(file);
                if (stats.size > 100000) { // 100KB
                    opportunities.push(`Consider splitting large file: ${path.basename(file)}`);
                }
            } catch (error) {
                // Skip files that can't be accessed
            }
        });

        // Check for unused imports
        if (dependencyGraph.size > 0) {
            opportunities.push('Review and remove unused imports');
        }

        return opportunities;
    }

    /**
     * Detect code smells
     */
    private detectCodeSmells(content: string, file: string, workspacePath: string): CodeSmell[] {
        const smells: CodeSmell[] = [];
        const lines = content.split('\n');
        const relativePath = path.relative(workspacePath, file);

        lines.forEach((line, index) => {
            const lineNumber = index + 1;
            const trimmedLine = line.trim();

            // Long lines
            if (line.length > 120) {
                smells.push({
                    file: relativePath,
                    line: lineNumber,
                    type: 'long-line',
                    severity: 'low',
                    description: 'Line exceeds 120 characters'
                });
            }

            // TODO comments
            if (trimmedLine.includes('TODO') || trimmedLine.includes('FIXME')) {
                smells.push({
                    file: relativePath,
                    line: lineNumber,
                    type: 'todo-comment',
                    severity: 'low',
                    description: 'TODO/FIXME comment found'
                });
            }

            // Magic numbers
            if (trimmedLine.match(/\b\d{2,}\b/) && !trimmedLine.includes('//')) {
                smells.push({
                    file: relativePath,
                    line: lineNumber,
                    type: 'magic-number',
                    severity: 'medium',
                    description: 'Magic number detected'
                });
            }

            // Deep nesting
            const indentation = line.length - line.trimStart().length;
            if (indentation > 24) { // More than 6 levels of nesting (assuming 4 spaces)
                smells.push({
                    file: relativePath,
                    line: lineNumber,
                    type: 'deep-nesting',
                    severity: 'high',
                    description: 'Deep nesting detected'
                });
            }

            // Empty catch blocks
            if (trimmedLine.includes('catch') && lines[index + 1]?.trim() === '}') {
                smells.push({
                    file: relativePath,
                    line: lineNumber,
                    type: 'empty-catch',
                    severity: 'medium',
                    description: 'Empty catch block'
                });
            }

            // Console.log statements
            if (trimmedLine.includes('console.log')) {
                smells.push({
                    file: relativePath,
                    line: lineNumber,
                    type: 'debug-statement',
                    severity: 'low',
                    description: 'Console.log statement found'
                });
            }
        });

        return smells;
    }

    /**
     * Calculate technical debt
     */
    private calculateTechnicalDebt(content: string, codeSmells: number): number {
        // Simplified technical debt calculation
        const lines = content.split('\n').length;
        const complexity = this.calculateCyclomaticComplexity(content);
        
        // Debt = (code smells * 2) + (complexity / 10) + (lines / 1000)
        const debt = (codeSmells * 2) + (complexity / 10) + (lines / 1000);
        return Math.round(debt * 100) / 100;
    }

    /**
     * Analyze test coverage
     */
    private async analyzeTestCoverage(workspacePath: string): Promise<number> {
        const sourceFiles = await this.getSourceFiles(workspacePath);
        const testFiles = await this.getTestFiles(workspacePath);
        
        if (sourceFiles.length === 0) {
            return 0;
        }

        // Simplified coverage estimation based on test-to-source ratio
        const coverageRatio = testFiles.length / sourceFiles.length;
        return Math.min(100, Math.round(coverageRatio * 80)); // Max 80% from ratio
    }

    /**
     * Calculate overall quality score
     */
    private calculateQualityScore(testCoverage: number, codeSmells: number, technicalDebt: number, totalFiles: number): number {
        const coverageScore = testCoverage;
        const smellScore = Math.max(0, 100 - (codeSmells / totalFiles) * 10);
        const debtScore = Math.max(0, 100 - technicalDebt * 5);
        
        return Math.round((coverageScore + smellScore + debtScore) / 3);
    }

    /**
     * Detect security vulnerabilities
     */
    private async detectSecurityVulnerabilities(files: string[]): Promise<number> {
        let vulnerabilities = 0;
        
        const vulnerabilityPatterns = [
            /eval\s*\(/g, // eval usage
            /innerHTML\s*=/g, // innerHTML assignment
            /document\.write/g, // document.write usage
            /\$\{.*\}/g, // Template literal injection potential
            /exec\s*\(/g, // exec usage
        ];

        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                vulnerabilityPatterns.forEach(pattern => {
                    const matches = content.match(pattern);
                    if (matches) {
                        vulnerabilities += matches.length;
                    }
                });
            } catch (error) {
                // Skip files that can't be read
            }
        }

        return vulnerabilities;
    }

    /**
     * Count dependencies
     */
    private async countDependencies(workspacePath: string): Promise<number> {
        return this.extractDependencies(workspacePath).length;
    }

    /**
     * Get all source files in workspace
     */
    private async getSourceFiles(workspacePath: string): Promise<string[]> {
        const extensions = ['.ts', '.js', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.php'];
        const excludeDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.vscode'];
        
        return this.getFilesRecursively(workspacePath, extensions, excludeDirs);
    }

    /**
     * Get all test files in workspace
     */
    private async getTestFiles(workspacePath: string): Promise<string[]> {
        const testPatterns = ['.test.', '.spec.', '_test.', '_spec.'];
        const allFiles = await this.getSourceFiles(workspacePath);
        
        return allFiles.filter(file => 
            testPatterns.some(pattern => file.includes(pattern)) ||
            file.includes('/test/') || 
            file.includes('/tests/') ||
            file.includes('__tests__')
        );
    }

    /**
     * Get files recursively with filtering
     */
    private getFilesRecursively(dir: string, extensions: string[], excludeDirs: string[]): string[] {
        const files: string[] = [];
        
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    if (!excludeDirs.includes(entry.name) && !entry.name.startsWith('.')) {
                        files.push(...this.getFilesRecursively(fullPath, extensions, excludeDirs));
                    }
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    if (extensions.includes(ext)) {
                        files.push(fullPath);
                    }
                }
            }
        } catch (error) {
            // Skip directories that can't be read
        }
        
        return files;
    }

    /**
     * Calculate trends from historical data
     */
    private calculateTrends(): Record<string, TrendData[]> {
        const trends: Record<string, TrendData[]> = {};
        
        this.metricsHistory.forEach((history, metric) => {
            trends[metric] = history.slice(-30); // Last 30 data points
        });
        
        return trends;
    }

    /**
     * Generate AI insights
     */
    private async generateAIInsights(
        codeMetrics: CodeMetrics,
        performanceMetrics: PerformanceMetrics,
        qualityMetrics: QualityMetrics
    ): Promise<string[]> {
        const insights: string[] = [];

        try {
            const prompt = `
            Analyze the following code metrics and provide insights:
            
            Code Metrics:
            - Lines of Code: ${codeMetrics.linesOfCode}
            - Complexity: ${codeMetrics.complexity}
            - Functions: ${codeMetrics.functions}
            
            Performance:
            - Bundle Size: ${performanceMetrics.bundleSize}KB
            - Load Time: ${performanceMetrics.loadTime}ms
            - Circular Dependencies: ${performanceMetrics.circularDependencies}
            
            Quality:
            - Test Coverage: ${qualityMetrics.testCoverage}%
            - Code Smells: ${qualityMetrics.codeSmells}
            - Quality Score: ${qualityMetrics.qualityScore}%
            `;

            const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
                { role: 'user', content: prompt }
            ];

            const response = await this.modelManager.sendMessage(messages, 'deepseek-coder');
            if (response && response.content) {
                insights.push(response.content.trim());
            }
        } catch (error) {
            this.outputChannel.appendLine(`Error generating AI insights: ${error}`);
        }

        // Add static insights based on metrics
        if (codeMetrics.complexity > 50) {
            insights.push('High complexity detected. Consider refactoring complex functions.');
        }

        if (qualityMetrics.testCoverage < 70) {
            insights.push('Low test coverage. Consider adding more unit tests.');
        }

        if (performanceMetrics.bundleSize > 1000) {
            insights.push('Large bundle size detected. Consider code splitting or tree shaking.');
        }

        if (codeMetrics.duplicateBlocks > 5) {
            insights.push('Code duplication detected. Consider extracting common functionality.');
        }

        if (qualityMetrics.codeSmells > 20) {
            insights.push('Multiple code smells detected. Consider code cleanup.');
        }

        return insights;
    }

    /**
     * Generate recommendations
     */
    private async generateRecommendations(codeMetrics: CodeMetrics, qualityMetrics: QualityMetrics): Promise<string[]> {
        const recommendations: string[] = [];

        if (codeMetrics.complexity > 30) {
            recommendations.push('Consider breaking down complex functions into smaller, more manageable pieces');
        }

        if (qualityMetrics.testCoverage < 80) {
            recommendations.push('Increase test coverage to improve code quality and reliability');
        }

        if (qualityMetrics.codeSmells > 15) {
            recommendations.push('Address code smells to improve maintainability');
        }

        if (qualityMetrics.technicalDebt > 10) {
            recommendations.push('Schedule technical debt reduction sprints');
        }

        if (qualityMetrics.securityIssues > 0) {
            recommendations.push('Address security vulnerabilities immediately');
        }

        return recommendations;
    }

    /**
     * Save dashboard to file
     */
    private async saveDashboard(dashboard: IMetricsDashboard): Promise<void> {
        const outputPath = path.join(this.context.globalStorageUri?.fsPath || '', 'metrics-dashboard.json');
        
        try {
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(outputPath, JSON.stringify(dashboard, null, 2));
            this.outputChannel.appendLine(`Dashboard saved to ${outputPath}`);
        } catch (error) {
            this.outputChannel.appendLine(`Error saving dashboard: ${error}`);
        }
    }

    /**
     * Update trends with new data
     */
    private async updateTrends(dashboard: IMetricsDashboard): Promise<void> {
        const timestamp = Date.now();
        
        // Track key metrics
        const metricsToTrack = [
            { key: 'complexity', value: dashboard.codeMetrics.complexity },
            { key: 'linesOfCode', value: dashboard.codeMetrics.linesOfCode },
            { key: 'testCoverage', value: dashboard.qualityMetrics.testCoverage },
            { key: 'qualityScore', value: dashboard.qualityMetrics.qualityScore },
            { key: 'technicalDebt', value: dashboard.qualityMetrics.technicalDebt }
        ];

        metricsToTrack.forEach(metric => {
            if (!this.metricsHistory.has(metric.key)) {
                this.metricsHistory.set(metric.key, []);
            }
            
            const history = this.metricsHistory.get(metric.key)!;
            history.push({
                timestamp,
                value: metric.value
            });
            
            // Keep only last 100 data points
            if (history.length > 100) {
                history.shift();
            }
        });
    }

    /**
     * Load configuration
     */
    private loadConfig(): MetricsConfig {
        return {
            enableRealTimeAnalysis: true,
            trackingInterval: 300000, // 5 minutes
            alertThresholds: {
                complexity: 50,
                duplicateBlocks: 10,
                testCoverage: 70
            }
        };
    }

    /**
     * Initialize metrics tracking
     */
    public initializeMetricsTracking(): void {
        if (this.config.enableRealTimeAnalysis && vscode.workspace.workspaceFolders) {
            const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            
            // Set up file watcher
            this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,js,py,java}');
            
            this.fileWatcher.onDidChange(() => {
                // Debounced analysis trigger
                setTimeout(() => this.generateDashboard(), 5000);
            });

            this.outputChannel.appendLine('Real-time metrics tracking initialized');
        }
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }
        
        if (this.config.enableRealTimeAnalysis && vscode.workspace.workspaceFolders) {
            const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            this.outputChannel.appendLine('Metrics tracking disposed');
        }

        this.outputChannel.dispose();
        
        // Clear history
        this.metricsHistory.clear();
    }
}