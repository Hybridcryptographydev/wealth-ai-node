import ccxt from 'ccxt';
import cron from 'node-cron';

// Simple trading bot that works immediately
export class TradingBot {
  constructor() {
    this.exchange = new ccxt.binance({
      apiKey: process.env.BINANCE_API_KEY,
      secret: process.env.BINANCE_SECRET,
      enableRateLimit: true,
      options: {
        defaultType: 'spot',
        test: process.env.BINANCE_TESTNET === 'true'
      }
    });
    
    this.positions = new Map();
    this.isRunning = false;
    this.capital = parseFloat(process.env.INITIAL_CAPITAL) || 1000;
    
    console.log(`💰 Initial Capital: $${this.capital}`);
  }
  
  // Simple strategy: Buy when RSI < 30, Sell when RSI > 70
  async analyzeMarket(symbol = 'BTC/USDT') {
    try {
      // Get OHLCV data
      const ohlcv = await this.exchange.fetchOHLCV(symbol, '15m', undefined, 100);
      
      // Calculate simple RSI
      const closes = ohlcv.map(c => c[4]);
      const rsi = this.calculateRSI(closes);
      
      // Get current price
      const ticker = await this.exchange.fetchTicker(symbol);
      
      return {
        symbol,
        price: ticker.last,
        rsi,
        signal: rsi < 30 ? 'BUY' : rsi > 70 ? 'SELL' : 'HOLD',
        volume: ticker.baseVolume,
        change: ticker.percentage
      };
    } catch (error) {
      console.error('Market analysis error:', error.message);
      return null;
    }
  }
  
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
  
  async executeTrade(signal) {
    if (signal.signal === 'HOLD') return null;
    
    try {
      const positionSize = this.capital * 0.02; // Risk 2% per trade
      const amount = positionSize / signal.price;
      
      if (amount < 0.001) { // Minimum trade size
        console.log('⚠️ Position too small');
        return null;
      }
      
      console.log(`🎯 Executing ${signal.signal}: ${signal.symbol} at $${signal.price.toFixed(2)}`);
      
      // Paper trading - log only
      if (process.env.NODE_ENV !== 'production' || process.env.BINANCE_TESTNET === 'true') {
        const trade = {
          id: Date.now().toString(),
          symbol: signal.symbol,
          side: signal.signal,
          price: signal.price,
          amount,
          timestamp: new Date().toISOString(),
          paper: true
        };
        
        this.positions.set(trade.id, trade);
        console.log(`📝 Paper trade executed: ${trade.side} ${trade.amount} ${trade.symbol}`);
        
        // Simulate profit/loss after 5 minutes
        setTimeout(() => this.simulateClose(trade.id), 5 * 60 * 1000);
        
        return trade;
      }
      
      // Real trading (uncomment when ready)
      /*
      const order = await this.exchange.createOrder(
        signal.symbol,
        'market',
        signal.signal.toLowerCase(),
        amount
      );
      
      console.log('✅ Real trade executed:', order.id);
      return order;
      */
      
    } catch (error) {
      console.error('Trade execution error:', error.message);
      return null;
    }
  }
  
  simulateClose(tradeId) {
    const trade = this.positions.get(tradeId);
    if (!trade) return;
    
    const profit = (Math.random() - 0.5) * trade.amount * trade.price * 0.1;
    console.log(`💰 Simulated P&L for ${trade.symbol}: $${profit.toFixed(2)}`);
    
    this.positions.delete(tradeId);
  }
  
  start() {
    if (this.isRunning) return;
    
    console.log('🤖 Starting 24/7 Trading Bot...');
    this.isRunning = true;
    
    // Run every 1 minute
    cron.schedule('* * * * *', async () => {
      try {
        console.log(`\n⏰ ${new Date().toLocaleTimeString()} - Scanning markets...`);
        
        // Analyze top 3 crypto pairs
        const pairs = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'];
        
        for (const pair of pairs) {
          const analysis = await this.analyzeMarket(pair);
          if (analysis && analysis.signal !== 'HOLD') {
            await this.executeTrade(analysis);
          }
        }
        
        // Log status
        console.log(`📊 Positions open: ${this.positions.size}`);
        
      } catch (error) {
        console.error('Scheduled scan error:', error.message);
      }
    });
    
    console.log('✅ Trading Bot started - Running 24/7');
  }
  
  stop() {
    this.isRunning = false;
    console.log('🛑 Trading Bot stopped');
  }
}

// Export singleton
export const tradingBot = new TradingBot();

// Auto-start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  tradingBot.start();
}