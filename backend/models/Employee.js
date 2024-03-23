const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const employeeSchema = new Schema({
  employeeId: { type: String, required: true, unique: true },
  employeeName: { type: String, required: true },
  city: { type: String, required: true },
  role: { type: String, required: true },
  currentSalary: { type: Number, required: true },
  requestedSalary: { type: Number, required: true },
  staffingSalaryPerMonth: { type: Number, required: true },
  monthsForStaffing: { type: Number, required: true },
  recruitmentCost: { type: Number, required: true },
  scenarios: { // Adding a nested object for scenarios
    hiringCost: { type: Number },
    fullTimeStaffingCost: { type: Number },
    partialAndSubsequentHiringCost: { type: Number },
    retentionCost: { type: Number },
    // Add any other calculated fields as necessary
  }
  
});

module.exports = mongoose.model('Employee', employeeSchema);
