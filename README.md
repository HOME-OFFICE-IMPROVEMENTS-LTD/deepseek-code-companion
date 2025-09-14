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
- OWASP Top 10 vulnerability detection
- Pattern-based security analysis
- Compliance reporting with actionable recommendations

#### 📚 **Documentation Generator**
```
📚 DOCUMENTATION GENERATED:
✅ API documentation created (12 endpoints documented)
✅ README.md updated with latest features
✅ Architecture documentation generated
✅ Code comments analyzed and improved
```
- Automated README and API documentation
- Code comment enhancement
- Architecture documentation from code analysis

#### 🧪 **Test Generator**
```
🧪 TESTS GENERATED:
✅ 24 unit tests created for core functions
✅ 8 integration tests generated
✅ Test coverage: 89% (target: 80%)
✅ Test suite ready for execution
```
- Unit and integration test creation
- Framework detection (Jest, Mocha, etc.)
- Real test coverage analysis

#### 📊 **Code Metrics Dashboard**
```
📊 CODE METRICS:
✅ Code quality score: 8.7/10
✅ Cyclomatic complexity: Average 3.2 (Good)
✅ Technical debt: Low
✅ Maintainability index: 85/100
```
- Live code quality scoring
- Complexity analysis and technical debt tracking
- Interactive metrics dashboard

## 📋 **Quick Start**

### 1. **Installation**
1. Open VS Code → Extensions (Ctrl+Shift+X)
2. Search "HOILTD DeepSeek Code Companion"
3. Click Install

### 2. **API Keys Setup**
```json
{
  "deepseekCodeCompanion.deepseekApiKey": "sk-your-deepseek-key-here",
  "deepseekCodeCompanion.openrouterApiKey": "sk-or-your-openrouter-key",
  "deepseekCodeCompanion.dailyCostLimit": 5,
  "deepseekCodeCompanion.showCostInChat": true
}
```
- **DeepSeek API**: Get at [platform.deepseek.com](https://platform.deepseek.com/)
- **OpenRouter API** (optional): Get at [openrouter.ai](https://openrouter.ai/) for 100+ models

### 3. **Start Using**
- **Chat**: Click DeepSeek icon in Activity Bar
- **Phase 5**: Use Command Palette (Ctrl+Shift+P) → "DeepSeek: Phase 5"

## 🎯 **How to Use Effectively**

### **For Multi-Model AI Chat:**
- Switch between DeepSeek, GPT-4, Claude, and 100+ models
- Ask about your code files with full workspace context
- Get cost-effective AI assistance with real-time tracking

### **For Phase 5 Automation:**
**Command Palette (Ctrl+Shift+P):**
- `DeepSeek: Phase 5 - Security Scan` → Full security audit
- `DeepSeek: Phase 5 - Generate Documentation` → Auto-create docs
- `DeepSeek: Phase 5 - Generate Tests` → Create test files
- `DeepSeek: Phase 5 - Show Metrics Dashboard` → Code quality analysis
- `DeepSeek: Phase 5 - Run Automation` → Complete workflow
- `DeepSeek: Phase 5 - Demo Features` → See what it can do

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

## ⚙️ **Configuration Options**

```json
{
  "deepseekCodeCompanion.defaultModel": "deepseek-chat",
  "deepseekCodeCompanion.autoSwitchToDeepSeek": true,
  "deepseekCodeCompanion.securityLevel": "high",
  "deepseekCodeCompanion.documentationStyle": "detailed",
  "deepseekCodeCompanion.testingFramework": "auto-detect"
}
```

## 🛠️ **System Requirements**

- **VS Code**: 1.74.0 or higher
- **Internet**: Required for AI API access  
- **Node.js**: 16+ (for Phase 5 features)
- **Storage**: ~130KB extension size

## 🔧 **Troubleshooting**

**❌ API Key Issues:** Check settings and verify key validity  
**❌ Phase 5 Not Working:** Restart VS Code, ensure workspace has code files  
**❌ Chat Not Responding:** Check internet connection and API key configuration  

**✅ Quick Test:** Run `Phase 5 - Demo Features` to verify installation

---

## 🆘 **Support & Contributing**

- 📧 **Support**: info@hoiltd.com
- 💬 **Issues**: [GitHub Issues](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/deepseek-code-companion/issues)
- 📚 **Documentation**: [Wiki](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/deepseek-code-companion/wiki)
- 🤝 **Contributing**: See [Contributing Guide](CONTRIBUTING.md)
- 📄 **License**: MIT License - see [LICENSE](LICENSE)

---

**🏢 Made in London by Home & Office Improvements Ltd** | **⚡ Powered by DeepSeek AI & OpenRouter**