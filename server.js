require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./db');
const { router: authRouter } = require('./routes/auth');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');

const app = express();

// Apply Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server environment status logger
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

// Hook API Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, 'public')));

// Fallback path to serve HTML pages directly if path doesn't match API
app.get('/:page.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', `${req.params.page}.html`));
});

// Custom error handling middleware
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({
    message: 'An internal server error occurred',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

const PORT = process.env.PORT || 5000;

// Start DB and Express server
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(` Drip Kicks Server running on port ${PORT}`);
    console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(`=============================================`);
  });
}

startServer();
