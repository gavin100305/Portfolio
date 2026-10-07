import assert from 'node:assert/strict';
import WebSocket from 'ws';
const origin = 'http://localhost:3000';
const base = 'http://127.0.0.1:8787';
const joined = [];
try {
  for (let index = 0; index < 33; index += 1) {
    const response = await fetch(`${base}/ticket`, { method: 'POST', headers: { Origin: origin } });
    assert.equal(response.status, 200, `ticket ${index} returned ${response.status}`);
    const ticket = await response.json();
    const socket = new WebSocket('ws://127.0.0.1:8787/connect', ['ship-v1', `ticket.${ticket.token}`], { origin });
    await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
    joined.push({ socket, lobbyId: ticket.lobbyId });
  }
  assert.equal(joined.filter((entry) => entry.lobbyId === 'lobby-0').length, 32);
  assert.equal(joined[32].lobbyId, 'lobby-1');
  console.log('PASS: 32-person hard cap allocates the next guest to a second lobby');
} finally {
  await Promise.all(joined.map(({ socket }) => new Promise((resolve) => {
    if (socket.readyState === WebSocket.CLOSED) return resolve();
    socket.once('close', resolve);
    socket.close();
  })));
}
