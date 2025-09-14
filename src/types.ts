// Type definitions for multi-model provider system

export interface ModelConfig {
    id: string;
    name: string;
    provider: 'deepseek' | 'openrouter';
    maxTokens: number;
    costPer1kTokens: {
        input: number;
        output: number;
    };
    capabilities: string[];
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
}

export interface ModelResponse {
    content: string;
    usage: {
        inputTokens: number;
        outputTokens: number;
        totalCost: number;
    };
    model: string;
    provider: string;
    optimized?: boolean;
    enhancedAt?: number;
    metadata?: {
        cached?: boolean;
        optimizationApplied?: boolean;
        processingTime?: number;
        [key: string]: any;
    };
}

export interface ProviderConfig {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
}

export interface CostTracker {
    dailyUsage: number;
    dailyLimit: number;
    totalUsage: number;
    lastReset: Date;
}

// Phase 5: Advanced Features Types

// Security Analysis Types
export interface SecurityIssue {
    id: string;
    type: 'vulnerability' | 'warning' | 'info';
    category: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    location: {
        file: string;
        line: number;
        column?: number;
    };
    recommendation: string;
    owaspCategory?: string;
    cweId?: string;
}

export interface SecurityReport {
    score: number; // 0-100
    issues: SecurityIssue[];
    recommendations: string[];
    complianceChecks: ComplianceResult[];
    scannedFiles: number;
    timestamp: Date;
}

export interface ComplianceResult {
    standard: string; // 'OWASP Top 10', 'CWE', etc.
    compliant: boolean;
    issues: string[];
    recommendations: string[];
}

// Code Analysis Types
export interface CodeComplexity {
    cyclomatic: number;
    cognitive: number;
    maintainability: 'excellent' | 'good' | 'fair' | 'poor';
    techDebt: number; // in hours
}

export interface CodeAnalysis {
    complexity: CodeComplexity;
    security: SecurityReport;
    performance: PerformanceAnalysis;
    quality: CodeQualityMetrics;
    suggestions: CodeSuggestion[];
}

export interface PerformanceAnalysis {
    hotspots: CodeLocation[];
    algorithmic: {
        timeComplexity: string;
        spaceComplexity: string;
        optimizations: string[];
    };
    suggestions: string[];
}

export interface CodeQualityMetrics {
    codeSmells: CodeSmell[];
    patterns: DesignPattern[];
    testability: number; // 0-100
    maintainability: number; // 0-100
    readability: number; // 0-100
}

export interface CodeLocation {
    file: string;
    line: number;
    column?: number;
    context?: string;
}

export interface CodeSmell {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    location: CodeLocation;
    suggestion: string;
}

export interface DesignPattern {
    name: string;
    confidence: number; // 0-100
    location: CodeLocation;
    description: string;
}

export interface CodeSuggestion {
    id: string;
    type: 'performance' | 'security' | 'maintainability' | 'best-practice';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    before: string;
    after: string;
    rationale: string;
    location: CodeLocation;
}

// Documentation Generation Types
export interface DocumentationConfig {
    format: 'markdown' | 'html' | 'json';
    includeExamples: boolean;
    includeTypes: boolean;
    includeTests: boolean;
    outputPath: string;
}

export interface GeneratedDocs {
    type: 'api' | 'readme' | 'architecture' | 'changelog';
    content: string;
    metadata: {
        generatedAt: Date;
        source: string;
        version: string;
    };
}

// Test Generation Types
export interface TestConfig {
    framework: 'jest' | 'mocha' | 'vitest' | 'jasmine';
    language: 'typescript' | 'javascript';
    coverage: boolean;
    includeIntegration: boolean;
    mockStrategy: 'auto' | 'manual' | 'none';
}

export interface GeneratedTest {
    type: 'unit' | 'integration' | 'e2e';
    content: string;
    coverage: {
        statements: number;
        branches: number;
        functions: number;
        lines: number;
    };
    dependencies: string[];
}

// Metrics Dashboard Types
export interface MetricsDashboard {
    generatedAt: Date;
    workspacePath: string;
    codeMetrics: CodeMetrics;
    performanceMetrics: PerformanceMetrics;
    qualityMetrics: QualityMetrics;
    trends: Record<string, TrendData[]>;
    insights: string[];
    recommendations: string[];
}

export interface CodeMetrics {
    totalLines: number;
    totalFiles: number;
    averageComplexity: number;
    averageLinesPerFile: number;
    totalFunctions: number;
    totalClasses: number;
    duplicateCodeBlocks: number;
    languageBreakdown: Record<string, number>;
    complexityByFile: Record<string, number>;
    largestFiles: Array<{ file: string; lines: number }>;
    mostComplexFiles: Array<{ file: string; complexity: number }>;
    maintainabilityIndex: number;
}

export interface PerformanceMetrics {
    totalDependencies: number;
    circularDependencies: number;
    unusedDependencies: number;
    estimatedBundleSize: number;
    performanceIssues: Array<{ file: string; issue: string; severity: 'low' | 'medium' | 'high' }>;
    loadTimeEstimate: number;
    optimizationOpportunities: string[];
}

export interface QualityMetrics {
    testCoverage: number;
    codeSmells: CodeSmell[];
    technicalDebt: number;
    qualityScore: number;
    codeSmellBreakdown: Record<string, number>;
    qualityIssues: Array<{ file: string; issue: string; severity: 'low' | 'medium' | 'high'; line?: number }>;
    securityVulnerabilities: number;
    documentationCoverage: number;
}

export interface TrendData {
    timestamp: Date;
    value: number;
    change: number;
}

export interface MetricsConfig {
    trackingEnabled: boolean;
    updateInterval: number;
    maxHistoryPoints: number;
    thresholds: {
        complexity: number;
        testCoverage: number;
        maintainabilityIndex: number;
        qualityScore: number;
    };
}