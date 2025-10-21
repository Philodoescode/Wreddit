const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from the Wreddit server!');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});