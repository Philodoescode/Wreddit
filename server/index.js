const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 5000;

// The MONGO_URI is set in docker-compose.yml
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wreddit';

// 2. Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connection successful!'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/api/users', require('./routes/user.routes'));


app.get('/', (req, res) => {
  res.send('Hello from the Wreddit server! MongoDB connection initiated.');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});