import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

// Register function
export const register = async (req, res) => {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create and save the user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role,
            approved: role === 'Organizer' ? false : true // Auto-approve volunteers, organizers need admin approval
        });

        await newUser.save();

        // Generate a token
        const token = jwt.sign({ userId: newUser._id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Return the full user data and token
        return res.status(201).json({
            message: "User created successfully",
            token,
            user: { // Return complete user data (excluding sensitive data)
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (err) {
        console.error('Error registering user:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


// Login function
export const login = async (req, res) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    try {
        // Fetch user by email
        const user = await User.findOne({ email });

        // Check if user exists
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if user is approved (for organizers)
        if (user.role === 'Organizer' && !user.approved) {
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
            role: user.role
        });
    } catch (err) {
        console.error('Error during login:', err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
