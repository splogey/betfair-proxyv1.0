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
  .app { max-width: 780px; margin: 0 auto; padding: 2rem 1.5rem; }
  .header { display: flex; align-items: center; gap: 10px; margin-bottom: 2rem; }
  .header h1 { font-size: 20px; font-weight: 600; }
  .dot { width: 9px; height: 9px; border-radius: 50%; background: #bbb; flex-shrink: 0; transition: background 0.3s; }
  .dot.connected { background: #3B6D11; }
  .dot.error { background: #A32D2D; }
  .conn-label { font-size: 13px; color: #888; }
  .header-right { margin-left: auto; }
  button { padding: 7px 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; cursor: pointer; background: #fff; color: #444; transition: background 0.15s; }
  button:hover { background: #f0f0f0; }
  .sport-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .sport-tab { padding: 7px 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px; cursor: pointer; background: #fff; color: #666; }
  .sport-tab:hover { background: #f0f0f0; }
  .sport-tab.active { border-color: #888; color: #111; font-weight: 500; }
  .market-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 10px; cursor: pointer; transition: border-color 0.15s; }
  .market-card:hover { border-color: #ccc; }
  .market-card.expanded { border-color: #aaa; }
  .market-title { font-size: 14px; font-weight: 600; color: #111; margin-bottom: 4px; }
  .market-meta { font-size: 12px; color: #888; display: flex; gap: 14px; }
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
  .loading { text-align: center; padding: 2.5rem; color: #aaa; font-size: 14px; }
  .error-box { background: #fff0f0; border: 1px solid #fcc; border-radius: 8px; padding: 0.75rem 1rem; font-size: 13px; color: #800; margin-bottom: 1rem; }
  .empty { text-align: center; padding: 2rem; color: #aaa; font-size: 13px; }
  .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid #ddd; border-top-color: #888; border-radius: 50%; animation: spin 0.7s linear infinite; margin-right: 6px; vertical-align: middle; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .token-bar { background: #fffbe6; border: 1px solid #f5e04a; border-radius: 8px; padding: 0.75rem 1rem; font-size: 13px; color: #665a00; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .token-bar input { flex: 1; min-width: 200px; padding: 5px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 12px; font-family: monospace; }
  .token-bar button { background: #f5e04a; border-color: #d4b800; color: #333; }
</style>
</head>
<body>
<div class="app">
  <div class="header">
    <div class="dot" id="dot"></div>
    <h1>Betfair Exchange</h1>
    <span class="conn-label" id="connLabel">connecting...</span>
    <div class="header-right">
      <button onclick="loadMarkets()">&#8635; refresh</button>
    </div>
  </div>
  <div class="token-bar">
    <span>Session token:</span>
    <input type="text" id="tokenInput" placeholder="paste ssoid here if expired" />
    <button onclick="updateToken()">update</button>
  </div>
  <div id="errorBox"></div>
  <div class="sport-tabs">
    <button class="sport-tab active" onclick="selectSport(this,'1')">Football</button>
    <button class="sport-tab" onclick="selectSport(this,'7')">Horse Racing</button>
    <button class="sport-tab" onclick="selectSport(this,'2')">Tennis</button>
    <button class="sport-tab" onclick="selectSport(this,'4')">Cricket</button>
    <button class="sport-tab" onclick="selectSport(this,'6423')">American Football</button>
    <button class="sport-tab" onclick="selectSport(this,'7522')">Basketball</button>
    <button class="sport-tab" onclick="selectSport(this,'8')">Rugby Union</button>
  </div>
  <div id="markets"><div class="loading"><span class="spinner"></span>loading markets...</div></div>
</div>
<script>
const APP_KEY = 'pDnjZ8Me3juqh4gc';
let token = '57k2V1GpXUmeEX8TCdVKrdzM5B97HAXTxfYwKcnKiv8=';
let currentSport = '1';
let expandedId = null;
document.getElementById('tokenInput').value = token;
function updateToken() { const v = document.getElementById('tokenInput').value.trim(); if (v) { token = v; loadMarkets(); } }
function setStatus(state, msg) { document.getElementById('dot').className = 'dot ' + state; document.getElementById('connLabel').textContent = msg; }
function showError(msg) { document.getElementById('errorBox').innerHTML = '<div class="error-box">&#9888; ' + msg + '</div>'; document.getElementById('markets').innerHTML = ''; setStatus('error', 'not connected'); }
async function apiCall(method, params) {
  const body = [{ jsonrpc: '2.0', method: 'SportsAPING/v1.0/' + method, params, id: 1 }];
  const res = await fetch('/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appKey: APP_KEY, sessionToken: token, body }) });
  const data = await res.json();
  if (data[0] && data[0].result) return data[0].result;
  throw new Error((data[0] && data[0].error && data[0].error.data && data[0].error.data.APINGException && data[0].error.data.APINGException.errorCode) || 'API error');
}
function selectSport(el, id) { document.querySelectorAll('.sport-tab').forEach(t => t.classList.remove('active')); el.classList.add('active'); currentSport = id; expandedId = null; loadMarkets(); }
async function loadMarkets() {
  document.getElementById('errorBox').innerHTML = '';
  document.getElementById('markets').innerHTML = '<div class="loading"><span class="spinner"></span>loading markets...</div>';
  setStatus('', 'connecting...');
  try {
    const now = new Date(); const to = new Date(now.getTime() + 48 * 3600 * 1000);
    const markets = await apiCall('listMarketCatalogue', { filter: { eventTypeIds: [currentSport], marketStartTime: { from: now.toISOString(), to: to.toISOString() } }, marketProjection: ['MARKET_START_TIME', 'RUNNER_DESCRIPTION', 'EVENT'], sort: 'FIRST_TO_START', maxResults: 25 });
    setStatus('connected', 'connected');
    renderMarkets(markets);
  } catch(e) {
    if (e.message === 'NO_SESSION') showError('Session expired — paste a fresh ssoid above.');
    else showError('Failed to load markets: ' + e.message);
  }
}
function renderMarkets(markets) {
  const c = document.getElementById('markets');
  if (!markets || !markets.length) { c.innerHTML = '<div class="empty">no markets found in the next 48 hours</div>'; return; }
  c.innerHTML = markets.map(m => {
    const start = m.marketStartTime ? new Date(m.marketStartTime).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    const rj = encodeURIComponent(JSON.stringify(m.runners || []));
    return '<div class="market-card" id="mc-' + m.marketId + '" onclick="toggle(\'' + m.marketId + '\', this)"><div class="market-title">' + (m.event ? m.event.name + ' — ' : '') + m.marketName + '</div><div class="market-meta"><span>' + start + '</span><span>' + (m.runners||[]).length + ' runners</span></div><div class="runners" id="r-' + m.marketId + '" data-runners="' + rj + '"><div class="loading" style="padding:1rem"><span class="spinner"></span>loading odds...</div></div></div>';
  }).join('');
}
async function toggle(id, card) {
  if (card.classList.contains('expanded')) { card.classList.remove('expanded'); expandedId = null; return; }
  if (expandedId) { const p = document.getElementById('mc-' + expandedId); if (p) p.classList.remove('expanded'); }
  card.classList.add('expanded'); expandedId = id;
  const rdiv = document.getElementById('r-' + id);
  const runners = JSON.parse(decodeURIComponent(rdiv.dataset.runners || '[]'));
  try {
    const books = await apiCall('listMarketBook', { marketIds: [id], priceProjection: { priceData: ['EX_BEST_OFFERS'], exBestOffersOverrides: { bestPricesDepth: 1 } } });
    const book = books && books[0];
    if (!book || !book.runners) { rdiv.innerHTML = '<div class="loading">no odds available</div>'; return; }
    rdiv.innerHTML = '<div class="col-headers"><div class="col-header">back</div><div class="col-header">lay</div></div>' + book.runners.map(r => {
      const meta = runners.find(x => x.selectionId === r.selectionId);
      const name = meta ? meta.runnerName : 'runner ' + r.selectionId;
      const back = r.ex && r.ex.availableToBack && r.ex.availableToBack[0];
      const lay = r.ex && r.ex.availableToLay && r.ex.availableToLay[0];
      return '<div class="runner-row"><span class="runner-name">' + name + '</span><div class="odds-group"><div class="odds-pill odds-back">' + (back ? back.price.toFixed(2) : '—') + '</div><div class="odds-pill odds-lay">' + (lay ? lay.price.toFixed(2) : '—') + '</div></div></div>';
    }).join('');
  } catch(e) { rdiv.innerHTML = '<div class="loading">could not load odds: ' + e.message + '</div>'; }
}
loadMarkets();
</script>
</body>
</html>`);
});
 
app.post('/api', async (req, res) => {
  try {
    const { appKey, sessionToken, body } = req.body;
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
    res.status(500).json({ error: e.message });
  }
});
 
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('Proxy running on port ' + PORT));
