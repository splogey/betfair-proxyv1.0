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

app.post('/login', async (req, res) => {
  try {
    const { username, password, appKey } = req.body;
    const params = new URLSearchParams({ username, password });
    const response = await fetch('https://identitysso.betfair.com/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Application': appKey,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: params
    });
    const text = await response.text();
    console.log('login raw response:', text);
    try {
      res.json(JSON.parse(text));
    } catch(e) {
      res.json({ status: 'FAIL', error: 'raw: ' + text.substring(0, 200) });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
