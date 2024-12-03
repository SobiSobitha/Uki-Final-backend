// routes/admin.js
const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event'); // Ensure the path is correct
const router = express.Router();

// Admin approval for organizers
router.post('/approve-organizer', async (req, res) => {
  const { userId } = req.body;  // Make sure to use userId

  try {
      console.log('Approving organizer with ID:', userId); // Debugging log
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found.' });
      }
      if (user.role !== 'Organizer') {
          return res.status(400).json({ message: 'User is not an organizer.' });
      }

      user.isApproved = true;
      await user.save();
      res.status(200).json({ message: 'Organizer approved successfully.' });
  } catch (err) {
      console.error('Error in approving organizer:', err); // Log errors
      res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// routes/admin.js
router.post('/suspend-user', async (req, res) => {
  const { userId } = req.body;

  try {
      // Find the user by ID
      const user = await User.findById(userId);

      if (!user) {
          return res.status(404).json({ message: 'User not found.' });
      }

      // Suspend the user (you may need to define how to suspend a user)
      user.isSuspended = true; // Assuming you have an `isSuspended` field in your User model
      await user.save();

      res.status(200).json({ message: 'User suspended successfully.' });
  } catch (error) {
      console.error('Error suspending user:', error);
      res.status(500).json({ message: 'Server error. Please try again.' });
  }
});
// router.get('/stats', async (req, res) => {
//   try {
//     const totalOrganizers = await User.countDocuments({ role: 'Organizer' });
//     console.log('Total Organizers:', totalOrganizers); // Log total organizers

//     const totalVolunteers = await User.countDocuments({ role: 'Volunteer' });
//     console.log('Total Volunteers:', totalVolunteers); // Log total volunteers

//     const eventsCreated = await Event.countDocuments();
//     console.log('Events Created:', eventsCreated); // Log total events created

//     res.status(200).json({ totalOrganizers, totalVolunteers, eventsCreated });
//   } catch (error) {
//     console.error('Error fetching admin stats:', error);
//     res.status(500).json({ message: 'Error fetching admin stats', error });
//   }
// });
router.get('/stats', async (req, res) => {
  try {
      const totalOrganizers = await User.countDocuments({ role: 'Organizer' });
      const totalVolunteers = await User.countDocuments({ role: 'volunteer' });
      const eventsCreated = await Event.countDocuments();

      res.status(200).json({ totalOrganizers, totalVolunteers, eventsCreated });
  } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Error fetching admin stats', error });
  }
});


router.get('/pending-organizers', async (req, res) => {
  try {
      const pendingOrganizers = await User.find({ role: 'Organizer', isApproved: false });
      res.status(200).json(pendingOrganizers);
  } catch (error) {
      console.error('Error fetching pending organizers:', error);
      res.status(500).json({ message: 'Error fetching pending organizers.' });
  }
});


// Reject organizer route (optional)
router.post('/reject-organizer/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        // Check if user exists
        if (!user) {
            return res.status(404).json({ message: 'Organizer not found.' });
        }

        // Optional: You can either delete or change status
        await User.findByIdAndRemove(req.params.id); // Delete the user
        res.status(200).json({ message: 'Organizer rejected successfully.' });
    } catch (error) {
        console.error('Error rejecting organizer:', error);
        res.status(500).json({ message: 'Error rejecting organizer.' });
    }
});

module.exports = router;
