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

app.get('/keepalive', async (req, res) => {
  const { token, appKey } = req.query;
  console.log('keepalive attempt with token:', token);
  try {
    const response = await fetch('https://identitysso.betfair.com/api/keepAlive', {
      method: 'GET',
      headers: {
        'X-Application': appKey,
        'X-Authentication': token,
        'Accept': 'application/json'
      }
    });
    const text = await response.text();
    console.log('keepalive response:', text);
    res.send(text);
  } catch(e) {
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
