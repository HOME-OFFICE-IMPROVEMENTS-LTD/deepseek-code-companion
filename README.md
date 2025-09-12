# DeepSeek Code Companion

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/deepseek-code-companion)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Your official AI partner in VS Code. Chat with DeepSeek and other models, generate code, and refactor with full context awareness.

## ✨ Features

### 🤖 **AI Chat Interface**
- Interactive chat panel with DeepSeek AI
- Context-aware conversations using your current code
- Support for both DeepSeek Coder and Chat models
- Beautiful, VS Code-themed interface

### 💡 **Intelligent Code Generation**
- Generate code from natural language descriptions
- Context-aware code completion
- Implement functions from comments
- Smart code suggestions with AI autocomplete

### 🔧 **Smart Refactoring**
- AI-powered code refactoring suggestions
- Performance optimization recommendations
- Extract functions and methods automatically
- Fix code issues and improve quality
- Add documentation and comments

### 📊 **Comprehensive Workspace Analysis**
- Analyze entire codebase for quality issues
- Get AI-powered architecture insights
- Detect code smells and potential improvements
- Project overview with statistics
- Dependency analysis

## 🚀 Quick Start

### Installation

1. Install the extension from the VS Code Marketplace (coming soon)
2. Or install manually:
   ```bash
   git clone https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/deepseek-code-companion
   cd deepseek-code-companion
   npm install
   npm run compile
   ```

### Setup

1. **Get your DeepSeek API key** from [DeepSeek Platform](https://platform.deepseek.com)
2. **Configure the extension**:
   - Open VS Code Settings (`Ctrl+,` / `Cmd+,`)
   - Search for "DeepSeek"
   - Enter your API key in `deepseek.apiKey`
   - Choose your preferred model in `deepseek.model`

### Basic Usage

#### 💬 **Chat with DeepSeek**
- Use `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (Mac)
- Or click the DeepSeek icon in the activity bar
- Ask questions about your code, get explanations, or request help

#### ⚡ **Generate Code**
- Use `Ctrl+Shift+G` (Windows/Linux) or `Cmd+Shift+G` (Mac)
- Or use Command Palette: `DeepSeek: Generate Code`
- Describe what you want, and AI will generate it for you

#### 🔄 **Refactor Code**
- Select code you want to improve
- Right-click and choose from DeepSeek refactoring options:
  - 🤖 Refactor with DeepSeek
  - ⚡ Optimize Performance
  - 📦 Extract Function/Method
  - 💡 Explain & Improve

#### 🔍 **Analyze Workspace**
- Use Command Palette: `DeepSeek: Analyze Workspace`
- View insights in the DeepSeek panel
- Get AI-powered recommendations for your project

## ⚙️ Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `deepseek.apiKey` | Your DeepSeek API key | `""` |
| `deepseek.model` | DeepSeek model to use | `"deepseek-coder"` |
| `deepseek.enableCodeGeneration` | Enable AI code generation | `true` |
| `deepseek.enableRefactoring` | Enable refactoring suggestions | `true` |
| `deepseek.enableWorkspaceAnalysis` | Enable workspace analysis | `true` |

## 🎯 Use Cases

### For Developers
- **Learning**: Ask questions about unfamiliar code
- **Debugging**: Get help understanding and fixing issues
- **Code Review**: Get AI feedback on your code quality
- **Documentation**: Generate comments and documentation

### For Teams
- **Code Standards**: Maintain consistent code quality
- **Onboarding**: Help new team members understand the codebase
- **Architecture**: Get insights about project structure
- **Best Practices**: Learn and apply coding best practices

### For Projects
- **Legacy Code**: Understand and modernize old codebases
- **Refactoring**: Systematically improve code quality
- **Performance**: Optimize slow or inefficient code
- **Testing**: Generate test cases and improve coverage

## 🔑 Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| `DeepSeek: Open Chat` | `Ctrl+Shift+D` | Open AI chat interface |
| `DeepSeek: Generate Code` | `Ctrl+Shift+G` | Generate code from description |
| `DeepSeek: Refactor Selection` | - | Refactor selected code |
| `DeepSeek: Analyze Workspace` | - | Analyze entire workspace |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [DeepSeek Platform](https://platform.deepseek.com)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Report Issues](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/deepseek-code-companion/issues)

## 🙏 Acknowledgments

- Built with ❤️ by Home Office Improvements Ltd
- Powered by DeepSeek AI
- Inspired by the VS Code community

---

**Happy Coding with AI! 🚀**
