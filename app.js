require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const User = require('./models/User');
const UserSession = require('./models/UserSession');

const app = express();

app.use(bodyParser.json());

const JWT_SECRET = process.env.JWT_SECRET;
const MAX_SESSIONS = 3;

require('./config/passport')(passport);
app.use(passport.initialize());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Helper function to create JWT token
function createToken(userId, location, ip) {
  return jwt.sign({ id: userId, location, ip }, JWT_SECRET, { expiresIn: '7d' });
}

// /auth/login route
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password, location, ip } = req.body;

    if (!username || !password || !location || !ip) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Check active sessions count
    const sessions = await UserSession.find({ userId: user._id });
    if (sessions.length >= MAX_SESSIONS) {
      return res.status(429).json({ message: 'Too many sessions', sessions });
    }

    // Create token & save session
    const token = createToken(user._id, location, ip);
    await UserSession.create({ userId: user._id, token, location, ip });

    return res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// /auth/logout route
app.post('/auth/logout', async (req, res) => {
  try {
    const tokens = req.body;
    if (!Array.isArray(tokens)) {
      return res.status(400).json({ message: 'Body should be array of tokens' });
    }

    await UserSession.deleteMany({ token: { $in: tokens } });

    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// /auth/replaceSession route
app.post('/auth/replaceSession', async (req, res) => {
  try {
    const { oldtoken } = req.body;
    if (!oldtoken) return res.status(400).json({ message: 'Missing oldtoken' });

    const oldSession = await UserSession.findOne({ token: oldtoken });
    if (!oldSession) return res.status(404).json({ message: 'Session not found' });

    let payload;
    try {
      payload = jwt.verify(oldtoken, JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const newToken = createToken(payload.id, payload.location, payload.ip);

    oldSession.token = newToken;
    oldSession.createdAt = new Date();
    await oldSession.save();

    return res.status(200).json({ message: 'Session replaced', token: newToken });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
