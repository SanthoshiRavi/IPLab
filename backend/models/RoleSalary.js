const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roleSalarySchema = new Schema({
  role: { type: String, required: true },
  location: { type: String, required: true },
  averageMarketSalary: { type: Number, required: true }
});

module.exports = mongoose.model('RoleSalary', roleSalarySchema);
