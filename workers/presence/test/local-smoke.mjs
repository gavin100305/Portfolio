import assert from 'node:assert/strict';
import WebSocket from 'ws';

const origin = 'http://localhost:3000';
const base = 'http://127.0.0.1:8787';
async function join() {
  const response = await fetch(`${base}/ticket`, { method: 'POST', headers: { Origin: origin } });
  assert.equal(response.status, 200, `ticket status ${response.status}`);
  const ticket = await response.json();
  const socket = new WebSocket(`${base.replace('http', 'ws')}/connect`, ['ship-v1', `ticket.${ticket.token}`], { origin });
  await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', reject); });
  return socket;
}
function nextSync(socket, predicate) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for visitor snapshot')), 3000);
    const onMessage = (raw) => {
      const frame = JSON.parse(raw.toString());
      if (frame.type === 'sync' && predicate(frame.visitors)) {
        clearTimeout(timeout); socket.off('message', onMessage); resolve(frame.visitors);
      }
    };
    socket.on('message', onMessage);
  });
}
const first = await join();
const second = await join();
const moved = nextSync(second, (visitors) => visitors.length === 2 && visitors.some((visitor) => visitor.x === 1676));
first.send(JSON.stringify({ x: 1676, y: 1344, facing: 'right', sequence: 0 }));
assert.equal((await moved).length, 2);
await Promise.all([first, second].map((socket) => new Promise((resolve) => {
  socket.once('close', resolve);
  socket.close();
})));
console.log('PASS: local tickets, two-person lobby, movement fan-out, and close');
