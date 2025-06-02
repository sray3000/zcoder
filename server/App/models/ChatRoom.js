// models/ChatRoom.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: String,
  content: String,
  timestamp: { type: Date, default: Date.now }
});

const chatRoomSchema = new mongoose.Schema({
  roomId: String,
  messages: [messageSchema]
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
