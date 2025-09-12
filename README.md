# DeepSeek Code Companion

Your official AI partner in VS Code. Chat with DeepSeek and other models, generate code, and refactor with full context awareness.

[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-blue)](https://marketplace.visualstudio.com/items?itemName=Home%20%26%20Office%20Improvements.deepseek-code-companion)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> 🚀 **Fast-Track Development**: See our [Implementation Roadmap](IMPLEMENTATION_ROADMAP.md) for detailed feature development plans

## 🎯 **Current Status & Roadmap**

| Phase | Status | Features | Timeline |
|-------|--------|----------|----------|
| **Foundation** | ✅ **Complete** | Chat interface, workspace analysis | ✅ Done |
| **Phase 1** | 🔄 **In Progress** | OpenRouter integration, multi-model support, cost tracking | Week 1 |
| **Phase 2** | ⏳ **Planned** | Security scanning, code analysis, performance metrics | Week 2 |
| **Phase 3** | ⏳ **Planned** | Documentation generation, test creation, metrics dashboard | Week 3 |
| **Marketplace** | 🎯 **Target** | Professional listing, branding, community features | Week 2 |

📋 **[View Complete Roadmap →](IMPLEMENTATION_ROADMAP.md)**

## ✨ Features

### **🎉 Current Features**
- 💬 **AI Chat Interface**: Chat with DeepSeek AI directly in VS Code's sidebar
- 🔍 **Workspace Intelligence**: Smart file exploration and project analysis
- 🛠️ **Code Generation**: AI-powered code snippets and explanations
- 🔄 **Smart Refactoring**: Get intelligent code refactoring suggestions
- 📊 **Project Insights**: File structure analysis, TypeScript detection, and statistics
- 🎯 **Context-Aware**: Understands your project structure for better responses

### **🚀 Coming Soon** 
- 🔗 **Multi-Model Support**: OpenRouter integration with 100+ AI models
- 💰 **Cost Tracking**: Real-time API usage and cost monitoring
- 🔒 **Security Scanner**: OWASP compliance and vulnerability detection
- 📈 **Real-time Metrics**: Code quality, performance, and maintainability scores
- 🧪 **Test Generation**: Intelligent unit and integration test creation
- 📚 **Auto Documentation**: API docs, README, and architecture generation

## 🚀 Quick Start

### Installation
1. Install the extension from the VS Code Marketplace
2. Get your API key from [DeepSeek Platform](https://platform.deepseek.com/)
3. Configure your API key in VS Code settings

### Configuration
1. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "DeepSeek"
3. Enter your API key in `deepSeek.apiKey`

### Usage
1. Click the DeepSeek icon in the Activity Bar
2. Start chatting with AI in the sidebar
3. Ask questions like:
   - "Show me the file structure"
   - "How many TypeScript files are in this project?"
   - "Generate a React component"
   - "Refactor this function"

## 🎯 Supported Queries

| Query Type | Example | Description |
|------------|---------|-------------|
| **File Structure** | "Show me file structure" | Displays project hierarchy |
| **Source Analysis** | "List src files" | Shows source directory contents |
| **Language Detection** | "Find TypeScript files" | Lists files by language |
| **Project Stats** | "How many files total?" | Provides file count statistics |
| **Package Info** | "Find package.json" | Displays package.json details |

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- VS Code 1.103.0+

### Setup
```bash
git clone https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/deepseek-code-companion.git
cd deepseek-code-companion
npm install
npm run compile
```

### Development Workflow
```bash
# Watch mode for development
npm run watch

# Run tests
npm test

# Package extension
npm run package
```

## 📝 Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `deepSeek.apiKey` | string | `""` | Your DeepSeek API key |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

If you discover a security vulnerability, please follow our [Security Policy](SECURITY.md) for responsible disclosure.

## 📞 Support

- 📧 Issues: [GitHub Issues](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/deepseek-code-companion/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/deepseek-code-companion/discussions)
- 🌐 Website: [hoiltd.com](https://hoiltd.com)

## 🏢 About

Developed by **Home & Office Improvements Ltd** - Building better development tools for the modern workspace.

---

Made with ❤️ for the VS Code community
