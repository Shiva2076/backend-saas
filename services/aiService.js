const axios = require('axios');
const UsageLog = require('../models/UsageLog');
require('dotenv').config();

class AIService {
  constructor() {
    // Configure all available providers
    this.providers = [
      {
        name: 'OpenAI',
        enabled: !!process.env.OPENAI_API_KEY,
        generate: this.generateOpenAI.bind(this)
      },
      {
        name: 'DeepInfra',
        enabled: !!process.env.DEEPINFRA_API_KEY,
        generate: this.generateDeepInfra.bind(this)
      },
      {
        name: 'Mock',
        enabled: true, // Always available
        generate: this.generateMock.bind(this)
      }
    ];
  }

  // Main method that tries all providers
  async generateText(prompt, model = 'gpt-3.5-turbo', maxTokens = 500) {
    let lastError;
    
    for (const provider of this.providers) {
      if (!provider.enabled) continue;
      
      try {
        const startTime = Date.now();
        const result = await provider.generate(prompt, model, maxTokens);
        const duration = Date.now() - startTime;
        
        console.log(`Used ${provider.name} provider (${duration}ms)`);
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`${provider.name} failed:`, error.message);
      }
    }
    
    throw lastError || new Error('All providers failed');
  }

  // OpenAI Provider Implementation
  async generateOpenAI(prompt, model, maxTokens) {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    return response.data.choices[0].message.content.trim();
  }

  // DeepInfra Provider Implementation
  async generateDeepInfra(prompt, model, maxTokens) {
    const modelMap = {
      'gpt-3.5-turbo': 'mistralai/Mistral-7B-Instruct-v0.1',
      'gpt-4': 'mistralai/Mixtral-8x7B-Instruct-v0.1'
    };
    
    const response = await axios.post(
      'https://api.deepinfra.com/v1/openai/chat/completions',
      {
        model: modelMap[model] || modelMap['gpt-3.5-turbo'],
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPINFRA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    return response.data.choices[0].message.content.trim();
  }

  // Mock Provider Implementation
  generateMock(prompt, toolName) {
    console.warn('Using mock AI response');
    const mockResponses = {
      summarizer: `Mock summary: ${prompt.substring(0, 100)}... [summary]`,
      'email-writer': `Subject: Mock Email\n\nDear Recipient,\n\n${prompt}\n\nSincerely,\n[Your Name]`,
      'code-generator': `// Mock code for: ${prompt}\nfunction example() {\n  return "solution";\n}`
    };
    return mockResponses[toolName] || `Mock response: ${prompt.substring(0, 150)}`;
  }

  // Specialized methods using the main generateText
  async summarizeText(text, maxLength = 200) {
    const prompt = `Summarize in ${maxLength} chars:\n\n${text}\n\nSummary:`;
    return this.generateText(prompt, 'gpt-3.5-turbo');
  }

  async generateEmail(prompt) {
    const emailPrompt = `Write professional email:\n\n${prompt}\n\nEmail:`;
    return this.generateText(emailPrompt, 'gpt-3.5-turbo');
  }

  async generateCode(prompt, language = 'javascript') {
    const codePrompt = `Write ${language} code:\n\n${prompt}\n\nCode:`;
    return this.generateText(codePrompt, 'gpt-3.5-turbo');
  }

  async chatWithBot(messages) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages,
          temperature: 0.7,
          stream: true
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          responseType: 'stream',
          timeout: 20000
        }
      );
      return response.data;
    } catch (error) {
      console.error('Chat streaming failed:', error.message);
      throw error;
    }
  }

  async logUsage(userId, companyId, toolName, prompt, response, status = 'success', error = null) {
    try {
      const usageLog = new UsageLog({
        user: userId,
        company: companyId,
        toolName,
        prompt,
        response: typeof response === 'string' ? response : JSON.stringify(response),
        status,
        error: error?.message || error
      });
      await usageLog.save();
      return usageLog;
    } catch (err) {
      console.error('Usage log failed:', err);
      throw err;
    }
  }
}

module.exports = new AIService();