const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // User model
const router = express.Router();
require('dotenv').config();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

// Register as Volunteer
// Register as Volunteer
router.post('/register/volunteer', async (req, res) => {
  const { name, username, email, password } = req.body;

  // Input validation
  if (!name || !username || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.status(400).json({ success: false, error: 'User already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ name, username, email, password: hashedPassword, role: 'volunteer', isApproved: true });
      await newUser.save();

      const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION || '1h' });

      res.status(201).json({
        success: true,
        message: 'Volunteer registration successful.',
        token,
        user: { // Add user data in response
          id: newUser._id,
          name: newUser.name,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        }
      });
  } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Server error. Please try again.', details: err.message });
  }
});


// Register as Organizer
router.post('/register/Organizer', async (req, res) => {
  const { username, email, password } = req.body;

  // Input validation
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ success: false, error: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: 'Organizer', // Set role as organizer
      isApproved: false // Initially not approved
    });
    await newUser.save();
    res.status(201).json({ success: true, message: 'Registration successful: waiting for admin approval.' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error });
  }
});

// Login function
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
      const user = await User.findOne({ email });

      // Check if user exists
      if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Check if user is approved (for organizers)
      if (user.role === 'Organizer' && !user.isApproved) {
          return res.status(403).json({ success: false, message: 'Your account is pending admin approval.' });
      }

      // Compare passwords (stored password is hashed)
      const isMatch = await bcrypt.compare(password, user.password);

      // Check if password matches
      if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Invalid email or password' });
      }

      // Generate a JWT token
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Successful login response
      return res.status(200).json({
          success: true,
          message: "Login successful",
          token,
          user: { id: user._id, role: user.role } // Include user role in the response
      });
  } catch (err) {
      console.error('Error during login:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
router.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check if account is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.',
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Increment login count for organizer
    if (user.role === 'organizer') {
      user.loginCount += 1;

      if (user.loginCount > 1) {
        user.isBlocked = true; // Block account after the first login
        await user.save();
        return res.status(403).json({
          success: false,
          message:
            'Your account has been blocked after the first login. Please contact support.',
        });
      }

      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(200).json({
      success: true,
      token,
      user: { email: user.email, role: user.role, isBlocked: user.isBlocked },
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.post('/api/auth/block-account', async (req, res) => {
   const { email } = req.body; // Destructure email from the request body

  try {
      // Find the user by email
      const user = await User.findOne({ email });

      if (!user) {
          return res.status(404).json({ success: false, message: 'User not found.' });
      }

      // Check if the account is already blocked
      if (user.isBlocked) {
          return res.status(400).json({ success: false, message: 'Account is already blocked.' });
      }

      // Block the account
      user.isBlocked = true;
      await user.save();

      res.status(200).json({
          success: true,
          message: `Account for ${email} has been blocked.`,
      });
  } catch (error) {
      console.error('Error blocking account:', error);
      res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Admin approval for organizers
router.post('/approve-organizer/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check if the user is an organizer
    if (user.role !== 'Organizer') {
      return res.status(400).json({ success: false, message: 'Invalid request. User is not an organizer.' });
    }

    // Approve organizer
    user.approved = true;
    await user.save();

    res.json({ success: true, message: 'Organizer approved successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

module.exports = router;
