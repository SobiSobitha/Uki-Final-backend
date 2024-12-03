const mongoose = require('mongoose');

const VolunteerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true },
    task: { type: String, required: true },
}, { _id: false });

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    roles: [{ type: String, required: true }],
    tasks: [{ type: String, required: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    volunteers: [VolunteerSchema],
    status: { type: String, default: 'pending' }, // Event status
    // paymentPlan: { type: String, required: true }, 
}, { timestamps: true });


const Event = mongoose.model('Event', EventSchema);

module.exports = Event;
