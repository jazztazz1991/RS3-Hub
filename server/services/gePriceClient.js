// WeirdGloop real-time prices client for RS3 GE items.
// API: https://api.weirdgloop.org/#/exchange/get_exchange_history__game___filter_
//
// Latest endpoint (all items): /exchange/history/rs/latest
// Single item by id or name: /exchange/history/rs/latest?name=Snapdragon%20potion%20(unfinished)
const axios = require('axios');

const BASE = 'https://api.weirdgloop.org';

const http = axios.create({
  baseURL: BASE,
  timeout: 20000,
  headers: {
    'User-Agent': process.env.WIKI_USER_AGENT ||
      'RS3-Efficiency-Hub/0.1 (https://rs3-efficiency-hub.onrender.com)',
  },
});

function normalizeResponse(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.success === false) return null;
  const firstKey = Object.keys(payload).find(k => k !== 'success');
  if (!firstKey) return null;
  const entry = payload[firstKey];
  if (!entry) return null;
  return {
    // entry.id holds the numeric id whether the lookup was by id or by name
    ge_id: parseInt(entry.id, 10) || parseInt(firstKey, 10) || null,
    price: typeof entry.price === 'number' ? entry.price : null,
    volume: typeof entry.volume === 'number' ? entry.volume : null,
    timestamp: entry.timestamp || null,
  };
}

async function getLatestById(geItemId) {
  if (!geItemId) return null;
  try {
    const res = await http.get('/exchange/history/rs/latest', {
      params: { id: geItemId },
    });
    return normalizeResponse(res.data);
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

// Batch lookup by ids. Pipe-separated, max ~100 per request.
// Returns map of { [id]: { price, volume, timestamp } }.
async function getLatestByIds(geItemIds) {
  if (!geItemIds || !geItemIds.length) return {};
  try {
    const res = await http.get('/exchange/history/rs/latest', {
      params: { id: geItemIds.join('|') },
    });
    const payload = res.data;
    if (!payload || typeof payload !== 'object') return {};
    if (payload.success === false) return {};
    const out = {};
    for (const k of Object.keys(payload)) {
      if (k === 'success') continue;
      const entry = payload[k];
      if (!entry) continue;
      const id = parseInt(entry.id, 10) || parseInt(k, 10);
      if (!id) continue;
      out[id] = {
        price: typeof entry.price === 'number' ? entry.price : null,
        volume: typeof entry.volume === 'number' ? entry.volume : null,
        timestamp: entry.timestamp || null,
      };
    }
    return out;
  } catch (err) {
    if (err.response?.status === 404) return {};
    throw err;
  }
}

async function getLatestByName(itemName) {
  if (!itemName) return null;
  try {
    const res = await http.get('/exchange/history/rs/latest', {
      params: { name: itemName },
    });
    return normalizeResponse(res.data);
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

module.exports = { getLatestById, getLatestByIds, getLatestByName };
