const express = require('express');
const bcrypt = require('bcryptjs'); // For password hashing
const User = require('../models/User'); // Import the User model
const Event = require('../models/Event'); // Import Event model if needed
const { approveOrganizer } = require('../controllers/userController');
const router = express.Router();

// routes/user.js
router.get('/', async (req, res) => {
    try {
      const users = await User.find(); // Assuming you want all users
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users' });
    }
  });
  
  // Route to approve organizer
router.put('/approve-organizer/:id', approveOrganizer);
// User Registration Route
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        // Check if the email is already in use
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Set default role if not provided
        const userRole = role === 'Organizer' ? 'Organizer' : 'volunteer';

        // Create a new user with the appropriate role and approval status
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: userRole,
            isApproved: userRole === 'Organizer' ? false : true,  // Organizers require approval
        });

        // Save the new user in the database
        await newUser.save();

        res.status(201).json({ msg: 'User registered successfully, pending approval if organizer' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// Get all volunteers (Organizers can view volunteers)
router.get('/volunteers', async (req, res) => {
    try {
        const volunteers = await User.find({ role: 'volunteer' });
        res.json(volunteers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching volunteers' });
    }
});

// Get volunteer details with assigned roles and tasks for a specific event (Organizer only)
router.get('/volunteers/:eventId', async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId).populate('volunteers.user', 'name email');
        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        // Return only volunteer details (name, role, task)
        const volunteers = event.volunteers.map(volunteer => ({
            user: volunteer.user,
            role: volunteer.role,
            task: volunteer.task,
        }));

        res.json(volunteers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching volunteers for this event' });
    }
});

// Get all approved organizers
router.get('/organizers', async (req, res) => {
    try {
        const organizers = await User.find({ role: 'Organizer', isApproved: true });
        res.json(organizers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching organizers' });
    }
});

// Get specific organizer details (Admin can fetch specific organizer details)
router.get('/organizers/:id', async (req, res) => {
    try {
        const organizer = await User.findById(req.params.id);
        if (!Organizer || Organizer.role !== 'Organizer') {
            return res.status(404).json({ message: 'Organizer not found' });
        }
        res.json(organizer);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching organizer details' });
    }
});

// Add this: Get all pending organizers (Admin can approve them)
router.get('/pending-organizers', async (req, res) => {
    try {
        const pendingOrganizers = await User.find({ role: 'Organizer', isApproved: false });
        res.status(200).json(pendingOrganizers);
    } catch (error) {
        console.error('Error fetching pending organizers:', error);
        res.status(500).json({ message: 'Error fetching pending organizers.' });
    }
});

module.exports = router;
