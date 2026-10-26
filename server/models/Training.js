const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 150 },
    description: { type: String, trim: true, default: '' },
    mode: { type: String, enum: ['online', 'classroom', 'workshop', 'self-paced'], default: 'online' },
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate: { type: Date, required: [true, 'End date is required'] },
    status: { type: String, enum: ['planned', 'ongoing', 'completed', 'cancelled'], default: 'planned' },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // the manager (Employee) who owns the programme; HR-created programmes may leave it empty
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Training', trainingSchema);
