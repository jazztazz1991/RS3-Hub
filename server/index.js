const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const passport = require('./config/passport');
// Import sequelize and models from models/index to ensure associations are set
const { sequelize, Character } = require('./models');
const authRoutes = require('./routes/auth');
const characterRoutes = require('./routes/characters');
const slayerRoutes = require('./routes/slayer');
const questRoutes = require('./routes/quests');
const reportRoutes = require('./routes/reports');
const suggestionRoutes = require('./routes/suggestions');
const userRoutes = require('./routes/users');
const itemRoutes = require('./routes/items');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust Proxy for Render (Required for Secure Cookies over HTTPS)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Database Pool for Sessions
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'rs3hub',
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
    };

const pool = new Pool(poolConfig);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Session Setup
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('SESSION_SECRET must be set in production'); })() : 'dev_secret_key'),
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
app.use('/api/slayer', slayerRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/users', require('./routes/users'));
app.use('/api/items', itemRoutes);

// Proxy route for Jagex Hiscores (with Caching for authenticated users)
app.get('/api/hiscores/:player', async (req, res) => {
  const { player } = req.params;

  try {
    const response = await axios.get(`https://secure.runescape.com/m=hiscore/index_lite.ws?player=${player}`);

    res.send(response.data);

    // Only cache to DB if user is authenticated
    if (req.user) {
        try {
            const char = await Character.findOne({
                where: { userId: req.user.id, name: player }
            });
            if (char) {
                char.last_known_stats = response.data;
                await char.save();
            }
        } catch (dbErr) {
            console.error("Failed to update character cache:", dbErr.message);
        }
    }

  } catch (err) {
    const status = err.response?.status;

    // Player not found on Jagex hiscores
    if (status === 404) {
      return res.status(404).json({ error: 'Player not found on hiscores.' });
    }

    console.error('Error fetching live hiscores:', err.message);

    // Fallback to cached data for authenticated users only
    if (req.user) {
        try {
            const char = await Character.findOne({
                where: { userId: req.user.id, name: player }
            });
            if (char && char.last_known_stats) {
                return res.send(char.last_known_stats);
            }
        } catch (dbErr) {
            console.error("Failed to retrieve cache:", dbErr.message);
        }
    }

    res.status(502).json({ error: 'Jagex hiscores are currently unavailable. Please try again later.' });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // In Express 5, use regex /.*/ to match all routes for SPA fallback
  app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('RS3 Efficiency Hub API is running (Dev Mode)');
  });
}

// Sync Database and Start Server
sequelize.sync({ alter: true })
  .then(async () => {
    console.log('Database synced');

    // One-time migration: promote all legacy isAdmin=true users to owner role
    await sequelize.query(
      "UPDATE users SET role = 'owner' WHERE \"isAdmin\" = true AND role = 'user'"
    ).catch(err => console.warn('Role migration skipped (isAdmin column may not exist):', err.message));

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });
