const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// --- Mock Data & Config ---
const USER_CREDENTIALS = {
  username: 'user',
  password: 'password123'
};

const JWT_SECRET = 'my_super_secret_key_for_jwt'; // In production, use a strong, env variable
let accountBalance = 1000; // Initial balance

// --- Public Route ---

// 1. Login Route (POST)
// Responds with a JWT token
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Check if credentials are correct
  if (username === USER_CREDENTIALS.username && password === USER_CREDENTIALS.password) {
    // Create a JWT
    const token = jwt.sign(
      { username: username }, // Payload
      JWT_SECRET,             // Secret key
      { expiresIn: '1h' }      // Token expires in 1 hour
    );
    
    // Send the token back
    return res.status(200).json({ token: token });
  } else {
    // Invalid credentials
    return res.status(401).json({ message: 'Invalid username or password' });
  }
});

// --- Authentication Middleware ---
// This middleware will protect the routes below
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Check if header exists and has "Bearer " prefix
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  // Extract the token
  const token = authHeader.split(' ')[1];

  // Verify the token
  try {
    const decodedPayload = jwt.verify(token, JWT_SECRET);
    // Attach user data (the payload) to the request object
    req.user = decodedPayload;
    next(); // Proceed to the protected route
  } catch (error) {
    // Token is invalid (expired or wrong signature)
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// --- Protected Routes (Require JWT) ---
// All routes below this point will use the authMiddleware

// 2. Get Balance (GET)
app.get('/balance', authMiddleware, (req, res) => {
  // If we are here, authMiddleware was successful
  res.status(200).json({ balance: accountBalance });
});

// 3. Deposit Money (POST)
app.post('/deposit', authMiddleware, (req, res) => {
  const { amount } = req.body;

  if (amount <= 0 || typeof amount !== 'number') {
    return res.status(400).json({ message: 'Invalid deposit amount' });
  }

  accountBalance += amount;
  res.status(200).json({
    message: `Deposited $${amount}`,
    newBalance: accountBalance
  });
});

// 4. Withdraw Money (POST)
app.post('/withdraw', authMiddleware, (req, res) => {
  const { amount } = req.body;

  if (amount <= 0 || typeof amount !== 'number') {
    return res.status(400).json({ message: 'Invalid withdrawal amount' });
  }

  // Check for sufficient funds
  if (amount > accountBalance) {
    return res.status(400).json({ message: 'Insufficient balance' });
  }

  accountBalance -= amount;
  res.status(200).json({
    message: `Withdrew $${amount}`,
    newBalance: accountBalance
  });
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});