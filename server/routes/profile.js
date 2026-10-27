const router = require('express').Router();
const Employee = require('../models/Employee');
const { protect, asyncHandler } = require('../middleware/auth');

router.use(protect);

// Employees (and managers) keep their own personal record here
router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user.employee) return res.json({ account: { name: req.user.name, email: req.user.email, role: req.user.role }, employee: null });
    const employee = await Employee.findById(req.user.employee).populate('manager', 'name designation');
    res.json({ account: { name: req.user.name, email: req.user.email, role: req.user.role }, employee });
  })
);

// Only personal fields are editable by the person themselves; salary, department, etc. stay HR-controlled
router.put(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user.employee) return res.status(400).json({ message: 'This account has no employee record' });
    const updates = {};
    ['phone', 'address', 'gender', 'dateOfBirth'].forEach((k) => req.body[k] !== undefined && (updates[k] = req.body[k]));
    if (req.body.emergencyContact) {
      const ec = req.body.emergencyContact;
      ['name', 'phone', 'relation'].forEach((k) => ec[k] !== undefined && (updates[`emergencyContact.${k}`] = ec[k]));
    }
    const employee = await Employee.findByIdAndUpdate(req.user.employee, updates, { new: true, runValidators: true });
    res.json(employee);
  })
);

module.exports = router;
