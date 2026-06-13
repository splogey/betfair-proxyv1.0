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

app.get('/', (req, res) => res.send('Betfair proxy running'));

app.post('/test', async (req, res) => {
  const { sessionToken, appKey } = req.body;
  console.log('TEST — appKey:', appKey);
  console.log('TEST — token length:', sessionToken ? sessionToken.length : 'null');
  console.log('TEST — token value:', sessionToken);
  try {
    const response = await fetch('https://api.betfair.com/exchange/betting/json-rpc/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Application': appKey,
        'X-Authentication': sessionToken,
        'Accept': 'application/json'
      },
      body: JSON.stringify([{ jsonrpc: '2.0', method: 'SportsAPING/v1.0/listEventTypes', params: { filter: {} }, id: 1 }])
    });
    const text = await response.text();
    console.log('TEST — Betfair raw response (first 300 chars):', text.substring(0, 300));
    res.json({ tokenReceived: sessionToken, responsePreview: text.substring(0, 300) });
  } catch(e) {
    console.error('TEST error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api', async (req, res) => {
  try {
    const { appKey, sessionToken, body } = req.body;
    console.log('API call received, method:', body && body[0] && body[0].method);
    console.log('Token received:', sessionToken);
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
    const text = await response.text();
    console.log('Betfair response preview:', text.substring(0, 200));
    try {
      res.json(JSON.parse(text));
    } catch(e) {
      res.status(500).json({ error: 'Betfair returned non-JSON: ' + text.substring(0, 200) });
    }
  } catch (e) {
    console.error('API error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('Proxy running on port ' + PORT));
