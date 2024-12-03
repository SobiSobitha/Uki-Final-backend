const express = require('express');
const router = express.Router();

// Mock data (replace with database calls later)
let volunteers = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Coordinator' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Volunteer' },
];

const upcomingEvents = [
  { id: 1, title: 'Beach Cleanup', date: '2024-10-12' },
  { id: 2, title: 'Food Donation Drive', date: '2024-11-05' },
];

const currentTasks = [
  { id: 1, task: 'Distribute Flyers', deadline: '2024-09-30' },
];

const pastEvents = [
  { id: 1, title: 'Tree Plantation', date: '2024-08-10' },
];

const notifications = [
  { id: 1, message: 'New event added: Beach Cleanup' },
];

// Store feedbacks in an array temporarily (later you can replace this with a database)
const feedbacks = [];

/** VOLUNTEER ROUTES **/

// Fetch all volunteers
router.get('/volunteers', (req, res) => {
  res.status(200).json(volunteers);
});

// Fetch a single volunteer by ID
router.get('/volunteers/:id', (req, res) => {
  const volunteerId = parseInt(req.params.id);
  const volunteer = volunteers.find((v) => v.id === volunteerId);

  if (volunteer) {
    res.status(200).json(volunteer);
  } else {
    res.status(404).json({ message: 'Volunteer not found' });
  }
});

// Add a new volunteer
router.post('/volunteers', (req, res) => {
  const { name, email, role } = req.body;

  // Validate input
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  // Create new volunteer
  const newVolunteer = {
    id: volunteers.length + 1,
    name,
    email,
    role,
  };

  volunteers.push(newVolunteer);
  res.status(201).json(newVolunteer);
});

// Update an existing volunteer
router.put('/volunteers/:id', (req, res) => {
  const volunteerId = parseInt(req.params.id);
  const volunteer = volunteers.find((v) => v.id === volunteerId);

  if (!volunteer) {
    return res.status(404).json({ message: 'Volunteer not found' });
  }

  const { name, email, role } = req.body;

  // Update volunteer details
  if (name) volunteer.name = name;
  if (email) volunteer.email = email;
  if (role) volunteer.role = role;

  res.status(200).json(volunteer);
});

// Delete a volunteer
router.delete('/volunteers/:id', (req, res) => {
  const volunteerId = parseInt(req.params.id);
  const index = volunteers.findIndex((v) => v.id === volunteerId);

  if (index !== -1) {
    const deletedVolunteer = volunteers.splice(index, 1);
    res.status(200).json({ message: 'Volunteer deleted', volunteer: deletedVolunteer[0] });
  } else {
    res.status(404).json({ message: 'Volunteer not found' });
  }
});

/** EXISTING ROUTES **/

// Fetch upcoming events
router.get('/upcoming-events', (req, res) => {
  res.status(200).json(upcomingEvents);
});

// Fetch current tasks
router.get('/current-tasks', (req, res) => {
  res.status(200).json(currentTasks);
});

// Fetch past events
router.get('/past-events', (req, res) => {
  res.status(200).json(pastEvents);
});

// Fetch notifications
router.get('/notifications', (req, res) => {
  res.status(200).json(notifications);
});

// Submit feedback for a specific event
router.post('/feedback/:eventId', (req, res) => {
  const { eventId } = req.params;
  const { feedback } = req.body;

  // Validate feedback input
  if (!feedback) {
    return res.status(400).json({ error: 'Feedback is required' });
  }

  // Check if event exists
  const event = [...upcomingEvents, ...pastEvents].find((e) => e.id === parseInt(eventId));
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  // Save feedback (for now, in memory)
  feedbacks.push({ eventId: parseInt(eventId), feedback });
  res.status(201).json({ message: 'Feedback submitted successfully', eventId });
});

// Fetch feedback for a specific event
router.get('/feedback/:eventId', (req, res) => {
  const { eventId } = req.params;

  // Filter feedback for the specified event
  const eventFeedback = feedbacks.filter((f) => f.eventId === parseInt(eventId));

  if (eventFeedback.length === 0) {
    return res.status(404).json({ message: 'No feedback found for this event' });
  }

  res.status(200).json(eventFeedback);
});

module.exports = router;
