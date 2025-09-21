# 🤖 HOILTD DeepSeek Code Companion

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/hoiltd.hoiltd-deepseek-code-companion)](https://marketplace.visualstudio.com/items?itemName=hoiltd.hoiltd-deepseek-code-companion)
[![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/hoiltd.hoiltd-deepseek-code-companion)](https://marketplace.visualstudio.com/items?itemName=hoiltd.hoiltd-deepseek-code-companion)
[![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/hoiltd.hoiltd-deepseek-code-companion)](https://marketplace.visualstudio.com/items?itemName=hoiltd.hoiltd-deepseek-code-companion)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Your multi-model AI coding companion for VS Code.** Chat with DeepSeek, OpenRouter's 100+ models (GPT-4, Claude, Gemma), and enjoy workspace-aware AI assistance with real-time cost tracking plus advanced Phase 5 automation features.

> 🎉 **Latest:** Multi-model architecture with Phase 5 automation system - security scanning, documentation generation, test creation, and code metrics!

## 🎯 **Current Status & Features**

| Phase | Status | Features | Completion |
|-------|--------|----------|------------|
| **Foundation** | ✅ **Complete** | Chat interface, workspace analysis | 100% |
| **Multi-Model** | ✅ **Complete** | OpenRouter integration, 100+ models, cost tracking | 100% |
| **Context Enhancement** | ✅ **Complete** | Universal workspace context, file access, smart greetings | 100% |
| **Performance & UX** | ✅ **Complete** | Error handling, caching, response optimization | 100% |
| **Phase 5 Automation** | ✅ **LIVE** | Security scanning, documentation gen, test creation, metrics | 100% |

## ✨ **What Makes This Extension Unique**

Unlike other AI coding extensions that lock you into a single provider, HOILTD DeepSeek Code Companion offers:

| Feature | Our Extension | GitHub Copilot | ChatGPT Extensions | Claude Extensions |
|---------|---------------|----------------|--------------------|-------------------|
| **Multiple AI Models** | ✅ 100+ models | ❌ GPT only | ❌ OpenAI only | ❌ Anthropic only |
| **Cost Transparency** | ✅ Real-time tracking | ❌ Hidden costs | ❌ No tracking | ❌ No tracking |
| **Workspace Context** | ✅ Universal support | ✅ Limited | ❌ Basic chat | ❌ Basic chat |
| **Automation Suite** | ✅ Phase 5 system | ❌ No automation | ❌ No automation | ❌ No automation |
| **Security Scanning** | ✅ OWASP compliance | ❌ None | ❌ None | ❌ None |
| **Provider Freedom** | ✅ Multi-provider | ❌ GitHub locked | ❌ OpenAI locked | ❌ Anthropic locked |

## 🚀 **Core Features**

### 💬 **Multi-Model AI Chat**
- **DeepSeek Integration**: Direct access to latest DeepSeek models
- **100+ OpenRouter Models**: GPT-4, Claude, Gemma, Llama, and more
- **Universal Workspace Intelligence**: All AI models understand your project structure
- **Smart Context Injection**: Automatic workspace context for relevant queries
- **Cost Management**: Real-time tracking with daily spending limits

### 🤖 **Phase 5 Automation System**
The extension's standout feature - real automation that actually works:

#### 🔒 **Security Scanner** 
```
🔒 SECURITY SCAN RESULTS:
✅ No SQL injection vulnerabilities found
✅ No XSS vulnerabilities detected
⚠️  Found 1 potential hardcoded secret in config file
✅ OWASP Top 10 compliance: 9/10 passed
```

**Advanced Security Features:**
- **OWASP Top 10 2021 Compliance**: Full coverage of all 10 categories
  - A01: Broken Access Control
  - A02: Cryptographic Failures  
  - A03: Injection (SQL, NoSQL, LDAP, OS)
  - A04: Insecure Design
  - A05: Security Misconfiguration
  - A06: Vulnerable and Outdated Components
  - A07: Identification and Authentication Failures
  - A08: Software and Data Integrity Failures
  - A09: Security Logging and Monitoring Failures
  - A10: Server-Side Request Forgery (SSRF)

- **Pattern Detection Engine**: Detects 50+ vulnerability patterns
  - SQL injection in queries and string concatenation
  - XSS vulnerabilities in DOM manipulation
  - Hardcoded secrets, passwords, and API keys
  - Weak cryptographic algorithms (MD5, SHA1, DES, RC4)
  - Path traversal and file inclusion vulnerabilities
  - Command injection and eval() usage
  - Insecure random number generation

- **AI-Powered Analysis**: Uses AI models to understand context and reduce false positives
- **Remediation Suggestions**: Provides specific code fixes for each vulnerability
- **Compliance Reporting**: Generates reports for security audits

#### 📚 **Documentation Generator**
```
📚 DOCUMENTATION GENERATED:
✅ API documentation created (12 endpoints documented)
✅ README.md updated with latest features
✅ Architecture documentation generated
✅ Code comments analyzed and improved
```

**Documentation Capabilities:**
- **README Generation**: Automatically creates comprehensive README files
  - Project overview and purpose
  - Installation and setup instructions
  - Usage examples and API documentation
  - Configuration options
  - Contributing guidelines

- **API Documentation**: Extracts and documents APIs
  - REST endpoints with request/response examples
  - Function signatures and parameters
  - Class and interface documentation
  - Type definitions and schemas

- **Architecture Documentation**: Analyzes code structure
  - Component relationship diagrams
  - Data flow documentation
  - Design pattern identification
  - Dependency analysis

- **Code Enhancement**: Improves existing documentation
  - Adds missing JSDoc comments
  - Updates outdated documentation
  - Standardizes documentation format

#### 🧪 **Test Generator**
```
🧪 TESTS GENERATED:
✅ 24 unit tests created for core functions
✅ 8 integration tests generated
✅ Test coverage: 89% (target: 80%)
✅ Test suite ready for execution
```

**Testing Framework Support:**
- **Unit Tests**: Comprehensive test coverage
  - Jest, Mocha, Jasmine, Vitest support
  - Mocking strategies (auto, manual, or none)
  - Assertion library detection
  - Edge case and error condition testing

- **Integration Tests**: End-to-end workflow testing
  - API endpoint testing
  - Database integration tests
  - External service mocking
  - User workflow simulation

- **Test Coverage Analysis**: Real coverage metrics
  - Statement, branch, and function coverage
  - Line-by-line coverage reports
  - Coverage threshold validation
  - Missing test identification

- **Framework Detection**: Automatically detects project setup
  - TypeScript/JavaScript support
  - Test runner configuration
  - Build system integration
  - CI/CD pipeline compatibility

#### 📊 **Code Metrics Dashboard**
```
📊 CODE METRICS:
✅ Code quality score: 8.7/10
✅ Cyclomatic complexity: Average 3.2 (Good)
✅ Technical debt: Low (12 hours estimated)
✅ Maintainability index: 85/100
```

**Comprehensive Code Analysis:**
- **Quality Metrics**: Multi-dimensional quality assessment
  - Overall quality score (0-10 scale)
  - Maintainability index calculation
  - Code smell detection and categorization
  - Best practice compliance checking

- **Complexity Analysis**: Detailed complexity metrics
  - Cyclomatic complexity per function/method
  - Cognitive complexity measurement
  - Nesting depth analysis
  - Function length and parameter count

- **Technical Debt Tracking**: Quantified technical debt
  - Time-based debt estimation (hours)
  - Debt categorization (design, code, documentation)
  - Priority scoring for debt items
  - Refactoring recommendations

- **Performance Insights**: Performance-related metrics
  - Bundle size analysis
  - Dependency complexity
  - Load time estimation
  - Optimization opportunities

- **Trend Analysis**: Historical tracking
  - Quality trends over time
  - Complexity evolution
  - Debt accumulation patterns
  - Improvement recommendations

## 📋 **Quick Start**

### 1. **Installation**
1. Open VS Code → Extensions (Ctrl+Shift+X)
2. Search "HOILTD DeepSeek Code Companion"
3. Click Install

### 2. **API Keys Setup**

⚠️ **Security Note**: Keep your API keys secure! Never commit them to version control.

#### **Method 1: VS Code Settings (Recommended)**
1. Copy `.vscode/settings.example.json` to `.vscode/settings.json`
2. Replace placeholder values with your actual API keys:

```json
{
  "deepseekCodeCompanion.deepseekApiKey": "sk-your-deepseek-key-here",
  "deepseekCodeCompanion.openrouterApiKey": "sk-or-your-openrouter-key",
  "deepseekCodeCompanion.dailyCostLimit": 5,
  "deepseekCodeCompanion.showCostInChat": true
}
```

#### **Method 2: Global Settings** 
Open VS Code Settings (Ctrl/Cmd + ,) and search for "deepseek" to configure globally.

#### **Get Your API Keys:**
- **DeepSeek API**: Get at [platform.deepseek.com](https://platform.deepseek.com/)
- **OpenRouter API** (optional): Get at [openrouter.ai](https://openrouter.ai/) for 100+ models

### 3. **Start Using**
- **Chat**: Click DeepSeek icon in Activity Bar
- **Phase 5**: Use Command Palette (Ctrl+Shift+P) → "DeepSeek: Phase 5"

## � **Complete Command Reference**

### **Chat Commands**
| Command | Description | Usage |
|---------|-------------|-------|
| `DeepSeek: Focus Chat` | Opens the chat interface | Click DeepSeek icon or use command palette |

### **Phase 5 Automation Commands**

#### **Security & Compliance**
```bash
DeepSeek: Phase 5 - Security Scan
```
**What it does:**
- Scans all project files for security vulnerabilities
- Checks OWASP Top 10 compliance
- Detects hardcoded secrets and weak cryptography
- Provides detailed remediation suggestions

**Output Example:**
```
🔒 Security Scan Results:
📁 Files scanned: 47
🛡️  OWASP compliance: 9/10 categories passed
⚠️  Issues found: 3 medium, 1 low
🔧 Recommendations: 4 actionable fixes provided
```

#### **Documentation Generation**
```bash
DeepSeek: Phase 5 - Generate Documentation
```
**What it does:**
- Analyzes code structure and APIs
- Generates comprehensive documentation
- Updates existing README files
- Creates architecture documentation

**Output Example:**
```
📚 Documentation Generated:
✅ README.md: Updated with 12 new sections
✅ API.md: 8 endpoints documented
✅ ARCHITECTURE.md: Component diagrams created
✅ JSDoc: 45 functions documented
```

#### **Test Suite Generation**
```bash
DeepSeek: Phase 5 - Generate Tests
```
**What it does:**
- Creates unit and integration tests
- Supports Jest, Mocha, Vitest frameworks
- Analyzes code coverage gaps
- Generates realistic test data

**Output Example:**
```
🧪 Test Generation Complete:
✅ Unit tests: 32 tests for 28 functions
✅ Integration tests: 8 workflow tests
✅ Coverage: 87% (target: 80%)
✅ Framework: Jest with TypeScript
```

#### **Code Quality Analysis**
```bash
DeepSeek: Phase 5 - Show Metrics Dashboard
```
**What it does:**
- Comprehensive code quality assessment
- Complexity and maintainability analysis
- Technical debt calculation
- Performance insights

**Output Example:**
```
📊 Code Quality Dashboard:
🎯 Overall Quality: 8.7/10
🔄 Complexity: Average 3.2 (Good)
⏱️  Technical Debt: 12 hours
🏗️  Maintainability: 85/100
📈 Trends: Quality improving (+0.3 this week)
```

#### **Complete Automation Workflow**
```bash
DeepSeek: Phase 5 - Run Automation
```
**What it does:**
- Runs all Phase 5 components in sequence
- Provides comprehensive project analysis
- Generates executive summary report
- Recommends next steps

**Full Workflow:**
1. **Security Scan** → Vulnerability assessment
2. **Documentation** → Auto-generate docs  
3. **Test Generation** → Create test suites
4. **Metrics Analysis** → Quality assessment
5. **Executive Summary** → Actionable insights

#### **System Validation**
```bash
DeepSeek: Phase 5 - Run Tests
```
**What it does:**
- Validates all Phase 5 components
- Runs internal system tests
- Verifies API connectivity
- Reports system health

#### **Feature Demonstration**
```bash
DeepSeek: Phase 5 - Demo Features
```
**What it does:**
- Showcases all automation capabilities
- Runs non-destructive demonstrations
- Perfect for first-time users
- Shows expected outputs and workflows

## 💡 **Best Use Cases**

### **🎯 Perfect for developers who want:**
- Freedom to choose the best AI model for each task
- Transparency in AI costs and usage  
- Deep workspace understanding across all models
- Real automation beyond basic chat
- Professional code analysis and documentation

### **🚀 Ideal for projects needing:**
- Security compliance and vulnerability scanning
- Automated documentation generation
- Comprehensive test coverage
- Code quality monitoring and improvement

## ⚙️ **Complete Configuration Guide**

### **Core API Settings**
```json
{
  "deepseekCodeCompanion.deepseekApiKey": "sk-your-deepseek-key-here",
  "deepseekCodeCompanion.openrouterApiKey": "sk-or-your-openrouter-key",
  "deepseekCodeCompanion.defaultModel": "deepseek-chat"
}
```

### **Cost Management**
```json
{
  "deepseekCodeCompanion.dailyCostLimit": 5.0,
  "deepseekCodeCompanion.showCostInChat": true,
  "deepseekCodeCompanion.autoSwitchToDeepSeek": true
}
```

### **Advanced Phase 5 Configuration**
```json
{
  "deepseekCodeCompanion.securityLevel": "high",
  "deepseekCodeCompanion.documentationStyle": "detailed",
  "deepseekCodeCompanion.testingFramework": "auto-detect",
  "deepseekCodeCompanion.metricsTracking": true,
  "deepseekCodeCompanion.automationLevel": "full"
}
```

### **Security Scanner Settings**
```json
{
  "deepseekCodeCompanion.security": {
    "enableOWASPScanning": true,
    "checkHardcodedSecrets": true,
    "validateCrypto": true,
    "excludePatterns": ["*.test.js", "node_modules/**"],
    "customRules": []
  }
}
```

### **Documentation Generator Settings**
```json
{
  "deepseekCodeCompanion.documentation": {
    "autoUpdateReadme": true,
    "generateApiDocs": true,
    "includeArchitecture": true,
    "outputFormat": "markdown",
    "includeExamples": true
  }
}
```

### **Test Generator Settings**
```json
{
  "deepseekCodeCompanion.testing": {
    "framework": "jest",
    "coverage": true,
    "mockStrategy": "auto",
    "includeIntegration": true,
    "testFilePattern": "*.test.ts"
  }
}
```

### **Metrics Dashboard Settings**
```json
{
  "deepseekCodeCompanion.metrics": {
    "trackingEnabled": true,
    "updateInterval": 3600,
    "qualityThreshold": 7.0,
    "complexityThreshold": 5,
    "maxHistoryPoints": 100
  }
}
```

### **Model-Specific Configuration**
```json
{
  "deepseekCodeCompanion.models": {
    "deepseek-chat": {
      "maxTokens": 8192,
      "temperature": 0.7,
      "preferredFor": ["coding", "analysis"]
    },
    "gpt-4": {
      "maxTokens": 4096,
      "temperature": 0.5,
      "preferredFor": ["documentation", "creative"]
    }
  }
}
```

### **Workspace Integration**
```json
{
  "deepseekCodeCompanion.workspace": {
    "autoContextInjection": true,
    "maxContextSize": 10000,
    "includeGitInfo": true,
    "scanNodeModules": false,
    "preferredLanguages": ["typescript", "javascript", "python"]
  }
}
```

### **UI and UX Settings**
```json
{
  "deepseekCodeCompanion.ui": {
    "showTypingIndicator": true,
    "enableNotifications": true,
    "autoOpenChat": false,
    "themeSyncing": true
  }
}
```

## 🛠️ **System Requirements**

- **VS Code**: 1.74.0 or higher
- **Internet**: Required for AI API access  
- **Node.js**: 16+ (for Phase 5 features)
- **Storage**: ~130KB extension size

## 🔧 **Comprehensive Troubleshooting**

### **Installation Issues**

**❌ Extension Not Loading**
- **Symptom**: DeepSeek icon missing from Activity Bar
- **Solution**: 
  1. Check VS Code version (requires 1.103.0+)
  2. Restart VS Code completely
  3. Reinstall extension: `code --uninstall-extension hoiltd.deepseek-code-companion && code --install-extension hoiltd.deepseek-code-companion`

**❌ Multiple Extension Versions**
- **Symptom**: Conflicting DeepSeek extensions installed
- **Solution**: 
  ```bash
  code --list-extensions | grep deepseek
  # Uninstall old versions, keep latest only
  ```

### **API Key Configuration**

**❌ "No API Key Configured" Error**
- **Symptom**: Chat shows "API key not configured"
- **Solution**: 
  1. Open VS Code Settings (Ctrl/Cmd + ,)
  2. Search "deepseek"
  3. Add your API key: `deepseekCodeCompanion.deepseekApiKey`
  4. Restart VS Code

**❌ "Invalid API Key" Error**
- **Symptom**: Authentication errors in chat
- **Solution**: 
  1. Verify key at [platform.deepseek.com](https://platform.deepseek.com/)
  2. Check for extra spaces or characters
  3. Test with curl: `curl -H "Authorization: Bearer YOUR_KEY" https://api.deepseek.com/v1/models`

**❌ "Daily Limit Exceeded"**
- **Symptom**: "Daily cost limit reached" message
- **Solution**: 
  1. Check usage: Settings → `deepseekCodeCompanion.dailyCostLimit`
  2. Increase limit or wait for reset at midnight
  3. Use cost-effective models for testing

### **Chat Interface Issues**

**❌ Chat Not Responding**
- **Symptom**: Messages sent but no response
- **Solutions**: 
  1. Check internet connection
  2. Verify API key validity
  3. Check VS Code Developer Console (Help → Toggle Developer Tools)
  4. Look for errors in Output → DeepSeek Code Companion

**❌ "No Models Available" Error**
- **Symptom**: Model dropdown empty
- **Solution**: 
  1. Ensure API keys are configured
  2. Check network connectivity
  3. Wait 30 seconds for model loading
  4. Restart extension: Command Palette → "Developer: Reload Window"

**❌ Context Not Working**
- **Symptom**: AI doesn't see workspace files
- **Solution**: 
  1. Open a workspace folder (File → Open Folder)
  2. Check workspace permissions
  3. Verify files aren't in .gitignore or node_modules
  4. Test with: "Can you see my workspace?"

### **Phase 5 Automation Issues**

**❌ "Phase 5 Not Available"**
- **Symptom**: Phase 5 commands missing from Command Palette
- **Solution**: 
  1. Update to latest extension version
  2. Check VS Code version compatibility
  3. Restart VS Code
  4. Verify workspace is open

**❌ Security Scan Failing**
- **Symptom**: Security scan shows errors or no results
- **Solutions**: 
  1. Ensure workspace contains code files
  2. Check file permissions
  3. Verify supported languages (JS/TS/Python/Java/C#)
  4. Review Output → DeepSeek Code Companion for errors

**❌ Documentation Generation Empty**
- **Symptom**: No documentation generated
- **Solutions**: 
  1. Ensure code has functions/classes to document
  2. Check if files are readable
  3. Verify API key has sufficient quota
  4. Try on smaller code samples first

**❌ Test Generation Not Working**
- **Symptom**: No tests created
- **Solutions**: 
  1. Verify testing framework is installed (Jest/Mocha)
  2. Check package.json for test dependencies
  3. Ensure source files have functions to test
  4. Review test file output location

### **Performance Issues**

**❌ Slow Response Times**
- **Symptom**: Long delays in chat responses
- **Solutions**: 
  1. Try faster models (deepseek-chat vs GPT-4)
  2. Reduce context size in settings
  3. Check network latency
  4. Use caching: Enable response optimization

**❌ High Token Usage**
- **Symptom**: Rapid cost accumulation
- **Solutions**: 
  1. Enable context compression
  2. Use cheaper models for simple queries
  3. Reduce max token limits
  4. Clear conversation history regularly

### **Model-Specific Issues**

**❌ OpenRouter Models Not Loading**
- **Symptom**: Only DeepSeek models available
- **Solution**: 
  1. Add OpenRouter API key: `deepseekCodeCompanion.openrouterApiKey`
  2. Get key from [openrouter.ai](https://openrouter.ai/)
  3. Check OpenRouter account has credits
  4. Wait for model list refresh (30 seconds)

**❌ "Model Not Found" Error**
- **Symptom**: Specific model unavailable
- **Solutions**: 
  1. Check model availability at provider
  2. Verify model spelling in settings
  3. Try alternative models
  4. Update extension for new model support

### **VS Code Integration Issues**

**❌ Commands Not Appearing**
- **Symptom**: DeepSeek commands missing from Command Palette
- **Solution**: 
  1. Type "DeepSeek" in Command Palette (Ctrl+Shift+P)
  2. Check if extension is enabled
  3. Restart VS Code
  4. Check extension installation

**❌ Activity Bar Icon Missing**
- **Symptom**: No DeepSeek icon in sidebar
- **Solution**: 
  1. Right-click Activity Bar → Reset Activity Bar
  2. Check View → Appearance → Activity Bar
  3. Reinstall extension
  4. Check for conflicting extensions

### **Debug Information Collection**

**🔍 Getting Debug Info**
1. **Extension Version**: Command Palette → "Extensions: Show Installed Extensions"
2. **Console Logs**: Help → Toggle Developer Tools → Console
3. **Output Logs**: View → Output → Select "DeepSeek Code Companion"
4. **VS Code Version**: Help → About
5. **System Info**: Command Palette → "Developer: System Information"

**📧 Reporting Issues**
Include this information when reporting bugs:
- VS Code version
- Extension version  
- Operating system
- Error messages from console/output
- Steps to reproduce
- Configuration settings (without API keys)

### **Quick Diagnostic Commands**

Test extension health with these commands:
```bash
# Test installation
DeepSeek: Phase 5 - Demo Features

# Test API connectivity
DeepSeek: Phase 5 - Run Tests

# Test workspace access
"Can you see my workspace files?"

# Test automation
DeepSeek: Phase 5 - Run Automation
```

**✅ Quick Recovery Steps**
1. Restart VS Code
2. Check API keys in settings
3. Verify workspace is open
4. Run "Demo Features" command
5. Check Output panel for errors

---

## 🆘 **Support & Contributing**

- 📧 **Support**: info@hoiltd.com
- 💬 **Issues**: [GitHub Issues](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/deepseek-code-companion/issues)
- 📚 **Documentation**: [Wiki](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/deepseek-code-companion/wiki)
- 🤝 **Contributing**: See [Contributing Guide](CONTRIBUTING.md)
- 📄 **License**: MIT License - see [LICENSE](LICENSE)

---

**🏢 Made in London by Home & Office Improvements Ltd** | **⚡ Powered by DeepSeek AI & OpenRouter**