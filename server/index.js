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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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



// Proxy route for Jagex Hiscores (with Caching)
// https://secure.runescape.com/m=hiscore/index_lite.ws?player=X
app.get('/api/hiscores/:player', async (req, res) => {
  const { player } = req.params;
  
  try {
    // 1. Try fetching live data
    const response = await axios.get(`https://secure.runescape.com/m=hiscore/index_lite.ws?player=${player}`);
    
    // 2. If successful, respond to client immediately
    res.send(response.data);

    // 3. Background: Update specific character record if user is tracking it
    // We only update if a user is logged in (req.user) OR we could search purely by name across all users,
    // but usually we care about the authenticated user's context. 
    // If the frontend is calling this, it probably means the user is looking at their "Dashboard".
    if (req.user) {
        // Find the character linked to this user (Case-insensitive search for robustness)
        // Note: Postgres matches are case sensitive by default, but Sequelize findOne usually exact match.
        // We'll rely on the frontend passing the exact name stored in DB, or use ILIKE if needed.
        // For simplicity, we assume exact string match or we grab the one they "own".
        
        try {
            // Find character by name and userId
            const char = await Character.findOne({ 
                where: { 
                    userId: req.user.id,
                    name: player 
                } 
            });

            if (char) {
                // Update the stats cache
                char.last_known_stats = response.data;
                await char.save();
                console.log(`Updated cache for character: ${player}`);
            }
        } catch (dbErr) {
            console.error("Failed to update character cache:", dbErr.message);
        }
    }

  } catch (error) {
    console.error('Error fetching live hiscores:', error.message);

    // 4. Fallback: If live fetch fails, try to retrieve from DB cache
    if (req.user) {
        try {
            const char = await Character.findOne({ 
                where: { 
                    userId: req.user.id,
                    name: player
                } 
            });

            if (char && char.last_known_stats) {
                console.log(`Serving cached stats for: ${player}`);
                return res.send(char.last_known_stats);
            }
        } catch (dbErr) {
            console.error("Failed to retrieve cache:", dbErr.message);
        }
    }

    // 5. If no cache available, fail
    res.status(500).json({ error: 'Failed to fetch hiscores and no cache available' });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('RS3 Efficiency Hub API is running (Dev Mode)');
  });
}

// Sync Database and Start Server
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });
