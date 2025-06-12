const { handleRequests } = require('../services/requestHandler');

module.exports = (req, res) => {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const parsed = JSON.parse(body);
      await handleRequests(parsed);
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Processing started' }));
    } catch (e) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: e.message }));
    }
  });
};
