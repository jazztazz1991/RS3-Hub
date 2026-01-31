const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const passport = require('./config/passport');
// Import sequelize and models from models/index to ensure associations are set
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const characterRoutes = require('./routes/characters');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database Pool for Sessions
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rs3hub',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Setup
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'super_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production' // true in production
  }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/api/characters', characterRoutes);

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

// Sync Database and Start Server
sequelize.sync({ force: false })
  .then(() => {
    console.log('Database synced');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });
