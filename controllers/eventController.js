const Event = require('../models/Event.js');
const User = require('../models/User.js');
const Notification = require('../models/Notification.js');

// Create Event with Validation
exports.createEvent = async (req, res) => {
    console.log('User:', req.user); // Log the user object
    const { title, description, location, date, roles, tasks } = req.body;

    // Check if the user is authorized to create an event
    if (!req.user || req.user.role !== 'Organizer') {
        return res.status(403).json({ error: 'Access denied: Only organizers can create events' });
    }

    // Validate that the organizer exists
    const createdBy = req.user.id; // Assuming you get the creator's ID from req.user
    try {
        const organizer = await User.findById(createdBy);
        if (!organizer) {
            return res.status(404).json({ message: 'User not found with ID: ' + createdBy });
        }

        // Create the new event object
        const newEvent = new Event({
            title,
            description,
            location,
            date,
            roles,
            tasks,
            createdBy // Use the verified createdBy ID
        });

        // Save the event to the database
        await newEvent.save();
        res.status(201).json(newEvent); // Return the created event
    } catch (error) {
        console.error('Error finding user:', error);
        return res.status(500).json({ message: 'Server error while checking user.' });
    }
};

// Get All Events with createdBy populated and roles intact
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find()
            .populate('createdBy', 'name'); // Populate organizer name
        res.status(200).json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Single Event with detailed volunteer info and organizer
exports.getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('createdBy', 'name') // Populate createdBy for organizer name
            .populate('volunteers.user', 'name email'); // Populate volunteer details

        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.status(200).json(event);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update Event
exports.updateEvent = async (req, res) => {
    const { title, description, location, date, roles, tasks } = req.body;

    // Check if the user is authorized to update an event
    if (!req.user || req.user.role !== 'Organizer') {
        return res.status(403).json({ error: 'Access denied: Only organizers can update events' });
    }

    try {
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            {
                title,
                description,
                location,
                date,
                roles,
                tasks
            },
            { new: true }
        );
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.status(200).json(event);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete Event
exports.deleteEvent = async (req, res) => {
    // Check if the user is authorized to delete an event
    if (!req.user || req.user.role !== 'Organizer') {
        return res.status(403).json({ error: 'Access denied: Only organizers can delete events' });
    }

    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Register for a role and task (Volunteers)
exports.registerForRole = async (req, res) => {
    const { eventId, userId, role, task } = req.body;

    try {
        // Check if the user exists in the User collection
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User ID not found.' });
        }

        // Find the event
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        // Check if the role/task is available
        const availableRole = event.roles.includes(role);
        const availableTask = event.tasks.includes(task);
        if (!availableRole || !availableTask) {
            return res.status(400).json({ message: 'Role or task not available.' });
        }

        // Register the volunteer for the role and task
        event.volunteers.push({ user: userId, role, task });
        await event.save();

        // Create a notification for the organizer
        const organizerId = event.createdBy;
        await Notification.create({
            organizerId,
            message: `Volunteer ${user.name} has selected your event: ${event.title}`,
            timestamp: new Date()
        });

        res.status(201).json({ message: 'Registered successfully for the event!' });
    } catch (err) {
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

// Remove role and task from an event (Organizer only)
exports.removeRoleTask = async (req, res) => {
    const { eventId, userId } = req.body;

    // Check if the user is authorized to remove roles/tasks
    if (!req.user || req.user.role !== 'Organizer') {
        return res.status(403).json({ error: 'Access denied: Only organizers can remove roles and tasks' });
    }

    try {
        // Find the event
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        // Find the volunteer in the event
        const volunteerIndex = event.volunteers.findIndex(v => v.user.toString() === userId);
        if (volunteerIndex === -1) {
            return res.status(404).json({ message: 'Volunteer not found in this event.' });
        }

        // Remove the volunteer's role and task
        event.volunteers.splice(volunteerIndex, 1);
        await event.save();

        res.json({ message: 'Volunteer role and task removed from the event.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};
