const mongoose = require('mongoose');

const UserSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'main_user_collection', required: true },
  token: { type: String, required: true, unique: true },
  location: String,
  ip: String,
  createdAt: { type: Date, default: Date.now, expires: '7d' }, // auto expire after 7 days
});

module.exports = mongoose.model('user_session', UserSessionSchema);
