const res = await fetch('http://127.0.0.1:9222/json/list');
const targets = await res.json();
const p = targets.find((t) => t.type === 'page');
const ws = new WebSocket(p.webSocketDebuggerUrl);

ws.onopen = () => {
  ws.send(
    JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        returnByValue: true,
        expression: `(() => {
          const st = window.ScrollTrigger.getAll()[0];
          const tl = st.animation;
          return JSON.stringify({
            labels: tl.labels,
            totalDuration: tl.duration(),
            stStart: st.start,
            stEnd: st.end
          });
        })()`,
      },
    })
  );
};

ws.onmessage = (e) => {
  console.log(JSON.parse(e.data).result.result.value);
  ws.close();
};
