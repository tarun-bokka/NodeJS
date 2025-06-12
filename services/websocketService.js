const clients = new Map();

function registerClient(client_id, ws) {
  clients.set(client_id, ws);
}

function removeClient(ws) {
  for (let [id, socket] of clients.entries()) {
    if (socket === ws) {
      clients.delete(id);
      break;
    }
  }
}

function sendToClient(client_id, data) {
  const ws = clients.get(client_id);
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ client_id, data }));
  }
}

module.exports = { registerClient, removeClient, sendToClient };
