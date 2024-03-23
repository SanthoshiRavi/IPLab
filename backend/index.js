require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User'); // Adjust path as needed
const Employee = require('./models/Employee');
const RoleSalary = require('./models/RoleSalary');

const app = express();
const port = process.env.PORT || 4000;


// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  //useCreateIndex: true, // Depending on your MongoDB driver version, this line might be unnecessary
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

const calculateStaffingScenarios = ({ currentSalary, requestedSalary, staffingSalaryPerMonth, monthsForStaffing, recruitmentCost, marketSalary }) => {
  // Ensure all numeric values are treated as floats
  const parsedCurrentSalary = parseFloat(currentSalary);
  const parsedRequestedSalary = parseFloat(requestedSalary);
  const parsedStaffingSalaryPerMonth = parseFloat(staffingSalaryPerMonth);
  const parsedMonthsForStaffing = parseFloat(monthsForStaffing);
  const parsedRecruitmentCost = parseFloat(recruitmentCost);
  const parsedMarketSalary = parseFloat(marketSalary);

  // Perform calculations using parsed float values
  const hiringCost = (parsedMarketSalary * 12) + parsedRecruitmentCost;
  const fullTimeStaffingCost = parsedMarketSalary * 12;
  const partialStaffingCost = parsedStaffingSalaryPerMonth * parsedMonthsForStaffing;
  const subsequentHiringCost = (parsedMarketSalary * (12 - parsedMonthsForStaffing)) + parsedRecruitmentCost;
  const partialAndSubsequentHiringCost = partialStaffingCost + subsequentHiringCost;
  const retentionCost = (parsedRequestedSalary - parsedCurrentSalary + parsedCurrentSalary) * 12;

  return {
    hiringCost,
    fullTimeStaffingCost,
    partialAndSubsequentHiringCost,
    retentionCost
  };
};
// Routes
// Basic test route
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// User registration route
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      username,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();
    res.status(201).json({ message: "User created!", userId: savedUser._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to register user." });
  }
});

// User login route
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, userId: user._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed." });
  }
});

// POST endpoint for submitting employee details and calculating staffing scenarios
app.post('/employee-details', async (req, res) => {
  const { employeeId, employeeName, city, role, currentSalary, requestedSalary, staffingSalaryPerMonth, monthsForStaffing, recruitmentCost } = req.body;
  
  try {
    // First, check if the role's market salary is available
    const roleSalary = await RoleSalary.findOne({ role }).exec();
    if (!roleSalary) {
      return res.status(404).json({ message: 'Role salary data not found.' });
    }

    // Calculate the staffing scenarios with the provided details and the average market salary
    const marketSalary = roleSalary.averageMarketSalary;
    const scenarios = calculateStaffingScenarios({
      currentSalary, 
      requestedSalary, 
      staffingSalaryPerMonth, 
      monthsForStaffing, 
      recruitmentCost, 
      marketSalary
    });

    // Save the employee details including the calculated scenarios
    const newEmployee = new Employee({
      employeeId,
      employeeName,
      city,
      role,
      currentSalary,
      requestedSalary,
      staffingSalaryPerMonth,
      monthsForStaffing,
      recruitmentCost,
      scenarios 
    });

    await newEmployee.save();

    // Optionally, return the saved employee details and the calculated scenarios
    res.status(201).json({ 
      message: "Employee details saved successfully", 
      employeeDetails: newEmployee,
      scenarios
    });

  } catch (error) {
    console.error("Failed to save employee details and calculate staffing scenarios:", error);
    res.status(500).json({ message: "Failed to process request." });
  }
});

  
// Starting the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
