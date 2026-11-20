const res = await fetch('http://127.0.0.1:9222/json/list');
const targets = await res.json();
const p = targets.find((t) => t.type === 'page');
const ws = new WebSocket(p.webSocketDebuggerUrl);

ws.onopen = () => {
  ws.send(JSON.stringify({ id: 1, method: 'Page.reload' }));
};

ws.onmessage = async (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id === 1) {
    console.log('Page reloaded. Waiting 3 seconds...');
    setTimeout(async () => {
      ws.send(
        JSON.stringify({
          id: 2,
          method: 'Runtime.evaluate',
          params: {
            returnByValue: true,
            expression: `(() => {
              const st = window.ScrollTrigger.getAll()[0];
              const tl = st.animation;
              return JSON.stringify({
                labels: tl.labels,
                totalDuration: tl.duration()
              });
            })()`,
          },
        })
      );
    }, 3000);
  } else if (msg.id === 2) {
    console.log('New timeline labels:', msg.result.result.value);
    ws.close();
  }
};
