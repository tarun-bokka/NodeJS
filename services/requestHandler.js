const https = require('https');
const { transformPayload } = require('../utils/transformBody');
const { sendToClient } = require('./websocketService');

async function sendPost(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const { hostname, pathname } = new URL(url);

    const options = {
      hostname,
      path: pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      }
    };

    const req = https.request(options, res => {
      res.on('data', () => {}); // discard response
      res.on('end', () => resolve(res.statusCode === 200));
    });

    req.on('error', () => reject(false));
    req.write(data);
    req.end();
  });
}

async function handleRequests({ source_endpoint, mapper, source_data, client_id }) {
  const status = source_data.map(entry => ({ _id: entry._id, status: 'pending' }));
  sendToClient(client_id, status);

  await Promise.all(source_data.map(async (item, idx) => {
    const payload = transformPayload(source_endpoint.body, mapper, item);
    payload.id = item._id;

    try {
      const success = await sendPost(source_endpoint.url, payload);
      status[idx].status = success ? 'success' : 'failed';
    } catch {
      status[idx].status = 'failed';
    }

    sendToClient(client_id, status);
  }));
}

module.exports = { handleRequests };
