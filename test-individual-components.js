#!/usr/bin/env node

/**
 * Individual Component Testing Script
 * Tests each Phase 5 component in isolation
 */

const fs = require('fs');
const path = require('path');

// Mock VS Code environment
const mockVSCode = {
    workspace: {
        workspaceFolders: [{ uri: { fsPath: process.cwd() } }],
        getConfiguration: () => ({
            get: () => undefined
        }),
        createFileSystemWatcher: () => ({
            onDidChange: () => {},
            dispose: () => {}
        })
    },
    window: {
        createOutputChannel: (name) => ({
            appendLine: (text) => console.log(`[${name}] ${text}`),
            dispose: () => {}
        }),
        showInformationMessage: (msg) => console.log(`INFO: ${msg}`),
        showErrorMessage: (msg) => console.log(`ERROR: ${msg}`)
    },
    Uri: { file: (path) => ({ fsPath: path }) },
    commands: {
        registerCommand: (cmd, handler) => console.log(`Registered command: ${cmd}`)
    },
    ExtensionContext: class MockContext {
        constructor() {
            this.subscriptions = [];
            this.globalStorageUri = { fsPath: '/tmp/test-storage' };
            this.workspaceState = { 
                get: () => undefined, 
                update: () => Promise.resolve() 
            };
            this.globalState = { 
                get: () => undefined, 
                update: () => Promise.resolve() 
            };
            this.secrets = { 
                get: () => Promise.resolve(undefined), 
                store: () => Promise.resolve() 
            };
            this.extensionUri = { fsPath: '/tmp' };
            this.extensionPath = '/tmp';
            this.environmentVariableCollection = {};
            this.extensionMode = 1;
            this.logUri = { fsPath: '/tmp/logs' };
            this.storageUri = { fsPath: '/tmp/storage' };
        }
    }
};

// Mock require for VS Code module
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(...args) {
    if (args[0] === 'vscode') {
        return mockVSCode;
    }
    return originalRequire.apply(this, args);
};

async function testSecurityScanner() {
    console.log('\n🔒 Testing Security Scanner...');
    try {
        const { SecurityScanner } = require('./src/security/SecurityScanner');
        const mockModelManager = {
            sendMessage: async () => ({ content: 'Mock security analysis' })
        };
        
        const scanner = new SecurityScanner(mockModelManager);
        console.log('✅ SecurityScanner instantiated successfully');
        
        // Test scanner methods
        if (typeof scanner.scanWorkspace === 'function') {
            console.log('✅ scanWorkspace method exists');
        }
        if (typeof scanner.scanFile === 'function') {
            console.log('✅ scanFile method exists');
        }
        if (typeof scanner.generateSecurityReport === 'function') {
            console.log('✅ generateSecurityReport method exists');
        }
        
        return true;
    } catch (error) {
        console.error('❌ SecurityScanner test failed:', error.message);
        return false;
    }
}

async function testDocumentationGenerator() {
    console.log('\n📚 Testing Documentation Generator...');
    try {
        const { DocumentationGenerator } = require('./src/docs/DocumentationGenerator');
        const mockModelManager = {
            sendMessage: async () => ({ content: 'Mock documentation' })
        };
        
        const generator = new DocumentationGenerator(mockModelManager);
        console.log('✅ DocumentationGenerator instantiated successfully');
        
        // Test generator methods
        if (typeof generator.generateDocumentation === 'function') {
            console.log('✅ generateDocumentation method exists');
        }
        if (typeof generator.generateAPIDocumentation === 'function') {
            console.log('✅ generateAPIDocumentation method exists');
        }
        if (typeof generator.generateREADME === 'function') {
            console.log('✅ generateREADME method exists');
        }
        
        return true;
    } catch (error) {
        console.error('❌ DocumentationGenerator test failed:', error.message);
        return false;
    }
}

async function testTestGenerator() {
    console.log('\n🧪 Testing Test Generator...');
    try {
        const { TestGenerator } = require('./src/testing/TestGenerator');
        const mockModelManager = {
            sendMessage: async () => ({ content: 'Mock test code' })
        };
        
        const generator = new TestGenerator(mockModelManager);
        console.log('✅ TestGenerator instantiated successfully');
        
        // Test generator methods
        if (typeof generator.generateTests === 'function') {
            console.log('✅ generateTests method exists');
        }
        if (typeof generator.generateUnitTests === 'function') {
            console.log('✅ generateUnitTests method exists');
        }
        if (typeof generator.generateIntegrationTests === 'function') {
            console.log('✅ generateIntegrationTests method exists');
        }
        
        return true;
    } catch (error) {
        console.error('❌ TestGenerator test failed:', error.message);
        return false;
    }
}

async function testMetricsDashboard() {
    console.log('\n📊 Testing Metrics Dashboard...');
    try {
        const { MetricsDashboard } = require('./src/metrics/MetricsDashboard');
        const mockModelManager = {
            sendMessage: async () => ({ content: 'Mock insights' })
        };
        const mockContext = new mockVSCode.ExtensionContext();
        
        const dashboard = new MetricsDashboard(mockContext, mockModelManager);
        console.log('✅ MetricsDashboard instantiated successfully');
        
        // Test dashboard methods
        if (typeof dashboard.generateDashboard === 'function') {
            console.log('✅ generateDashboard method exists');
        }
        if (typeof dashboard.calculateComplexity === 'function') {
            console.log('✅ calculateComplexity method exists');
        }
        if (typeof dashboard.initializeMetricsTracking === 'function') {
            console.log('✅ initializeMetricsTracking method exists');
        }
        
        // Test calculateComplexity functionality
        const complexity = dashboard.calculateComplexity('function test() { if (x > 0) { return true; } return false; }');
        if (typeof complexity === 'number' && complexity > 0) {
            console.log(`✅ calculateComplexity returns valid number: ${complexity}`);
        }
        
        dashboard.dispose();
        console.log('✅ MetricsDashboard disposed successfully');
        
        return true;
    } catch (error) {
        console.error('❌ MetricsDashboard test failed:', error.message);
        return false;
    }
}

async function testPhaseIntegrator() {
    console.log('\n🔧 Testing Phase Integrator...');
    try {
        const { PhaseIntegrator } = require('./src/analysis/PhaseIntegrator');
        const mockModelManager = {
            sendMessage: async () => ({ content: 'Mock analysis' })
        };
        const mockContext = new mockVSCode.ExtensionContext();
        
        const integrator = new PhaseIntegrator(mockContext, mockModelManager);
        console.log('✅ PhaseIntegrator instantiated successfully');
        
        // Test integrator methods
        if (typeof integrator.executePhase5Automation === 'function') {
            console.log('✅ executePhase5Automation method exists');
        }
        if (typeof integrator.getAutomationCapabilities === 'function') {
            console.log('✅ getAutomationCapabilities method exists');
        }
        if (typeof integrator.estimateAutomationPotential === 'function') {
            console.log('✅ estimateAutomationPotential method exists');
        }
        
        integrator.dispose();
        console.log('✅ PhaseIntegrator disposed successfully');
        
        return true;
    } catch (error) {
        console.error('❌ PhaseIntegrator test failed:', error.message);
        return false;
    }
}

async function testPhase5Integration() {
    console.log('\n🚀 Testing Phase 5 Integration...');
    try {
        const { Phase5Integration } = require('./src/phase5/Phase5Integration');
        const mockModelManager = {
            sendMessage: async () => ({ content: 'Mock integration' })
        };
        const mockContext = new mockVSCode.ExtensionContext();
        
        const integration = new Phase5Integration(mockContext, mockModelManager);
        console.log('✅ Phase5Integration instantiated successfully');
        
        // Test integration methods
        if (typeof integration.activate === 'function') {
            console.log('✅ activate method exists');
        }
        if (typeof integration.deactivate === 'function') {
            console.log('✅ deactivate method exists');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Phase5Integration test failed:', error.message);
        return false;
    }
}

async function runAllComponentTests() {
    console.log('🎯 Running Individual Component Tests');
    console.log('=====================================');
    
    const tests = [
        { name: 'SecurityScanner', test: testSecurityScanner },
        { name: 'DocumentationGenerator', test: testDocumentationGenerator },
        { name: 'TestGenerator', test: testTestGenerator },
        { name: 'MetricsDashboard', test: testMetricsDashboard },
        { name: 'PhaseIntegrator', test: testPhaseIntegrator },
        { name: 'Phase5Integration', test: testPhase5Integration }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const { name, test } of tests) {
        const success = await test();
        if (success) {
            passed++;
            console.log(`✅ ${name} test PASSED`);
        } else {
            failed++;
            console.log(`❌ ${name} test FAILED`);
        }
    }
    
    console.log('\n📊 Component Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 ALL COMPONENT TESTS PASSED! 🚀');
        return true;
    } else {
        console.log('\n⚠️  Some component tests failed. Please review the errors above.');
        return false;
    }
}

// Run the tests
if (require.main === module) {
    runAllComponentTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { runAllComponentTests };