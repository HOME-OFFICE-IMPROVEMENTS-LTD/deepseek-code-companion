# Changelog

All notable changes to the "DeepSeek Code Companion" extension will be documented in this file.

## [0.1.0] - 2024-12-12

### Added
- 🤖 **AI Chat Interface**: Interactive chat panel with DeepSeek AI
- 💡 **Intelligent Code Generation**: Generate code from natural language descriptions
- 🔧 **Smart Refactoring**: AI-powered code refactoring suggestions with multiple options
- 📊 **Comprehensive Workspace Analysis**: Analyze entire codebase for quality insights
- ⚡ **Quick Actions**: Easy access to AI features through commands and keybindings
- 🎯 **Context Awareness**: AI understands your current code context for better responses
- ⚙️ **Configurable Settings**: Customize API keys, models, and feature toggles

### Features
- Chat with DeepSeek AI models (Coder and Chat)
- Generate code with `Ctrl+Shift+G` / `Cmd+Shift+G`
- Open chat with `Ctrl+Shift+D` / `Cmd+Shift+D`
- Right-click refactoring options for selected code
- Automatic workspace analysis on extension load
- Beautiful VS Code-themed chat interface
- Code action providers for seamless integration
- AI-powered completion suggestions

### Technical
- Built with TypeScript and VS Code Extension API
- Uses DeepSeek API for AI capabilities
- WebView-based chat interface
- Tree data providers for workspace insights
- Code action providers for refactoring
- Completion item providers for AI suggestions

### Configuration
- `deepseek.apiKey`: Your DeepSeek API key
- `deepseek.model`: Choose between `deepseek-coder` and `deepseek-chat`
- `deepseek.enableCodeGeneration`: Toggle code generation features
- `deepseek.enableRefactoring`: Toggle refactoring suggestions
- `deepseek.enableWorkspaceAnalysis`: Toggle workspace analysis