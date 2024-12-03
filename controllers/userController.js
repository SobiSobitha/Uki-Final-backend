// controllers/userController.js
const User = require('../models/User');

// Approve Organizer Function
const approveOrganizer = async (req, res) => {
    const { id } = req.params;  // Fetching the ID from request parameters

    try {
        const updatedUser = await User.findByIdAndUpdate(id, { isApproved: true }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'Organizer approved successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Error approving organizer', error });
    }
};

module.exports = { approveOrganizer };
