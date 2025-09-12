# Contributing to DeepSeek Code Companion

Thank you for your interest in contributing to DeepSeek Code Companion! We welcome contributions from the community.

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- VS Code 1.103.0 or higher
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/HOME-OFFICE-IMPROVEMENTS-LTD/deepseek-code-companion.git
   cd deepseek-code-companion
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development**
   ```bash
   npm run watch
   ```

4. **Test in VS Code**
   - Press `F5` to open Extension Development Host
   - Test your changes in the new VS Code window

## 🛠️ Development Workflow

### Branch Strategy
- `main` - Production ready code
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical fixes

### Making Changes

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   npm run test
   npm run lint
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing new feature"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 Code Standards

### TypeScript Guidelines
- Use TypeScript strict mode
- Provide type annotations for public APIs
- Follow existing naming conventions
- Use async/await instead of promises where possible

### Code Style
- Use Prettier for formatting
- Follow ESLint rules
- Use meaningful variable and function names
- Add JSDoc comments for public methods

### Testing
- Write unit tests for new functionality
- Ensure all tests pass before submitting PR
- Aim for good test coverage

## 🐛 Bug Reports

When reporting bugs, please include:
- VS Code version
- Extension version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Console logs if available

## ✨ Feature Requests

For feature requests, please:
- Check existing issues first
- Describe the use case
- Explain why this feature would be valuable
- Provide examples if possible

## 📋 Pull Request Process

1. **Update Documentation**: Ensure README and other docs are updated
2. **Add Tests**: Include tests for new functionality
3. **Pass CI Checks**: All automated checks must pass
4. **Request Review**: Tag maintainers for review
5. **Address Feedback**: Respond to review comments promptly

## 🔒 Security

Please review our [Security Policy](SECURITY.md) before contributing. Never commit:
- API keys or secrets
- Personal information
- Sensitive test data

## 📞 Getting Help

- 💬 GitHub Discussions for questions
- 🐛 GitHub Issues for bugs
- 📧 Contact us at dev@hoiltd.com

## 🏆 Recognition

Contributors will be recognized in:
- Release notes
- Contributors section
- Special thanks in documentation

Thank you for helping make DeepSeek Code Companion better! 🚀