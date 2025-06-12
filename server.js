const http = require('http');
const WebSocket = require('ws');
const handleMakeRequests = require('./services/makeRequests');
const { registerClient, removeClient } = require('./services/websocketService');

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/makeRequests') {
    handleMakeRequests(req, res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  ws.on('message', msg => {
    try {
      const { client_id } = JSON.parse(msg);
      registerClient(client_id, ws);
    } catch {
      ws.send(JSON.stringify({ error: 'Invalid client_id format' }));
    }
  });

  ws.on('close', () => removeClient(ws));
});

server.listen(3001, () => {
  console.log('Server running at http://localhost:3001');
});
