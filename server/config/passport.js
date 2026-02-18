const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    if (!user || user.isActive === false) {
      return done(null, false); // Log out if user deleted or deactivated
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Local Strategy
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return done(null, false, { message: 'Incorrect email.' });
    }
    
    // Check if user is active
    if (user.isActive === false) {
      return done(null, false, { message: 'Your account has been deactivated.' });
    }

    const isValid = await user.validPassword(password);
    if (!isValid) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

/*
// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists with google_id
      let user = await User.findOne({ where: { google_id: profile.id } });

      if (user) {
        return done(null, user);
      }

      // Check if user exists with email, if so, link account
      if (profile.emails && profile.emails.length > 0) {
        const email = profile.emails[0].value;
        user = await User.findOne({ where: { email } });
        if (user) {
          user.google_id = profile.id;
          await user.save();
          return done(null, user);
        }
      }

      // Create new user
      const newUser = await User.create({
        google_id: profile.id,
        email: profile.emails[0].value,
        username: profile.displayName,
      });
      return done(null, newUser);

    } catch (err) {
      return done(err, null);
    }
  }
));
*/

module.exports = passport;
