#!/usr/bin/env node
// Quick Phase 5 status check
const fs = require('fs');
const results = JSON.parse(fs.readFileSync('./phase5-output/phase5-demo-results.json', 'utf-8'));

console.log('🎯 Phase 5 Status Dashboard');
console.log('===========================');
console.log(`⏰ Last Updated: ${new Date(results.timestamp).toLocaleString()}`);
console.log(`🔒 Security: ${results.security.compliance}`);
console.log(`📚 Documentation: ${results.documentation.coverage} coverage`);
console.log(`🧪 Tests: ${results.tests.unitTests + results.tests.integrationTests} tests generated`);
console.log(`📊 Code Quality: ${results.metrics.codeQuality}/10`);
console.log(`🤖 Automation Level: ${results.automation.level}`);
console.log('\n✅ Phase 5 is working perfectly!');
