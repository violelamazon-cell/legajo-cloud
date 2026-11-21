import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const PORT = 5195;
const server = http.createServer((req, res) => {
  const p = path.resolve(req.url.replace(/^\//, ''));
  if (fs.existsSync(p)) {
    const ext = path.extname(p);
    res.writeHead(200, { 'Content-Type': ext === '.html' ? 'text/html' : 'image/png' });
    fs.createReadStream(p).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});
await new Promise(r => server.listen(PORT, r));

// HTML with a dark red or grid background so we can see what is in pc-off.png and mac-off.png
fs.writeFileSync('scratch/view-plates.html', `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #2b0055; margin: 0; padding: 20px; font-family: sans-serif; color: white; }
    .row { display: flex; gap: 20px; margin-bottom: 20px; }
    .card { background: #111; padding: 10px; border-radius: 8px; }
    img { max-width: 600px; display: block; background: #ff0055; border: 2px solid #fff; }
  </style>
</head>
<body>
  <h1>Plates on vivid background (#ff0055)</h1>
  <div class="row">
    <div class="card">
      <h3>pc-off.png</h3>
      <img src="/public/plates/pc-off.png" />
    </div>
    <div class="card">
      <h3>pc-off-original.png</h3>
      <img src="/public/plates/pc-off-original.png" />
    </div>
  </div>
  <div class="row">
    <div class="card">
      <h3>mac-off.png</h3>
      <img src="/public/plates/mac-off.png" />
    </div>
  </div>
</body>
</html>
`);

const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--no-sandbox',
  '--remote-debugging-port=9292',
  '--remote-debugging-address=127.0.0.1',
  '--user-data-dir=' + path.resolve('scratch/chrome-view-plates'),
  'http://127.0.0.1:' + PORT + '/scratch/view-plates.html',
  '--window-size=1600,1400',
]);

let targets = null;
for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 400));
  try {
    const res = await fetch('http://127.0.0.1:9292/json/list');
    targets = await res.json();
    if (targets && targets.length) break;
  } catch {}
}

const page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 1;
const cbs = new Map();
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && cbs.has(m.id)) {
    cbs.get(m.id)(m.result);
    cbs.delete(m.id);
  }
};
await new Promise(r => (ws.onopen = r));
function send(method, params = {}) {
  return new Promise(r => {
    const cur = id++;
    cbs.set(cur, r);
    ws.send(JSON.stringify({ id: cur, method, params }));
  });
}

await send('Page.enable');
await new Promise(r => setTimeout(r, 1500));
const shot = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('scratch/view-plates.png', Buffer.from(shot.data, 'base64'));
console.log('Saved scratch/view-plates.png');

ws.close();
chromeProc.kill();
server.close();
process.exit(0);
