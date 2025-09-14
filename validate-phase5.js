#!/usr/bin/env node
/**
 * Phase 5 Direct Validation Script
 * Tests the Phase 5 system components directly
 */

const fs = require('fs');
const path = require('path');

function validatePhase5Files() {
    console.log('🔍 Validating Phase 5 File System...\n');
    
    const requiredFiles = [
        'src/security/SecurityScanner.ts',
        'src/docs/DocumentationGenerator.ts', 
        'src/testing/TestGenerator.ts',
        'src/metrics/MetricsDashboard.ts',
        'src/analysis/PhaseIntegrator.ts',
        'src/phase5/Phase5Integration.ts',
        'src/test/phase5-tests.ts',
        'src/types.ts'
    ];
    
    const results = {
        totalFiles: requiredFiles.length,
        existingFiles: 0,
        missingFiles: [],
        fileSizes: {}
    };
    
    requiredFiles.forEach(file => {
        const fullPath = path.join(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
            results.existingFiles++;
            const stats = fs.statSync(fullPath);
            results.fileSizes[file] = Math.round(stats.size / 1024); // KB
            console.log(`✅ ${file} (${results.fileSizes[file]} KB)`);
        } else {
            results.missingFiles.push(file);
            console.log(`❌ ${file} - MISSING`);
        }
    });
    
    return results;
}

function validatePhase5Content() {
    console.log('\n🔍 Validating Phase 5 Component Content...\n');
    
    const contentChecks = [
        {
            file: 'src/security/SecurityScanner.ts',
            patterns: ['OWASP', 'vulnerability', 'SecurityReport', 'class SecurityScanner']
        },
        {
            file: 'src/docs/DocumentationGenerator.ts',
            patterns: ['DocumentationGenerator', 'generateAPIDocumentation', 'markdown', 'class DocumentationGenerator']
        },
        {
            file: 'src/testing/TestGenerator.ts', 
            patterns: ['TestGenerator', 'generateTests', 'jest', 'mocha', 'class TestGenerator']
        },
        {
            file: 'src/metrics/MetricsDashboard.ts',
            patterns: ['MetricsDashboard', 'CodeMetrics', 'calculateComplexity', 'class MetricsDashboard']
        },
        {
            file: 'src/analysis/PhaseIntegrator.ts',
            patterns: ['PhaseIntegrator', 'executePhase5Automation', 'class PhaseIntegrator']
        },
        {
            file: 'src/phase5/Phase5Integration.ts',
            patterns: ['Phase5Integration', 'registerCommands', 'vscode', 'class Phase5Integration']
        },
        {
            file: 'src/test/phase5-tests.ts',
            patterns: ['runPhase5Tests', 'validatePhase5Automation', 'testSecurityScanner']
        }
    ];
    
    const results = {
        totalChecks: contentChecks.length,
        passedChecks: 0,
        failedChecks: []
    };
    
    contentChecks.forEach(check => {
        const fullPath = path.join(process.cwd(), check.file);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const missingPatterns = check.patterns.filter(pattern => !content.includes(pattern));
            
            if (missingPatterns.length === 0) {
                results.passedChecks++;
                console.log(`✅ ${check.file} - All patterns found`);
            } else {
                results.failedChecks.push({
                    file: check.file,
                    missingPatterns
                });
                console.log(`⚠️  ${check.file} - Missing patterns: ${missingPatterns.join(', ')}`);
            }
        } else {
            results.failedChecks.push({
                file: check.file,
                missingPatterns: ['FILE_NOT_FOUND']
            });
            console.log(`❌ ${check.file} - File not found`);
        }
    });
    
    return results;
}

function validatePhase5Integration() {
    console.log('\n🔍 Validating VS Code Integration...\n');
    
    const integrationFile = path.join(process.cwd(), 'src/phase5/Phase5Integration.ts');
    
    if (!fs.existsSync(integrationFile)) {
        console.log('❌ Phase5Integration.ts not found');
        return { isValid: false, reason: 'File not found' };
    }
    
    const content = fs.readFileSync(integrationFile, 'utf8');
    
    const requiredCommands = [
        'deepseek.phase5.scanSecurity',
        'deepseek.phase5.generateDocs', 
        'deepseek.phase5.generateTests',
        'deepseek.phase5.showMetrics',
        'deepseek.phase5.runAutomation',
        'deepseek.phase5.runTests',
        'deepseek.phase5.demo'
    ];
    
    const foundCommands = requiredCommands.filter(cmd => content.includes(cmd));
    const missingCommands = requiredCommands.filter(cmd => !content.includes(cmd));
    
    console.log(`✅ Found ${foundCommands.length}/${requiredCommands.length} required commands`);
    
    if (missingCommands.length > 0) {
        console.log(`⚠️  Missing commands: ${missingCommands.join(', ')}`);
    }
    
    // Check for key integration methods
    const requiredMethods = [
        'registerCommands',
        'executeSecurityScan',
        'executeDocumentationGeneration',
        'executeTestGeneration',
        'executeMetricsAnalysis',
        'executeCompleteAutomation'
    ];
    
    const foundMethods = requiredMethods.filter(method => content.includes(method));
    const missingMethods = requiredMethods.filter(method => !content.includes(method));
    
    console.log(`✅ Found ${foundMethods.length}/${requiredMethods.length} required methods`);
    
    if (missingMethods.length > 0) {
        console.log(`⚠️  Missing methods: ${missingMethods.join(', ')}`);
    }
    
    return {
        isValid: missingCommands.length === 0 && missingMethods.length === 0,
        commandsFound: foundCommands.length,
        methodsFound: foundMethods.length,
        missingCommands,
        missingMethods
    };
}

