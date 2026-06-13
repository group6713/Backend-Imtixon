const mongoose = require('mongoose');

const telegramUserSchema = new mongoose.Schema(
  {
    telegramId: { type: Number, required: true, unique: true },
    username: String,
    firstName: String,
    lastName: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('TelegramUser', telegramUserSchema);
