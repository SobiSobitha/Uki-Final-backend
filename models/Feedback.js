// models/Feedback.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const feedbackSchema = new Schema({
    eventName: {
        type: String, // Store the event name as a string
        required: true
    },
    feedback: {
        type: String, // Store the actual feedback from the user
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now // Automatically set the date of feedback creation
    }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;
