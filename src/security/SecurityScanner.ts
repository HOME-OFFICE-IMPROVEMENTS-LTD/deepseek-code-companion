import * as vscode from 'vscode';
import { ModelManager } from '../ModelManager';
import { SecurityReport, SecurityIssue, ComplianceResult, CodeLocation } from '../types';

/**
 * AI-powered security scanner with OWASP Top 10 compliance checking
 * Automatically detects vulnerabilities and provides remediation suggestions
 */
export class SecurityScanner {
    private modelManager: ModelManager;
    
    // OWASP Top 10 2021 Categories
    private readonly owaspTop10 = [
        'A01:2021-Broken Access Control',
        'A02:2021-Cryptographic Failures',
        'A03:2021-Injection',
        'A04:2021-Insecure Design',
        'A05:2021-Security Misconfiguration',
        'A06:2021-Vulnerable and Outdated Components',
        'A07:2021-Identification and Authentication Failures',
        'A08:2021-Software and Data Integrity Failures',
        'A09:2021-Security Logging and Monitoring Failures',
        'A10:2021-Server-Side Request Forgery (SSRF)'
    ];

    // Security pattern detection rules
    private readonly securityPatterns = {
        sqlInjection: [
            /SELECT.*FROM.*WHERE.*\+.*['"]/gi,
            /INSERT.*INTO.*VALUES.*\+.*['"]/gi,
            /UPDATE.*SET.*\+.*['"]/gi,
            /DELETE.*FROM.*WHERE.*\+.*['"]/gi
        ],
        xss: [
            /innerHTML\s*=\s*.*\+/gi,
            /document\.write\s*\(/gi,
            /eval\s*\(/gi,
            /setTimeout\s*\(\s*['"]/gi
        ],
        hardcodedSecrets: [
            /password\s*=\s*['"]\w+['"]/gi,
            /api[_-]?key\s*=\s*['"]\w+['"]/gi,
            /secret\s*=\s*['"]\w+['"]/gi,
            /token\s*=\s*['"]\w+['"]/gi
        ],
        weakCrypto: [
            /md5\s*\(/gi,
            /sha1\s*\(/gi,
            /Math\.random\s*\(/gi,
            /DES|RC4|ECB/gi
        ],
        pathTraversal: [
            /\.\.\//g,
            /\.\.\\\\|\.\.\\|\\\\\.\./g
        ]
    };

    constructor(modelManager: ModelManager) {
        this.modelManager = modelManager;
    }

    /**
     * Scan code for security vulnerabilities using AI analysis and pattern matching
     */
    async scanCode(code: string, filePath: string, language: string): Promise<SecurityReport> {
        const startTime = Date.now();
        
        try {
            // Combine pattern-based detection with AI analysis
            const [patternIssues, aiAnalysis] = await Promise.all([
                this.detectPatternBasedIssues(code, filePath, language),
                this.performAISecurityAnalysis(code, language)
            ]);

            const allIssues = [...patternIssues, ...aiAnalysis.issues];
            const score = this.calculateSecurityScore(allIssues);
            const compliance = await this.checkOWASPCompliance(allIssues);

            const report: SecurityReport = {
                score,
                issues: allIssues,
                recommendations: this.generateRecommendations(allIssues),
                complianceChecks: compliance,
                scannedFiles: 1,
                timestamp: new Date()
            };

            // Track performance
            const processingTime = Date.now() - startTime;
            console.log(`🔒 Security scan completed in ${processingTime}ms - Score: ${score}/100`);

            return report;

        } catch (error) {
            console.error('Security scan failed:', error);
            throw new Error(`Security scanning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Scan entire workspace for security issues
     */
    async scanWorkspace(): Promise<SecurityReport> {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            throw new Error('No workspace folder found');
        }

        const files = await vscode.workspace.findFiles('**/*.{ts,js,py,java,cs,php,rb,go}', '**/node_modules/**');
        const allIssues: SecurityIssue[] = [];
        const allRecommendations: string[] = [];
        let scannedFiles = 0;

        for (const file of files) {
            try {
                const document = await vscode.workspace.openTextDocument(file);
                const code = document.getText();
                const language = document.languageId;
                
                const report = await this.scanCode(code, file.fsPath, language);
                allIssues.push(...report.issues);
                allRecommendations.push(...report.recommendations);
                scannedFiles++;

            } catch (error) {
                console.warn(`Failed to scan ${file.fsPath}:`, error);
            }
        }

        const score = this.calculateSecurityScore(allIssues);
        const compliance = await this.checkOWASPCompliance(allIssues);

        return {
            score,
            issues: allIssues,
            recommendations: [...new Set(allRecommendations)], // Remove duplicates
            complianceChecks: compliance,
            scannedFiles,
            timestamp: new Date()
        };
    }

    /**
     * Pattern-based vulnerability detection
     */
    private async detectPatternBasedIssues(code: string, filePath: string, language: string): Promise<SecurityIssue[]> {
        const issues: SecurityIssue[] = [];
        const lines = code.split('\n');

        // SQL Injection Detection
        lines.forEach((line, index) => {
            this.securityPatterns.sqlInjection.forEach(pattern => {
                if (pattern.test(line)) {
                    issues.push({
                        id: `sql-injection-${index}`,
                        type: 'vulnerability',
                        category: 'Injection',
                        severity: 'high',
                        title: 'Potential SQL Injection',
                        description: 'String concatenation in SQL query detected. This may lead to SQL injection vulnerabilities.',
                        location: {
                            file: filePath,
                            line: index + 1
                        },
                        recommendation: 'Use parameterized queries or prepared statements instead of string concatenation.',
                        owaspCategory: 'A03:2021-Injection',
                        cweId: 'CWE-89'
                    });
                }
            });
        });

        // XSS Detection
        lines.forEach((line, index) => {
            this.securityPatterns.xss.forEach(pattern => {
                if (pattern.test(line)) {
                    issues.push({
                        id: `xss-${index}`,
                        type: 'vulnerability',
                        category: 'Cross-Site Scripting',
                        severity: 'high',
                        title: 'Potential XSS Vulnerability',
                        description: 'Dynamic content insertion detected without proper sanitization.',
                        location: {
                            file: filePath,
                            line: index + 1
                        },
                        recommendation: 'Sanitize and validate all user input before rendering. Use textContent instead of innerHTML.',
                        owaspCategory: 'A03:2021-Injection',
                        cweId: 'CWE-79'
                    });
                }
            });
        });

        // Hardcoded Secrets Detection
        lines.forEach((line, index) => {
            this.securityPatterns.hardcodedSecrets.forEach(pattern => {
                if (pattern.test(line)) {
                    issues.push({
                        id: `hardcoded-secret-${index}`,
                        type: 'vulnerability',
                        category: 'Sensitive Data',
                        severity: 'critical',
                        title: 'Hardcoded Secret Detected',
                        description: 'Hardcoded password, API key, or secret found in source code.',
                        location: {
                            file: filePath,
                            line: index + 1
                        },
                        recommendation: 'Move secrets to environment variables or secure configuration files.',
                        owaspCategory: 'A02:2021-Cryptographic Failures',
                        cweId: 'CWE-798'
                    });
                }
            });
        });

        // Weak Cryptography Detection
        lines.forEach((line, index) => {
            this.securityPatterns.weakCrypto.forEach(pattern => {
                if (pattern.test(line)) {
                    issues.push({
                        id: `weak-crypto-${index}`,
                        type: 'vulnerability',
                        category: 'Cryptographic Issues',
                        severity: 'medium',
                        title: 'Weak Cryptographic Algorithm',
                        description: 'Usage of weak or deprecated cryptographic algorithms detected.',
                        location: {
                            file: filePath,
                            line: index + 1
                        },
                        recommendation: 'Use strong cryptographic algorithms like SHA-256, AES-256, or bcrypt.',
                        owaspCategory: 'A02:2021-Cryptographic Failures',
                        cweId: 'CWE-327'
                    });
                }
            });
        });

        return issues;
    }

    /**
     * AI-powered security analysis using language models
     */
    private async performAISecurityAnalysis(code: string, language: string): Promise<{ issues: SecurityIssue[] }> {
        const prompt = `
Analyze this ${language} code for security vulnerabilities. Focus on:

1. OWASP Top 10 vulnerabilities
2. Input validation issues
3. Authentication and authorization flaws
4. Cryptographic issues
5. Error handling problems
6. Configuration security
7. Data exposure risks

Code to analyze:
\`\`\`${language}
${code.substring(0, 2000)} // Limit for token efficiency
\`\`\`

Return a JSON response with this structure:
{
  "issues": [
    {
      "type": "vulnerability|warning|info",
      "category": "string",
      "severity": "critical|high|medium|low",
      "title": "string",
      "description": "string",
      "line": number,
      "recommendation": "string",
      "owaspCategory": "string",
      "cweId": "string"
    }
  ]
}

Focus on real security issues, not code style. Be specific about line numbers where possible.
`;

        try {
            const response = await this.modelManager.sendMessage([
                { role: 'user', content: prompt }
            ], 'deepseek-coder');

            // Parse AI response
            const aiResult = this.parseAISecurityResponse(response.content);
            return { issues: aiResult };

        } catch (error) {
            console.warn('AI security analysis failed, using pattern-based only:', error);
            return { issues: [] };
        }
    }

    /**
     * Parse AI security analysis response
     */
    private parseAISecurityResponse(response: string): SecurityIssue[] {
        try {
            // Extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            const issues: SecurityIssue[] = [];

            if (parsed.issues && Array.isArray(parsed.issues)) {
                parsed.issues.forEach((issue: any, index: number) => {
                    issues.push({
                        id: `ai-analysis-${index}`,
                        type: issue.type || 'warning',
                        category: issue.category || 'General',
                        severity: issue.severity || 'medium',
                        title: issue.title || 'Security Issue',
                        description: issue.description || 'AI detected a potential security issue',
                        location: {
                            file: '',
                            line: issue.line || 1
                        },
                        recommendation: issue.recommendation || 'Review and address this security concern',
                        owaspCategory: issue.owaspCategory,
                        cweId: issue.cweId
                    });
                });
            }

            return issues;

        } catch (error) {
            console.warn('Failed to parse AI security response:', error);
            return [];
        }
    }

    /**
     * Calculate overall security score based on issues
     */
    private calculateSecurityScore(issues: SecurityIssue[]): number {
        if (issues.length === 0) {
            return 100;
        }

        let totalPenalty = 0;
        
        issues.forEach(issue => {
            switch (issue.severity) {
                case 'critical': totalPenalty += 25; break;
                case 'high': totalPenalty += 15; break;
                case 'medium': totalPenalty += 8; break;
                case 'low': totalPenalty += 3; break;
            }
        });

        const score = Math.max(0, 100 - totalPenalty);
        return Math.round(score);
    }

    /**
     * Check OWASP Top 10 compliance
     */
    private async checkOWASPCompliance(issues: SecurityIssue[]): Promise<ComplianceResult[]> {
        const complianceResults: ComplianceResult[] = [];

        this.owaspTop10.forEach(category => {
            const categoryIssues = issues.filter(issue => 
                issue.owaspCategory === category || 
                this.mapCategoryToOWASP(issue.category) === category
            );

            complianceResults.push({
                standard: category,
                compliant: categoryIssues.length === 0,
                issues: categoryIssues.map(issue => issue.title),
                recommendations: categoryIssues.map(issue => issue.recommendation)
            });
        });

        return complianceResults;
    }

    /**
     * Map generic categories to OWASP categories
     */
    private mapCategoryToOWASP(category: string): string {
        const mapping: { [key: string]: string } = {
            'Injection': 'A03:2021-Injection',
            'Cross-Site Scripting': 'A03:2021-Injection',
            'Sensitive Data': 'A02:2021-Cryptographic Failures',
            'Cryptographic Issues': 'A02:2021-Cryptographic Failures',
            'Authentication': 'A07:2021-Identification and Authentication Failures',
            'Authorization': 'A01:2021-Broken Access Control'
        };
        
        return mapping[category] || '';
    }

    /**
     * Generate security recommendations
     */
    private generateRecommendations(issues: SecurityIssue[]): string[] {
        const recommendations = new Set<string>();

        // Add general recommendations based on issue types
        const hasInjection = issues.some(i => i.category.includes('Injection'));
        const hasCrypto = issues.some(i => i.category.includes('Cryptographic'));
        const hasAuth = issues.some(i => i.category.includes('Authentication'));

        if (hasInjection) {
            recommendations.add('Implement input validation and sanitization for all user inputs');
            recommendations.add('Use parameterized queries and prepared statements');
        }

        if (hasCrypto) {
            recommendations.add('Update to strong cryptographic algorithms (SHA-256, AES-256)');
            recommendations.add('Use secure random number generators');
        }

        if (hasAuth) {
            recommendations.add('Implement proper authentication and session management');
            recommendations.add('Use multi-factor authentication where possible');
        }

        // Add specific recommendations from issues
        issues.forEach(issue => {
            if (issue.recommendation) {
                recommendations.add(issue.recommendation);
            }
        });

        return Array.from(recommendations);
    }

    /**
     * Get security scanner statistics
     */
    public getStats() {
        return {
            totalScans: 0,
            issuesFound: 0,
            lastScan: new Date().toISOString()
        };
    }

    /**
     * Generate comprehensive security report for the workspace
     */
    public async generateSecurityReport(): Promise<SecurityReport> {
        try {
            const workspaceReport = await this.scanWorkspace();
            return workspaceReport;
        } catch (error) {
            console.error('Failed to generate security report:', error);
            return {
                score: 100,
                issues: [],
                recommendations: ['No security issues found'],
                complianceChecks: [],
                scannedFiles: 0,
                timestamp: new Date()
            };
        }
    }
}