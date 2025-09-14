import * as vscode from 'vscode';
import { ModelManager } from '../ModelManager';
import { PhaseIntegrator } from '../analysis/PhaseIntegrator';
import { 
    runPhase5Tests, 
    validatePhase5Automation, 
    demoPhase5Automation 
} from '../test/phase5-tests';

/**
 * Phase 5 Advanced Features Integration
 * Integrates all Phase 5 automation components with the VS Code extension
 */
export class Phase5Integration {
    private modelManager: ModelManager;
    private phaseIntegrator: PhaseIntegrator;
    private outputChannel: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext, modelManager: ModelManager) {
        this.modelManager = modelManager;
        this.phaseIntegrator = new PhaseIntegrator(context, modelManager);
        this.outputChannel = vscode.window.createOutputChannel('Phase 5 Advanced Features');
        
        this.registerCommands(context);
        this.initializePhase5(context);
    }

    /**
     * Register Phase 5 commands with VS Code
     */
    private registerCommands(context: vscode.ExtensionContext): void {
        // Security scanning command
        const securityScanCommand = vscode.commands.registerCommand(
            'deepseek.phase5.scanSecurity',
            () => this.executeSecurityScan()
        );

        // Documentation generation command
        const generateDocsCommand = vscode.commands.registerCommand(
            'deepseek.phase5.generateDocs',
            () => this.executeDocumentationGeneration()
        );

        // Test generation command
        const generateTestsCommand = vscode.commands.registerCommand(
            'deepseek.phase5.generateTests',
            () => this.executeTestGeneration()
        );

        // Metrics dashboard command
        const metricsCommand = vscode.commands.registerCommand(
            'deepseek.phase5.showMetrics',
            () => this.executeMetricsAnalysis()
        );

        // Complete automation workflow command
        const automationCommand = vscode.commands.registerCommand(
            'deepseek.phase5.runAutomation',
            () => this.executeCompleteAutomation()
        );

        // Test Phase 5 system command
        const testCommand = vscode.commands.registerCommand(
            'deepseek.phase5.runTests',
            () => this.executeSystemTests()
        );

        // Demo automation command
        const demoCommand = vscode.commands.registerCommand(
            'deepseek.phase5.demo',
            () => this.executeDemo()
        );

        // Register all commands
        context.subscriptions.push(
            securityScanCommand,
            generateDocsCommand,
            generateTestsCommand,
            metricsCommand,
            automationCommand,
            testCommand,
            demoCommand
        );

        this.outputChannel.appendLine('✅ Phase 5 commands registered successfully');
    }

    /**
     * Initialize Phase 5 system
     */
    private async initializePhase5(context: vscode.ExtensionContext): Promise<void> {
        try {
            this.outputChannel.appendLine('🚀 Initializing Phase 5 Advanced Features...');
            
            // Validate automation system
            const validation = validatePhase5Automation();
            this.outputChannel.appendLine(`📊 Automation Completion: ${validation.completionPercentage}%`);
            
            if (validation.isComplete) {
                this.outputChannel.appendLine('✅ Phase 5 automation system fully operational');
                
                // Show welcome message
                vscode.window.showInformationMessage(
                    '🎉 Phase 5 Advanced Features are now available! Access via Command Palette (Ctrl+Shift+P) → "DeepSeek Phase 5"',
                    'Show Commands',
                    'Run Demo'
                ).then(selection => {
                    if (selection === 'Show Commands') {
                        vscode.commands.executeCommand('workbench.action.showCommands');
                    } else if (selection === 'Run Demo') {
                        this.executeDemo();
                    }
                });
            } else {
                this.outputChannel.appendLine('⚠️ Phase 5 system partially initialized');
                validation.missingComponents.forEach(component => {
                    this.outputChannel.appendLine(`  Missing: ${component}`);
                });
            }
            
        } catch (error) {
            this.outputChannel.appendLine(`❌ Phase 5 initialization failed: ${error}`);
            vscode.window.showErrorMessage(`Phase 5 initialization failed: ${error}`);
        }
    }

    /**
     * Execute security scanning
     */
    private async executeSecurityScan(): Promise<void> {
        try {
            const workspacePath = this.getWorkspacePath();
            if (!workspacePath) {
                return;
            }

            this.outputChannel.show();
            this.outputChannel.appendLine('🔒 Starting security scan...');
            
            const result = await this.phaseIntegrator.executePhase5Automation(workspacePath);
            
            this.outputChannel.appendLine(`✅ Security scan completed:`);
            this.outputChannel.appendLine(`  • Issues found: ${result.security.issues.length}`);
            this.outputChannel.appendLine(`  • Security score: ${result.security.score}/100`);
            this.outputChannel.appendLine(`  • Recommendations: ${result.security.recommendations.length}`);
            
            // Show critical issues
            const criticalIssues = result.security.issues.filter(i => i.severity === 'critical');
            if (criticalIssues.length > 0) {
                vscode.window.showWarningMessage(
                    `Found ${criticalIssues.length} critical security issues!`,
                    'View Details'
                ).then(selection => {
                    if (selection === 'View Details') {
                        this.outputChannel.show();
                    }
                });
            } else {
                vscode.window.showInformationMessage('🔒 Security scan completed - no critical issues found!');
            }
            
        } catch (error) {
            this.outputChannel.appendLine(`❌ Security scan failed: ${error}`);
            vscode.window.showErrorMessage(`Security scan failed: ${error}`);
        }
    }

    /**
     * Execute documentation generation
     */
    private async executeDocumentationGeneration(): Promise<void> {
        try {
            const workspacePath = this.getWorkspacePath();
            if (!workspacePath) {
                return;
            }

            this.outputChannel.show();
            this.outputChannel.appendLine('📚 Generating documentation...');
            
            const result = await this.phaseIntegrator.executePhase5Automation(workspacePath);
            
            this.outputChannel.appendLine(`✅ Documentation generated:`);
            result.documentation.forEach(doc => {
                this.outputChannel.appendLine(`  • ${doc.type}: ${doc.content.length} characters`);
            });
            
            vscode.window.showInformationMessage(
                `📚 Generated ${result.documentation.length} documentation files!`,
                'View Output'
            ).then(selection => {
                if (selection === 'View Output') {
                    this.outputChannel.show();
                }
            });
            
        } catch (error) {
            this.outputChannel.appendLine(`❌ Documentation generation failed: ${error}`);
            vscode.window.showErrorMessage(`Documentation generation failed: ${error}`);
        }
    }

    /**
     * Execute test generation
     */
    private async executeTestGeneration(): Promise<void> {
        try {
            const workspacePath = this.getWorkspacePath();
            if (!workspacePath) {
                return;
            }

            this.outputChannel.show();
            this.outputChannel.appendLine('🧪 Generating tests...');
            
            const result = await this.phaseIntegrator.executePhase5Automation(workspacePath);
            
            this.outputChannel.appendLine(`✅ Tests generated:`);
            result.tests.forEach(test => {
                this.outputChannel.appendLine(`  • ${test.type}: ${test.coverage.statements}% coverage`);
            });
            
            const avgCoverage = result.tests.reduce((sum, t) => sum + t.coverage.statements, 0) / result.tests.length;
            
            vscode.window.showInformationMessage(
                `🧪 Generated ${result.tests.length} test files with ${avgCoverage.toFixed(1)}% average coverage!`,
                'View Output'
            ).then(selection => {
                if (selection === 'View Output') {
                    this.outputChannel.show();
                }
            });
            
        } catch (error) {
            this.outputChannel.appendLine(`❌ Test generation failed: ${error}`);
            vscode.window.showErrorMessage(`Test generation failed: ${error}`);
        }
    }

    /**
     * Execute metrics analysis
     */
    private async executeMetricsAnalysis(): Promise<void> {
        try {
            const workspacePath = this.getWorkspacePath();
            if (!workspacePath) {
                return;
            }

            this.outputChannel.show();
            this.outputChannel.appendLine('📊 Analyzing code metrics...');
            
            const result = await this.phaseIntegrator.executePhase5Automation(workspacePath);
            
            this.outputChannel.appendLine(`✅ Metrics analysis completed:`);
            this.outputChannel.appendLine(`  • Files analyzed: ${result.metrics.codeMetrics.totalFiles}`);
            this.outputChannel.appendLine(`  • Total lines: ${result.metrics.codeMetrics.totalLines}`);
            this.outputChannel.appendLine(`  • Quality score: ${result.metrics.qualityMetrics.qualityScore}/100`);
            this.outputChannel.appendLine(`  • Test coverage: ${result.metrics.qualityMetrics.testCoverage}%`);
            this.outputChannel.appendLine(`  • Technical debt: ${result.metrics.qualityMetrics.technicalDebt} hours`);
            
            // Show insights
            if (result.metrics.insights.length > 0) {
                this.outputChannel.appendLine('\n💡 Key Insights:');
                result.metrics.insights.forEach(insight => {
                    this.outputChannel.appendLine(`  • ${insight}`);
                });
            }
            
            vscode.window.showInformationMessage(
                `📊 Code analysis complete! Quality score: ${result.metrics.qualityMetrics.qualityScore}/100`,
                'View Details'
            ).then(selection => {
                if (selection === 'View Details') {
                    this.outputChannel.show();
                }
            });
            
        } catch (error) {
            this.outputChannel.appendLine(`❌ Metrics analysis failed: ${error}`);
            vscode.window.showErrorMessage(`Metrics analysis failed: ${error}`);
        }
    }

    /**
     * Execute complete automation workflow
     */
    private async executeCompleteAutomation(): Promise<void> {
        try {
            const workspacePath = this.getWorkspacePath();
            if (!workspacePath) {
                return;
            }

            this.outputChannel.show();
            this.outputChannel.appendLine('🚀 Starting complete Phase 5 automation workflow...');
            
            const result = await this.phaseIntegrator.executePhase5Automation(workspacePath);
            
            // Display comprehensive results
            this.outputChannel.appendLine('\n🎉 Complete automation workflow finished!');
            this.outputChannel.appendLine('\n📋 Results Summary:');
            this.outputChannel.appendLine(`  🔒 Security: ${result.security.issues.length} issues, ${result.security.score}/100 score`);
            this.outputChannel.appendLine(`  📚 Documentation: ${result.documentation.length} files generated`);
            this.outputChannel.appendLine(`  🧪 Tests: ${result.tests.length} test files created`);
            this.outputChannel.appendLine(`  📊 Quality: ${result.metrics.qualityMetrics.qualityScore}/100 score`);
            
            // Show executive summary
            this.outputChannel.appendLine('\n📊 Executive Summary:');
            this.outputChannel.appendLine(result.summary);
            
            vscode.window.showInformationMessage(
                '🎉 Phase 5 complete automation finished successfully!',
                'View Results',
                'Open Dashboard'
            ).then(selection => {
                if (selection === 'View Results') {
                    this.outputChannel.show();
                } else if (selection === 'Open Dashboard') {
                    // Future: Open metrics dashboard webview
                    this.outputChannel.show();
                }
            });
            
        } catch (error) {
            this.outputChannel.appendLine(`❌ Complete automation failed: ${error}`);
            vscode.window.showErrorMessage(`Complete automation failed: ${error}`);
        }
    }

    /**
     * Execute system tests
     */
    private async executeSystemTests(): Promise<void> {
        try {
            this.outputChannel.show();
            this.outputChannel.appendLine('🧪 Running Phase 5 system tests...');
            
            const testResults = await runPhase5Tests(this.modelManager);
            
            this.outputChannel.appendLine('\n📋 Test Results:');
            testResults.results.forEach(result => {
                this.outputChannel.appendLine(`  ${result}`);
            });
            
            const successRate = Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100);
            this.outputChannel.appendLine(`\n📊 Success Rate: ${successRate}%`);
            
            if (testResults.failed === 0) {
                vscode.window.showInformationMessage(
                    `🎉 All Phase 5 tests passed! (${testResults.passed}/${testResults.passed + testResults.failed})`,
                    'View Details'
                ).then(selection => {
                    if (selection === 'View Details') {
                        this.outputChannel.show();
                    }
                });
            } else {
                vscode.window.showWarningMessage(
                    `⚠️ ${testResults.failed} tests failed. Success rate: ${successRate}%`,
                    'View Details'
                ).then(selection => {
                    if (selection === 'View Details') {
                        this.outputChannel.show();
                    }
                });
            }
            
        } catch (error) {
            this.outputChannel.appendLine(`❌ System tests failed: ${error}`);
            vscode.window.showErrorMessage(`System tests failed: ${error}`);
        }
    }

    /**
     * Execute automation demo
     */
    private async executeDemo(): Promise<void> {
        try {
            this.outputChannel.show();
            this.outputChannel.appendLine('🎬 Starting Phase 5 automation demo...');
            
            await demoPhase5Automation(this.modelManager);
            
            vscode.window.showInformationMessage(
                '🎬 Phase 5 automation demo completed! Check the output for details.',
                'View Output'
            ).then(selection => {
                if (selection === 'View Output') {
                    this.outputChannel.show();
                }
            });
            
        } catch (error) {
            this.outputChannel.appendLine(`❌ Demo failed: ${error}`);
            vscode.window.showErrorMessage(`Demo failed: ${error}`);
        }
    }

    /**
     * Get current workspace path
     */
    private getWorkspacePath(): string | undefined {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder is open');
            return undefined;
        }
        return workspaceFolders[0].uri.fsPath;
    }

    /**
     * Get Phase 5 status information
     */
    public getStatus(): {
        isActive: boolean;
        automationLevel: number;
        featuresAvailable: string[];
    } {
        const validation = validatePhase5Automation();
        const capabilities = this.phaseIntegrator.getAutomationCapabilities();
        
        const featuresAvailable = [
            ...capabilities.security,
            ...capabilities.documentation,
            ...capabilities.testing,
            ...capabilities.metrics
        ];

        return {
            isActive: validation.isComplete,
            automationLevel: validation.completionPercentage,
            featuresAvailable
        };
    }

    /**
     * Activate Phase 5 system
     */
    public async activate(): Promise<void> {
        try {
            this.outputChannel.appendLine('🚀 Activating Phase 5 Advanced Features...');
            
            // Initialize all Phase 5 components
            const workspacePath = this.getWorkspacePath();
            if (workspacePath) {
                await this.phaseIntegrator.executePhase5Automation(workspacePath);
            }
            
            this.outputChannel.appendLine('✅ Phase 5 system activated successfully');
            vscode.window.showInformationMessage('Phase 5 Advanced Features activated!');
        } catch (error) {
            this.outputChannel.appendLine(`❌ Failed to activate Phase 5: ${error}`);
            vscode.window.showErrorMessage(`Failed to activate Phase 5: ${error}`);
            throw error;
        }
    }

    /**
     * Deactivate Phase 5 system
     */
    public async deactivate(): Promise<void> {
        try {
            this.outputChannel.appendLine('🔄 Deactivating Phase 5 Advanced Features...');
            
            // Clean up resources and state
            this.dispose();
            
            this.outputChannel.appendLine('✅ Phase 5 system deactivated successfully');
        } catch (error) {
            this.outputChannel.appendLine(`❌ Failed to deactivate Phase 5: ${error}`);
            console.error('Phase 5 deactivation error:', error);
        }
    }

    /**
     * Dispose Phase 5 resources
     */
    public dispose(): void {
        this.phaseIntegrator.dispose();
        this.outputChannel.dispose();
    }
}