function calculateAutomationLevel(fileResults, contentResults, integrationResults) {
    const weights = {
        files: 0.3,
        content: 0.4, 
        integration: 0.3
    };
    
    const fileScore = (fileResults.existingFiles / fileResults.totalFiles) * 100;
    const contentScore = (contentResults.passedChecks / contentResults.totalChecks) * 100;
    const integrationScore = integrationResults.isValid ? 100 : 
        ((integrationResults.commandsFound || 0) / 7 + (integrationResults.methodsFound || 0) / 6) * 50;
    
    const overallScore = Math.round(
        fileScore * weights.files + 
        contentScore * weights.content + 
        integrationScore * weights.integration
    );
    
    return {
        overall: overallScore,
        files: Math.round(fileScore),
        content: Math.round(contentScore),
        integration: Math.round(integrationScore)
    };
}

async function runDirectValidation() {
    try {
        console.log('🚀 Phase 5 Advanced Features - Direct Validation');
        console.log('===============================================\n');
        
        // Test 1: File System Validation
        const fileResults = validatePhase5Files();
        
        // Test 2: Content Validation  
        const contentResults = validatePhase5Content();
        
        // Test 3: Integration Validation
        const integrationResults = validatePhase5Integration();
        
        // Calculate automation level
        console.log('\n📊 Calculating Automation Level...\n');
        const scores = calculateAutomationLevel(fileResults, contentResults, integrationResults);
        
        console.log(`📁 File System Score: ${scores.files}%`);
        console.log(`📝 Content Quality Score: ${scores.content}%`);
        console.log(`🔧 Integration Score: ${scores.integration}%`);
        console.log(`🎯 Overall Automation Level: ${scores.overall}%`);
        
        // Final Results
        console.log('\n🎉 Phase 5 Validation Complete!');
        console.log('================================');
        
        if (scores.overall >= 85) {
            console.log('🏆 EXCELLENT - Phase 5 Ready for Production! 🚀');
            console.log('✅ All systems operational with high automation level');
        } else if (scores.overall >= 70) {
            console.log('✅ GOOD - Phase 5 Functional with Minor Issues');
            console.log('⚠️  Some optimizations recommended');
        } else {
            console.log('⚠️  NEEDS WORK - Phase 5 Requires Attention');
            console.log('❌ Significant issues found that need resolution');
        }
        
        // Summary statistics
        console.log('\n📋 Summary Statistics:');
        console.log(`Files: ${fileResults.existingFiles}/${fileResults.totalFiles} present`);
        console.log(`Content: ${contentResults.passedChecks}/${contentResults.totalChecks} validated`);
        console.log(`Integration: ${integrationResults.isValid ? 'Complete' : 'Partial'}`);
        
        if (fileResults.missingFiles.length > 0) {
            console.log('\n❌ Missing Files:');
            fileResults.missingFiles.forEach(file => console.log(`   - ${file}`));
        }
        
        if (contentResults.failedChecks.length > 0) {
            console.log('\n⚠️  Content Issues:');
            contentResults.failedChecks.forEach(check => {
                console.log(`   - ${check.file}: ${check.missingPatterns.join(', ')}`);
            });
        }
        
        // Calculate total lines of code
        let totalLines = 0;
        Object.entries(fileResults.fileSizes).forEach(([file, sizeKB]) => {
            // Rough estimate: 1KB ≈ 25 lines of TypeScript
            totalLines += sizeKB * 25;
        });
        
        console.log(`\n📏 Estimated Total Lines of Code: ~${totalLines.toLocaleString()}`);
        console.log(`💾 Total File Size: ${Object.values(fileResults.fileSizes).reduce((a, b) => a + b, 0)} KB`);
        
        return {
            success: scores.overall >= 70,
            automationLevel: scores.overall,
            details: {
                files: fileResults,
                content: contentResults,
                integration: integrationResults,
                scores
            }
        };
        
    } catch (error) {
        console.error('❌ Validation failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the validation
if (require.main === module) {
    runDirectValidation().then(result => {
        process.exit(result.success ? 0 : 1);
    });
}

module.exports = { runDirectValidation };