# Security Policy

## Supported Versions

We actively support the following versions of DeepSeek Code Companion:

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of our VS Code extension seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please use one of the following methods:

1. **GitHub Security Advisories**: Use the "Report a vulnerability" button in the Security tab of this repository
2. **Email**: Send details to security@hoiltd.com
3. **Private Issue**: Contact us through our website at hoiltd.com

### What to Include

Please include as much of the following information as possible:

- Type of issue (e.g., API key exposure, code injection, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Our Response

We will acknowledge your report within 48 hours and will send a more detailed response within 72 hours indicating the next steps in handling your report.

After the initial reply to your report, we will:

- Keep you informed of the progress toward a fix and full announcement
- May ask for additional information or guidance
- Credit you in the security advisory (if desired)

## Security Considerations

### API Key Management

- **Never commit API keys** to the repository
- Store API keys securely using VS Code's configuration system
- API keys are stored in VS Code's secure storage
- Consider using environment variables for development

### Data Privacy

- User code and conversations may be sent to DeepSeek's servers
- We do not store or log user conversations locally
- Users should be aware of what code they share with AI services
- No telemetry or analytics collection without explicit user consent

### Extension Security

- All dependencies are regularly updated
- Code is scanned for vulnerabilities using automated tools
- Extension follows VS Code security best practices
- Minimal required permissions are requested

## Security Best Practices for Users

1. **Protect Your API Key**: Never share your DeepSeek API key
2. **Review Code Sharing**: Be mindful of what code you share with AI services
3. **Keep Updated**: Always use the latest version of the extension
4. **Report Issues**: Report any suspicious behavior immediately

## Acknowledgments

We appreciate the security research community and will acknowledge researchers who help improve our security posture.

---

For any questions about this security policy, please contact us at security@hoiltd.com