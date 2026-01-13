import EventEmitter from 'events';
import { tradingBot } from './trading/24-7-bot.js';

export class WealthEngine extends EventEmitter {
  constructor() {
    super();
    this.tradingBot = tradingBot;
    this.performance = {
      startCapital: parseFloat(process.env.INITIAL_CAPITAL) || 1000,
      currentCapital: parseFloat(process.env.INITIAL_CAPITAL) || 1000,
      trades: 0,
      wins: 0,
      losses: 0,
      startTime: new Date()
    };
    
    this.setupListeners();
  }
  
  setupListeners() {
    // Listen for trading events
    this.tradingBot.on('trade', (trade) => {
      this.performance.trades++;
      console.log(`📈 Trade #${this.performance.trades} executed`);
    });
  }
  
  async getStatus() {
    return {
      status: 'running',
      timestamp: new Date().toISOString(),
      performance: this.performance,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }
  
  start() {
    console.log('🚀 Wealth Engine starting...');
    this.tradingBot.start();
    return this;
  }
}

export const wealthEngine = new WealthEngine();