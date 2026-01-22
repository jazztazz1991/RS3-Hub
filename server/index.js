const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/', (req, res) => {
  res.send('RS3 Efficiency Hub API is running');
});

// Proxy route for Jagex Hiscores (Example)
// https://secure.runescape.com/m=hiscore/index_lite.ws?player=X
app.get('/api/hiscores/:player', async (req, res) => {
  const { player } = req.params;
  try {
    const response = await axios.get(`https://secure.runescape.com/m=hiscore/index_lite.ws?player=${player}`);
    // Parsing logic can be added here
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching hiscores:', error.message);
    res.status(500).json({ error: 'Failed to fetch hiscores' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
