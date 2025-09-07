// src/deepSeekAPI.ts
import * as vscode from 'vscode';

export async function getDeepSeekResponse(userMessage: string): Promise<string> {
    // Get API key from user configuration
    const config = vscode.workspace.getConfiguration('deepSeek');
    const apiKey = config.get<string>('apiKey');

    if (!apiKey) {
        throw new Error('DeepSeek API key not configured. Please set it in VS Code settings.');
    }

    // Make API request to DeepSeek
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: userMessage }],
            stream: false
        })
    });

    if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    // Check if the response has the expected structure
    if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
    } else {
        console.error('Unexpected API response structure:', data);
        throw new Error('Unexpected response format from DeepSeek API');
    }
}