const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback'); // Import the Feedback model

// POST route to handle feedback submission
router.post('/', async (req, res) => {
    const { eventName, feedback } = req.body;

    // Check if the required fields are present
    if (!eventName || !feedback) {
        return res.status(400).json({ message: 'Event name and feedback are required' });
    }

    try {
        // Create a new feedback document
        const newFeedback = new Feedback({
            eventName,
            feedback
        });

        // Save feedback to the database
        await newFeedback.save();

        // Return success response
        res.status(200).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        console.error('Error saving feedback:', error);
        // Return error response
        res.status(500).json({ message: 'Error submitting feedback' });
    }
});

module.exports = router;
