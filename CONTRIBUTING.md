# Contributing to DeepSeek Code Companion

Thank you for your interest in contributing to DeepSeek Code Companion! We welcome contributions from the community.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/deepseek-code-companion
   cd deepseek-code-companion
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Compile TypeScript**
   ```bash
   npm run compile
   ```

4. **Run linter**
   ```bash
   npm run lint
   ```

## Development Workflow

1. **Make your changes** in the `src/` directory
2. **Compile** with `npm run compile`
3. **Test** your changes by pressing `F5` in VS Code to launch the Extension Development Host
4. **Lint** your code with `npm run lint`

## Project Structure

```
src/
├── extension.ts              # Main extension entry point
└── providers/
    ├── chatProvider.ts       # AI chat interface
    ├── codeGenerationProvider.ts  # Code generation
    ├── refactoringProvider.ts     # Refactoring suggestions
    └── workspaceAnalyzer.ts       # Workspace analysis
```

## Code Style

- Use TypeScript with strict mode
- Follow VS Code extension patterns
- Use descriptive variable and function names
- Add comments for complex logic
- Maintain consistency with existing code

## Testing

Test your changes by:
1. Opening the Extension Development Host (`F5`)
2. Testing all major features:
   - Chat interface
   - Code generation
   - Refactoring
   - Workspace analysis
3. Verifying error handling
4. Testing with different file types

## Submitting Changes

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

## Getting Help

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Provide detailed information and steps to reproduce

Thank you for contributing! 🚀