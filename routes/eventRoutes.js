const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const User = require('../models/User');
const {
  registerVolunteerToEvent,
  createNotificationForOrganizer,
  fetchNotificationsForOrganizer
} = require('../controllers/eventController');

// Middleware to check if user is an approved organizer
const isApprovedOrganizer = async (req, res, next) => {
  const { createdBy } = req.body;

  try {
    const organizer = await User.findById(createdBy);
    if (!organizer) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (organizer.role !== 'Organizer' || !organizer.isApproved) {
      return res.status(403).json({ message: 'Only approved organizers can create events.' });
    }

    next();
  } catch (error) {
    console.error('Error in isApprovedOrganizer:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// Route to create an event
router.post('/create-event', isApprovedOrganizer, async (req, res) => {
  const { title, description, date, location, roles, tasks, createdBy } = req.body;

  try {
    const newEvent = new Event({
      title,
      description,
      date,
      location,
      roles,
      tasks,
      createdBy,
      status: 'pending'
    });

    await newEvent.save();
    res.status(201).json({ message: 'Event created successfully!', event: newEvent });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Route for volunteer selecting an event
router.post('/select-event', async (req, res) => {
  const { volunteerId, eventId } = req.body;

  try {
    await registerVolunteerToEvent(volunteerId, eventId);
    await createNotificationForOrganizer(eventId, volunteerId);
    res.status(200).send({ message: 'Event selection recorded and organizer notified' });
  } catch (err) {
    console.error('Error in select-event:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Route to get notifications for an organizer
router.get('/organizer-notifications/:organizerId', async (req, res) => {
  const { organizerId } = req.params;

  try {
    const notifications = await fetchNotificationsForOrganizer(organizerId);
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Fetch all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// Fetch specific event details including volunteers and organizer
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('volunteers.user', 'name email')
      .populate('createdBy', 'name organizationName');

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    res.json(event);
  } catch (err) {
    console.error('Error fetching event details:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;
