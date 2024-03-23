const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
  // Add other fields as necessary, e.g., email, etc.
});

module.exports = mongoose.model('User', userSchema);
