require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createUser() {
  const username = 'testuser';
  const password = 'testpassword';

  const passwordHash = await User.hashPassword(password);

  const user = new User({ username, passwordHash });
  await user.save();
  console.log('User created:', username);

  mongoose.disconnect();
}

createUser();
