const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
 
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
 
app.post('/login', async (req, res) => {
  try {
    const { username, password, appKey } = req.body;
    const params = new URLSearchParams({ username, password });
    const response = await fetch('https://identitysso.betfair.com/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Application': appKey,
        'Accept': 'application/json'
      },
      body: params
    });
    const data = await response.json();
    res.json(data);
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
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
