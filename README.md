# DeepSeek Code Companion

Your official AI partner in VS Code. Chat with DeepSeek and other models, generate code, and refactor with full context awareness.

## Features

### 🤖 AI-Powered Chat Interface
- Interactive chat with DeepSeek AI models
- Context-aware responses based on your current code
- Smart query detection for optimal response types
- Copy and insert code directly from responses

### 🔧 Code Generation
- Generate code from natural language descriptions
- Create code from comments automatically
- Context-aware suggestions based on your current file
- Support for multiple programming languages

### 🔄 Intelligent Refactoring
- Performance optimization
- Readability improvements
- Function extraction and modularization
- Logic simplification
- Modern syntax updates
- Error handling enhancements
- Type safety improvements
- Security vulnerability fixes

### 📊 Workspace Analysis
- Comprehensive project structure analysis
- Language and file type statistics
- Dependency analysis
- Code quality insights
- Visual reports with project metrics

### 🎯 Smart Query Detection
- Automatic detection of query types (code generation, refactoring, explanation, etc.)
- Optimized responses based on intent
- Context-aware suggestions

## Installation

1. Install the extension from the VS Code marketplace
2. Configure your DeepSeek API key in settings
3. Start using the AI-powered features!

## Configuration

### Required Settings

- **DeepSeek API Key**: Get your API key from [DeepSeek Platform](https://platform.deepseek.com)
  ```json
  {
    "deepseek.apiKey": "your-api-key-here"
  }
  ```

### Optional Settings

- **Base URL**: DeepSeek API base URL (default: `https://api.deepseek.com`)
- **Model**: Choose between `deepseek-coder` or `deepseek-chat`
- **Max Tokens**: Maximum tokens for API responses (default: 4000)

## Commands

| Command | Description | Context Menu |
|---------|-------------|--------------|
| `DeepSeek: Open Chat` | Open the AI chat interface | Always available |
| `DeepSeek: Analyze Workspace` | Analyze project structure and metrics | Explorer context |
| `DeepSeek: Generate Code` | Generate code from description | When text is selected |
| `DeepSeek: Generate Code from Comment` | Generate code from comment line | When cursor is on comment |
| `DeepSeek: Refactor Code` | Refactor selected code | When text is selected |
| `DeepSeek: Quick Fix` | Analyze and fix code issues | When text is selected |

## Usage Examples

### Chat Interface
1. Open the command palette (`Ctrl+Shift+P`)
2. Run "DeepSeek: Open Chat"
3. Ask questions about your code or request assistance

### Code Generation
1. Select some code or place cursor where you want to generate code
2. Right-click and select "DeepSeek: Generate Code"
3. Describe what you want to generate
4. Choose how to apply the generated code

### Code from Comments
1. Write a comment describing what you want to implement:
   ```javascript
   // Create a function that sorts an array of objects by a specific property
   ```
2. Place cursor on the comment line
3. Use "DeepSeek: Generate Code from Comment"
4. Code will be generated below the comment

### Refactoring
1. Select the code you want to refactor
2. Use "DeepSeek: Refactor Code"
3. Choose from predefined refactoring options or provide custom instructions
4. Review and apply the changes

### Workspace Analysis
1. Use "DeepSeek: Analyze Workspace" from the explorer context menu
2. View comprehensive project statistics and insights
3. Understand your codebase structure and dependencies

## Supported Languages

The extension works with all programming languages supported by VS Code, with optimized support for:

- TypeScript/JavaScript
- Python
- Java
- C#
- C/C++
- Go
- Rust
- PHP
- Ruby
- Swift
- Kotlin
- And many more...

## Privacy and Security

- Your code is sent to DeepSeek's servers for processing
- API communications are encrypted
- No code is stored permanently by the extension
- Configure your API key securely in VS Code settings

## Troubleshooting

### API Key Issues
- Ensure your API key is valid and has sufficient credits
- Check the API key format and permissions

### Connection Problems
- Verify your internet connection
- Check if the DeepSeek API service is available
- Review proxy settings if applicable

### Performance
- Reduce `maxTokens` setting for faster responses
- Use more specific queries for better results

## Contributing

We welcome contributions! Please see our [contributing guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Report issues on [GitHub Issues](https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/deepseek-code-companion/issues)
- Join our community discussions
- Check the [DeepSeek Documentation](https://platform.deepseek.com/docs) for API details

## Changelog

### 0.1.0
- Initial release
- Basic chat interface with DeepSeek API
- Code generation and refactoring features
- Workspace analysis tools
- Smart query detection
- Context-aware responses

---

Made with ❤️ by Home Office Improvements Ltd
