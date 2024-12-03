import Event from '../models/Event.js';
import User from '../models/User.js';

// Create an event (Organizer only)
export const createEvent = async (req, res) => {
  const { title, description, date, location } = req.body;

  const newEvent = new Event({
    title,
    description,
    date,
    location,
    createdBy: req.user._id // Use the logged-in user's ID
  });

  try {
    await newEvent.save();
    res.status(201).json({ message: 'Event created successfully', event: newEvent });
  } catch (error) {
    res.status(400).json({ message: 'Error creating event', error });
  }
};

// Delete an event (Admin only)
export const deleteEvent = async (req, res) => {
  const eventId = req.params.id;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    // Check if the user is the creator of the event or an admin
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: You cannot delete this event' });
    }
    await event.remove();
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event', error });
  }
};

// Get all events (Admin only)
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('createdBy', 'name email'); // Populate creator details
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error });
  }
};


export const suspendUser = async (req, res) => {
  const { userId } = req.body;

  try {
    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user is already suspended
    if (user.isSuspended) {
      return res.status(400).json({ message: 'User is already suspended' });
    }

    // Suspend the user
    user.isSuspended = true;
    await user.save();

    res.status(200).json({ message: 'User suspended successfully', user });
  } catch (error) {
    console.error('Error suspending user:', error); // Log the full error
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};
// Get events created by a specific organizer
export const getOrganizerEvents = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id }); // Fetch events created by the logged-in organizer
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organizer events', error });
  }
};
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
