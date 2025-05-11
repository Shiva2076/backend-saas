const axios = require('axios');
require('dotenv').config();

class DeepInfraService {
  constructor() {
    this.apiKey = process.env.DEEPINFRA_API_KEY;
    this.baseUrl = 'https://api.deepinfra.com/v1/openai/chat/completions';
    this.availableModels = {
      mistral: 'mistralai/Mistral-7B-Instruct-v0.1',
      llama2: 'meta-llama/Llama-2-70b-chat-hf',
      mixtral: 'mistralai/Mixtral-8x7B-Instruct-v0.1'
    };
  }

  async generateText(prompt, modelType = 'mistral', maxTokens = 500) {
    if (!this.apiKey) {
      throw new Error('DeepInfra API key not configured');
    }

    const model = this.availableModels[modelType] || this.availableModels.mistral;

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('DeepInfra API error:', error.response?.data || error.message);
      throw new Error('Failed to generate response via DeepInfra');
    }
  }

  // Additional helper methods
  listModels() {
    return Object.keys(this.availableModels);
  }

  getModelName(modelType) {
    return this.availableModels[modelType];
  }
}

module.exports = new DeepInfraService();