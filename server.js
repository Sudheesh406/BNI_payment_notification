const express = require('express');
const app = express();
require('dotenv').config();
const cookieParser = require('cookie-parser');
const loginRouter = require('./routers/adminRoute');
const paymentRouter = require('./routers/paymentRoute');
const databaseCn = require('./database/db');
const cors = require('cors');

// ✅ Allow both local and deployed frontend origins
const allowedOrigins = [
  'http://localhost:5173',              // development
  'https://evotechs.co.in'             // production
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like curl or mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS: ' + origin));
      }
    },
    credentials: true
  })
);

app.use(cookieParser());
app.use(express.json());

// Routers
app.use('/', loginRouter);
app.use('/payment', paymentRouter);

// Database connection
databaseCn();

// Server start
const PORT = process.env.PORT || 8080;
app.listen(PORT, (err) => {
  if (err) {
    console.error('Server failed to start:', err);
  } else {
    console.log(`Server running on port ${PORT}...`);
  }
});
