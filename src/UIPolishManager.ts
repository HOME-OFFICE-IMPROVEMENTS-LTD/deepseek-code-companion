import * as vscode from 'vscode';
import { ModelResponse } from './types';

export interface OptimizationMetrics {
    responseTime: number;
    cacheHitRate: number;
    averageTokens: number;
    successRate: number;
}

export interface NotificationOptions {
    type: 'info' | 'warning' | 'error' | 'progress';
    title?: string;
    detail?: string;
    timeout?: number;
    actions?: Array<{
        title: string;
        action: () => void;
    }>;
}

export interface StatusUpdate {
    message: string;
    progress?: number;
    tooltip?: string;
    color?: string;
    icon?: string;
}

export class UIPolishManager {
    private statusBarItem: vscode.StatusBarItem;
    private progressReports = new Map<string, vscode.Progress<{message?: string; increment?: number}>>();
    private currentStatus: StatusUpdate | null = null;
    private notificationQueue: NotificationOptions[] = [];
    private isProcessingNotifications = false;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 
            100
        );
        this.statusBarItem.show();
        this.updateStatus({ message: 'DeepSeek Ready', icon: '$(robot)' });
    }

    /**
     * Shows an enhanced notification with better user experience
     */
    async showNotification(options: NotificationOptions): Promise<void> {
        this.notificationQueue.push(options);
        
        if (!this.isProcessingNotifications) {
            await this.processNotificationQueue();
        }
    }

    /**
     * Processes the notification queue to avoid overwhelming the user
     */
    private async processNotificationQueue(): Promise<void> {
        this.isProcessingNotifications = true;

        while (this.notificationQueue.length > 0) {
            const notification = this.notificationQueue.shift()!;
            await this.displayNotification(notification);
            
            // Small delay between notifications
            if (this.notificationQueue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        this.isProcessingNotifications = false;
    }

    /**
     * Displays a single notification
     */
    private async displayNotification(options: NotificationOptions): Promise<void> {
        const { type, title, detail, actions, timeout } = options;
        const message = title && detail ? `${title}: ${detail}` : title || detail || '';

        if (actions && actions.length > 0) {
            const actionItems = actions.map(action => action.title);
            let result: string | undefined;

            switch (type) {
                case 'error':
                    result = await vscode.window.showErrorMessage(message, ...actionItems);
                    break;
                case 'warning':
                    result = await vscode.window.showWarningMessage(message, ...actionItems);
                    break;
                default:
                    result = await vscode.window.showInformationMessage(message, ...actionItems);
                    break;
            }

            // Execute action if selected
            if (result) {
                const selectedAction = actions.find(action => action.title === result);
                if (selectedAction) {
                    try {
                        selectedAction.action();
                    } catch (error) {
                        console.error('Action execution failed:', error);
                    }
                }
            }
        } else {
            // Simple notification without actions
            const showMessage = () => {
                switch (type) {
                    case 'error':
                        return vscode.window.showErrorMessage(message);
                    case 'warning':
                        return vscode.window.showWarningMessage(message);
                    default:
                        return vscode.window.showInformationMessage(message);
                }
            };

            if (timeout && timeout > 0) {
                // Show with timeout
                const messagePromise = showMessage();
                setTimeout(() => {
                    // Note: VS Code doesn't have a direct way to dismiss notifications
                    // This is mainly for queue management
                }, timeout);
                await messagePromise;
            } else {
                await showMessage();
            }
        }
    }

    /**
     * Updates the status bar with current information
     */
    updateStatus(update: StatusUpdate): void {
        this.currentStatus = update;
        
        let text = '';
        if (update.icon) {
            text += `${update.icon} `;
        }
        text += update.message;
        
        if (update.progress !== undefined) {
            text += ` (${Math.round(update.progress)}%)`;
        }

        this.statusBarItem.text = text;
        this.statusBarItem.tooltip = update.tooltip || update.message;
        
        if (update.color) {
            this.statusBarItem.color = update.color;
        } else {
            this.statusBarItem.color = undefined;
        }
    }

    /**
     * Shows progress for long-running operations
     */
    async withProgress<T>(
        title: string,
        task: (progress: vscode.Progress<{message?: string; increment?: number}>, token: vscode.CancellationToken) => Promise<T>
    ): Promise<T> {
        return vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title,
                cancellable: true
            },
            async (progress, token) => {
                const taskId = Math.random().toString(36);
                this.progressReports.set(taskId, progress);
                
                try {
                    const result = await task(progress, token);
                    this.progressReports.delete(taskId);
                    return result;
                } catch (error) {
                    this.progressReports.delete(taskId);
                    throw error;
                }
            }
        );
    }

    /**
     * Shows model selection with enhanced UI
     */
    async showModelPicker(
        models: Array<{
            id: string;
            name: string;
            provider: string;
            cost?: number;
            quality?: number;
            description?: string;
        }>,
        title = 'Select AI Model'
    ): Promise<string | undefined> {
        const items = models.map(model => ({
            label: model.name,
            description: model.provider,
            detail: this.formatModelDetails(model),
            value: model.id
        }));

        const selected = await vscode.window.showQuickPick(items, {
            title,
            placeHolder: 'Choose a model for your request',
            matchOnDescription: true,
            matchOnDetail: true
        });

        return selected?.value;
    }

    /**
     * Formats model details for display
     */
    private formatModelDetails(model: {
        cost?: number;
        quality?: number;
        description?: string;
    }): string {
        const parts: string[] = [];
        
        if (model.quality !== undefined) {
            parts.push(`Quality: ${Math.round(model.quality)}/100`);
        }
        
        if (model.cost !== undefined) {
            parts.push(`Cost: $${model.cost.toFixed(4)}/1k tokens`);
        }
        
        if (model.description) {
            parts.push(model.description);
        }

        return parts.join(' • ');
    }

    /**
     * Shows response with syntax highlighting and copy functionality
     */
    async showResponse(response: ModelResponse): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'aiResponse',
            `Response from ${response.model}`,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        const webviewContent = this.generateResponseHTML(response);
        panel.webview.html = webviewContent;

        // Handle messages from webview
        panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'copy':
                        await vscode.env.clipboard.writeText(message.text);
                        await this.showNotification({
                            type: 'info',
                            title: 'Copied to clipboard',
                            timeout: 2000
                        });
                        break;
                }
            }
        );
    }

    /**
     * Generates HTML content for response display
     */
    private generateResponseHTML(response: ModelResponse): string {
        const content = response.content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI Response</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 20px;
                    background: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding: 10px;
                    background: var(--vscode-badge-background);
                    border-radius: 5px;
                }
                .model-info {
                    font-weight: bold;
                    color: var(--vscode-badge-foreground);
                }
                .usage-info {
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                }
                .content {
                    white-space: pre-wrap;
                    font-family: 'Consolas', 'Courier New', monospace;
                    background: var(--vscode-textCodeBlock-background);
                    padding: 15px;
                    border-radius: 5px;
                    border: 1px solid var(--vscode-widget-border);
                    margin-bottom: 15px;
                }
                .actions {
                    display: flex;
                    gap: 10px;
                }
                button {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 13px;
                }
                button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .metadata {
                    font-size: 0.85em;
                    color: var(--vscode-descriptionForeground);
                    margin-top: 15px;
                    padding: 10px;
                    background: var(--vscode-textBlockQuote-background);
                    border-left: 4px solid var(--vscode-textBlockQuote-border);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="model-info">${response.model} (${response.provider})</div>
                <div class="usage-info">
                    ${response.usage.inputTokens + response.usage.outputTokens} tokens • 
                    $${response.usage.totalCost.toFixed(4)}
                </div>
            </div>
            
            <div class="content">${content}</div>
            
            <div class="actions">
                <button onclick="copyContent()">📋 Copy Response</button>
                <button onclick="copyCode()">📄 Copy Code Only</button>
            </div>
            
            <div class="metadata">
                <strong>Usage:</strong> ${response.usage.inputTokens} input tokens, ${response.usage.outputTokens} output tokens<br>
                <strong>Cost:</strong> $${response.usage.totalCost.toFixed(6)}<br>
                ${response.optimized ? '<strong>Optimized:</strong> Response was cached/optimized<br>' : ''}
                ${response.metadata?.processingTime ? `<strong>Response Time:</strong> ${response.metadata.processingTime}ms<br>` : ''}
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                function copyContent() {
                    const content = \`${content.replace(/`/g, '\\`')}\`;
                    vscode.postMessage({
                        command: 'copy',
                        text: content
                    });
                }
                
                function copyCode() {
                    const content = \`${content.replace(/`/g, '\\`')}\`;
                    const codeBlocks = content.match(/\`\`\`[\\s\\S]*?\`\`\`/g) || [];
                    const codeOnly = codeBlocks.map(block => 
                        block.replace(/\`\`\`\\w*\\n?/, '').replace(/\`\`\`$/, '')
                    ).join('\\n\\n');
                    
                    vscode.postMessage({
                        command: 'copy',
                        text: codeOnly || content
                    });
                }
            </script>
        </body>
        </html>`;
    }

    /**
     * Shows usage statistics with charts
     */
    async showUsageStats(stats: {
        totalRequests: number;
        totalCost: number;
        modelUsage: Record<string, number>;
        dailyUsage: number[];
        metrics?: OptimizationMetrics;
    }): Promise<void> {
        await this.showNotification({
            type: 'info',
            title: 'Usage Statistics',
            detail: `${stats.totalRequests} requests • $${stats.totalCost.toFixed(4)} total cost`,
            actions: [
                {
                    title: 'View Details',
                    action: () => {
                        // Could open a detailed webview with charts
                        console.log('Detailed stats:', stats);
                    }
                }
            ]
        });
    }

    /**
     * Shows smart suggestions for improving workflow
     */
    async showSmartSuggestions(suggestions: Array<{
        title: string;
        description: string;
        action?: () => void;
        priority: 'high' | 'medium' | 'low';
    }>): Promise<void> {
        if (suggestions.length === 0) {
            return;
        }

        const highPriority = suggestions.filter(s => s.priority === 'high');
        
        if (highPriority.length > 0) {
            const suggestion = highPriority[0];
            await this.showNotification({
                type: 'info',
                title: '💡 Suggestion',
                detail: `${suggestion.title}: ${suggestion.description}`,
                actions: suggestion.action ? [
                    {
                        title: 'Apply',
                        action: suggestion.action
                    },
                    {
                        title: 'Dismiss',
                        action: () => {}
                    }
                ] : undefined
            });
        }
    }

    /**
     * Shows error with helpful recovery options
     */
    async showEnhancedError(
        error: Error,
        context: string,
        recoveryOptions?: Array<{
            title: string;
            action: () => Promise<void>;
        }>
    ): Promise<void> {
        const actions = recoveryOptions || [
            {
                title: 'Retry',
                action: async () => {
                    this.updateStatus({ 
                        message: 'Retrying...', 
                        icon: '$(sync~spin)' 
                    });
                }
            }
        ];

        await this.showNotification({
            type: 'error',
            title: `Error in ${context}`,
            detail: error.message,
            actions: actions.map(option => ({
                title: option.title,
                action: () => {
                    option.action().catch(console.error);
                }
            }))
        });
    }

    /**
     * Shows typing indicator during model processing
     */
    showTypingIndicator(modelName: string): void {
        this.updateStatus({
            message: `${modelName} is thinking...`,
            icon: '$(loading~spin)',
            color: '#00ff00'
        });
    }

    /**
     * Clears typing indicator
     */
    clearTypingIndicator(): void {
        this.updateStatus({
            message: 'DeepSeek Ready',
            icon: '$(robot)'
        });
    }

    /**
     * Disposes resources
     */
    dispose(): void {
        this.statusBarItem.dispose();
        this.progressReports.clear();
    }
}

// Global instance for extension-wide UI management
export const uiPolishManager = new UIPolishManager();