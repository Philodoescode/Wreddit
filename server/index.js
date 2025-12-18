require('dotenv').config();


const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, 'uploads', 'avatars'),
  path.join(__dirname, 'uploads', 'banners'),
  path.join(__dirname, 'uploads', 'posts')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created upload directory: ${dir}`);
  }
});

// The MONGO_URI is set in docker-compose.yml
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wreddit';

// 2. Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connection successful!'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

// Explicitly configure CORS to allow requests from the client's origin.
// This must be placed before you register any routes.
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'https://wreddit-client.onrender.com'];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // if you want to send cookies / auth headers
}));

app.use(morgan('dev'));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use('/api/users', require('./routes/user.routes'));
app.use('/api/communities', require('./routes/community.routes'));
app.use('/api/posts', require('./routes/post.routes'));

// Mount comment routes under /api/posts for the GET endpoint
// and also make the POST available at /api/comments
app.use('/api/posts', require('./routes/comment.routes'));
app.use('/api/comments', require('./routes/comment.routes')); // Keep this too

app.use('/api/search', require('./routes/search.routes'));
app.use('/api/vote', require('./routes/vote.routes'));
app.use('/api/chat', require('./routes/chat.routes'));

app.get('/', (req, res) => {
  res.send('Hello from the Wreddit server! MongoDB connection initiated.');
});

// Create HTTP server and attach WebSocket
const server = http.createServer(app);
const { initWebSocket } = require('./websocket/wsServer');
initWebSocket(server);

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});