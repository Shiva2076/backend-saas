const AIService = require('../services/aiService');
const UsageService = require('../services/usageService');
const Company = require('../models/Company');
const { validationResult } = require('express-validator');

class ToolController {
  constructor() {
    this.useTool = this.useTool.bind(this);
    this.chatbot = this.chatbot.bind(this);
  }

  async useTool(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { toolName, prompt } = req.body;
    const userId = req.user.id;
    const companyId = req.user.company;

    try {
      const usageCheck = await UsageService.checkUsageLimit(companyId);
      if (!usageCheck.allowed) {
        return res.status(429).json({
          message: 'Monthly usage limit exceeded. Please upgrade your plan.',
          currentPlan: req.user.company.plan,
          usage: {
            used: usageCheck.actualUsage,
            limit: usageCheck.monthlyLimit
          },
          upgradeOptions: this.getUpgradeOptions(req.user.company.plan)
        });
      }

      const response = await this.processToolRequest(toolName, prompt);

      await this.handleSuccessfulUsage(userId, companyId, toolName, prompt, response);

      return res.json({
        success: true,
        tool: toolName,
        response,
        usage: {
          remaining: usageCheck.remaining - 1,
          limit: usageCheck.monthlyLimit
        }
      });

    } catch (err) {
      console.error(`Tool usage error [${toolName}]:`, err);
      await this.handleFailedUsage(userId, companyId, toolName, prompt, err);
      
      return res.status(500).json({
        message: 'Failed to process request',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }

  async chatbot(req, res) {
  const { messages } = req.body;
  const userId = req.user.id;
  const companyId = req.user.company;

  try {
    const usage = await UsageService.checkUsageLimit(companyId);
    
    console.log('Usage check:', { 
      companyId,
      plan: usage.plan,
      used: usage.actualUsage,
      limit: usage.monthlyLimit,
      remaining: usage.remaining
    });

    if (!usage.allowed) {
      return res.status(429).json({
        message: 'Monthly usage limit exceeded. Please upgrade your plan.',
        usage: {
          used: usage.actualUsage,
          limit: usage.monthlyLimit,
          plan: usage.plan
        },
        upgradeOptions: this.getUpgradeOptions(usage.plan)
      });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let fullResponse = '';
    const stream = await AIService.chatWithBot(messages);

  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({
      message: 'Failed to process chatbot request',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}


  async processToolRequest(toolName, prompt) {
    switch (toolName) {
      case 'summarizer':
        return await AIService.summarizeText(prompt);
      case 'email-writer':
        return await AIService.generateEmail(prompt);
      case 'code-generator':
        return await AIService.generateCode(prompt);
      default:
        throw new Error('Invalid tool name');
    }
  }

  async handleSuccessfulUsage(userId, companyId, toolName, input, output) {
    await Promise.all([
      AIService.logUsage(userId, companyId, toolName, input, output),
      Company.findByIdAndUpdate(companyId, { $inc: { monthlyUsage: 1 } })
    ]);
  }

  async handleFailedUsage(userId, companyId, toolName, input, error) {
    await AIService.logUsage(
      userId,
      companyId,
      toolName,
      input,
      null,
      'failure',
      error.message
    );
  }

  getUpgradeOptions(currentPlan) {
    const options = [];
    if (currentPlan === 'free') {
      options.push(
        { plan: 'pro', monthlyLimit: 500, price: '$29/month' },
        { plan: 'enterprise', monthlyLimit: 'Unlimited', price: '$99/month' }
      );
    } else if (currentPlan === 'pro') {
      options.push(
        { plan: 'enterprise', monthlyLimit: 'Unlimited', price: '$99/month' }
      );
    }
    return options;
  }
}

module.exports = new ToolController();