let express = require("express");
let jwt = require("jsonwebtoken");
// const admin = require('firebase-admin');
const User = require('../../models/User');

const router = express.Router();

// // Initialize Firebase Admin
// admin.initializeApp();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log("Login request body:", req.body); // ✅ DEBUG

    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user || user.authProvider === 'google') 
      return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// router.post('/google', async (req, res) => {
//   const { idToken } = req.body;

//   try {
//     const decoded = await admin.auth().verifyIdToken(idToken);
//     const { email, name } = decoded;

//     let user = await User.findOne({ email });
//     if (!user) {
//       user = new User({ email, username: name, authProvider: 'google' });
//       await user.save();
//     }

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
//     res.json({ token, user: { id: user._id, email: user.email, username: user.username } });
//   } catch (err) {
//     res.status(400).json({ message: 'Invalid Firebase token' });
//   }
// });

module.exports = router;