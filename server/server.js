const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load Config
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(express.json()); // Allow JSON data
app.use(cors()); // Allow Frontend connection

// --- ROUTES ---
// This connects the URL '/api/users' to your userRoutes file
app.use('/api/users', require('./routes/userRoutes'));

// Test Route
app.get('/', (req, res) => {
  res.send('TrainWithMe API is running...');
});

// --- ERROR HANDLER (Makes errors readable) ---
app.use((err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});