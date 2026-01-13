import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    status: '🚀 Wealth AI Node Running',
    version: '1.0.0',
    endpoints: ['/health', '/status', '/metrics'],
    docs: 'https://github.com/YOUR_USERNAME/wealth-ai-node'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// WebSocket for real-time data
wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection');
  
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Wealth AI Connected',
    time: new Date().toISOString()
  }));
  
  // Send market updates every 5 seconds
  const interval = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
      status: 'active'
    }));
  }, 5000);
  
  ws.on('close', () => {
    clearInterval(interval);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║    🚀 WEALTH AI NODE STARTED        ║
  ║    Port: ${PORT}                    ║
  ║    Mode: ${process.env.NODE_ENV || 'development'}  ║
  ║    PID: ${process.pid}              ║
  ╚══════════════════════════════════════╝
  
  📊 Dashboard: http://localhost:${PORT}
  🔌 WebSocket: ws://localhost:${PORT}
  📈 Status: Initializing trading engine...
  `);
  
  // Start trading bot after 3 seconds
  setTimeout(() => {
    import('./core/trading/24-7-bot.js').then(({ tradingBot }) => {
      tradingBot.start();
    }).catch(console.error);
  }, 3000);
});