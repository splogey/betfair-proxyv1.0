const express = require('express');
const fetch = require('node-fetch');

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Betfair Exchange</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f3; color: #1a1a1a; min-height: 100vh; }
  .app { max-width: 680px; margin: 0 auto; padding: 2rem 1.5rem; }
  h1 { font-size: 20px; font-weight: 600; margin-bottom: 1.5rem; }

  .token-bar { background: #fffbe6; border: 1px solid #e8d800; border-radius: 10px; padding: 1rem; margin-bottom: 1rem; }
  .token-bar label { font-size: 13px; font-weight: 500; color: #555; display: block; margin-bottom: 6px; }
  .token-row { display: flex; gap: 8px; }
  .token-row input { flex: 1; padding: 7px 10px; border: 1px solid #ddd; border-radius: 7px; font-size: 12px; font-family: monospace; }
  .token-row button { padding: 7px 16px; border: 1px solid #c8b800; border-radius: 7px; background: #f5e04a; color: #333; font-size: 13px; cursor: pointer; font-weight: 500; transition: all 0.15s; }
  .token-row button:hover { background: #edd800; }
  .token-row button.pressed { background: #3B6D11; color: #fff; border-color: #2a4f0c; }

  .status-box { background: #fff; border: 1px solid #e8e8e8; border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 1rem; font-size: 13px; color: #555; display: flex; align-items: center; gap: 10px; min-height: 44px; }
  .status-box.ok { border-color: #b2d99b; background: #f4fbf0; color: #2a5a10; }
  .status-box.err { border-color: #fcc; background: #fff0f0; color: #800; }
  .status-box.loading { border-color: #d0e8fb; background: #f0f7ff; color: #0C447C; }
  .dot { width: 9px; height: 9px; border-radius: 50%; background: #bbb; flex-shrink: 0; }
  .dot.ok { background: #3B6D11; }
  .dot.err { background: #A32D2D; }
  .dot.loading { background: #3a7fc1; }

  .refresh-btn { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; background: #fff; font-size: 13px; cursor: pointer; color: #444; margin-bottom: 1.25rem; transition: all 0.15s; font-weight: 500; }
  .refresh-btn:hover { background: #f0f0f0; }
  .refresh-btn.pressed { background: #3a7fc1; color: #fff; border-color: #2a5fa0; }
  .refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .market-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 10px; cursor: pointer; transition: border-color 0.15s; }
  .market-card:hover { border-color: #ccc; }
  .market-card.expanded { border-color: #aaa; }
  .market-title { font-size: 14px; font-weight: 600; color: #111; margin-bottom: 4px; }
  .market-meta { font-size: 12px; color: #888; }
  .runners { margin-top: 12px; border-top: 1px solid #f0f0f0; padding-top: 12px; display: none; }
  .market-card.expanded .runners { display: block; }
  .col-headers { display: flex; justify-content: flex-end; gap: 16px; padding: 0 0 4px; }
  .col-header { min-width: 56px; text-align: center; font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 0.05em; }
  .runner-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f5f5f5; }
  .runner-row:last-child { border-bottom: none; }
  .runner-name { font-size: 13px; color: #222; flex: 1; }
  .odds-pill { min-width: 56px; text-align: center; padding: 5px 8px; border-radius: 7px; font-size: 13px; font-weight: 600; }
  .odds-back { background: #deeefb; color: #0C447C; }
  .odds-lay { background: #fde8df; color: #712B13; }
  .odds-group { display: flex; gap: 16px; align-items: center; }
  .spinner { display: inline-block; width: 13px; height: 13px; border: 2px solid #ccc; border-top-color: #3a7fc1; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .empty { text-align: center; padding: 2rem; color: #aaa; font-size: 13px; }
</style>
</head>
<body>
<div class="app">
  <h1>🎾 Betfair — Tennis Markets</h1>

  <div class="token-bar">
    <label>Session token (ssoid) — refresh from Betfair developer tools if expired</label>
    <div class="token-row">
      <input type="text" id="tokenInput" placeholder="paste ssoid here" />
      <button id="tokenBtn" onclick="updateToken()">use token</button>
    </div>
  </div>

  <div class="status-box" id="statusBox">
    <div class="dot" id="dot"></div>
    <span id="statusMsg">waiting for token...</span>
  </div>

  <button class="refresh-btn" id="refreshBtn" onclick="loadMarkets()">↻ load markets</button>

  <div id="markets"></div>
</div>

<script>
let token = '';
let expandedId = null;

function setStatus(type, msg) {
  const box = document.getElementById('statusBox');
  const dot = document.getElementById('dot');
  box.className = 'status-box ' + type;
  dot.className = 'dot ' + type;
  document.getElementById('statusMsg').textContent = msg;
}

function flashBtn(id, successText, duration) {
  const btn = document.getElementById(id);
  const original = btn.textContent;
  btn.classList.add('pressed');
  btn.textContent = successText;
  setTimeout(() => { btn.classList.remove('pressed'); btn.textContent = original; }, duration || 1200);
}

function updateToken() {
  const val = document.getElementById('tokenInput').value.trim();
  if (!val) { setStatus('err', 'please paste a token first'); return; }
  token = val;
  flashBtn('tokenBtn', '✓ token saved', 1500);
  setStatus('ok', 'token saved — click load markets');
}

async function apiCall(method, params) {
  const body = [{ jsonrpc: '2.0', method: 'SportsAPING/v1.0/' + method, params, id: 1 }];
  const res = await fetch('/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appKey: 'pDnjZ8Me3juqh4gc', sessionToken: token, body })
  });
  const data = await res.json();
  if (data[0] && data[0].result) return data[0].result;
  throw new Error((data[0] && data[0].error && data[0].error.data && data[0].error.data.APINGException && data[0].error.data.APINGException.errorCode) || 'API error');
}

async function loadMarkets() {
  if (!token) { setStatus('err', 'paste your ssoid token above and click use token first'); return; }
  const btn = document.getElementById('refreshBtn');
  btn.disabled = true;
  btn.classList.add('pressed');
  btn.textContent = 'loading...';
  document.getElementById('markets').innerHTML = '';
  expandedId = null;

  try {
    setStatus('loading', 'step 1/2 — fetching tennis markets...');
    const now = new Date();
    const to = new Date(now.getTime() + 48 * 3600 * 1000);
    const markets = await apiCall('listMarketCatalogue', {
      filter: { eventTypeIds: ['2'], marketStartTime: { from: now.toISOString(), to: to.toISOString() } },
      marketProjection: ['MARKET_START_TIME', 'RUNNER_DESCRIPTION', 'EVENT'],
      sort: 'FIRST_TO_START',
      maxResults: 1
    });

    if (!markets || !markets.length) {
      setStatus('err', 'no tennis markets found in the next 48 hours');
      btn.disabled = false; btn.classList.remove('pressed'); btn.textContent = '↻ load markets';
      return;
    }

    const m = markets[0];
    setStatus('loading', 'step 2/2 — fetching odds for ' + (m.event ? m.event.name : m.marketName) + '...');

    const books = await apiCall('listMarketBook', {
      marketIds: [m.marketId],
      priceProjection: { priceData: ['EX_BEST_OFFERS'], exBestOffersOverrides: { bestPricesDepth: 1 } }
    });

    const book = books && books[0];
    setStatus('ok', 'connected — showing next tennis market');

    const start = m.marketStartTime ? new Date(m.marketStartTime).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    const runners = m.runners || [];

    let runnersHTML = '<div class="empty">no odds available</div>';
    if (book && book.runners && book.runners.length) {
      runnersHTML = '<div class="col-headers"><div class="col-header">back</div><div class="col-header">lay</div></div>' +
        book.runners.map(r => {
          const meta = runners.find(x => x.selectionId === r.selectionId);
          const name = meta ? meta.runnerName : 'runner ' + r.selectionId;
          const back = r.ex && r.ex.availableToBack && r.ex.availableToBack[0];
          const lay = r.ex && r.ex.availableToLay && r.ex.availableToLay[0];
          return '<div class="runner-row"><span class="runner-name">' + name + '</span><div class="odds-group"><div class="odds-pill odds-back">' + (back ? back.price.toFixed(2) : '—') + '</div><div class="odds-pill odds-lay">' + (lay ? lay.price.toFixed(2) : '—') + '</div></div></div>';
        }).join('');
    }

    document.getElementById('markets').innerHTML =
      '<div class="market-card expanded">' +
        '<div class="market-title">' + (m.event ? m.event.name + ' — ' : '') + m.marketName + '</div>' +
        '<div class="market-meta">' + start + ' &nbsp;·&nbsp; ' + runners.length + ' players</div>' +
        '<div class="runners" style="display:block">' + runnersHTML + '</div>' +
      '</div>';

  } catch(e) {
    if (e.message === 'NO_SESSION') {
      setStatus('err', 'session expired — get a fresh ssoid from Betfair and paste it above');
    } else {
      setStatus('err', 'error: ' + e.message);
    }
  }

  btn.disabled = false;
  btn.classList.remove('pressed');
  btn.textContent = '↻ load markets';
}
</script>
</body>
</html>`);
});

app.post('/api', async (req, res) => {
  try {
    const { appKey, sessionToken, body } = req.body;
    console.log('API call received, method:', body && body[0] && body[0].method);
    const response = await fetch('https://api.betfair.com/exchange/betting/json-rpc/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Application': appKey,
        'X-Authentication': sessionToken,
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('API error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('Proxy running on port ' + PORT));
