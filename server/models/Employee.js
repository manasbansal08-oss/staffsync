const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    department: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    salary: { type: Number, required: true, min: 0 },
    joiningDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // reporting line: the manager (an Employee) this person reports to
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    // personal record (employee-editable)
    gender: { type: String, enum: ['', 'male', 'female', 'other'], default: '' },
    dateOfBirth: { type: Date },
    address: { type: String, trim: true, default: '' },
    emergencyContact: {
      name: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      relation: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
