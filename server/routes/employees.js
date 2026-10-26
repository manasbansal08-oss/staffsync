const router = require('express').Router();
const Employee = require('../models/Employee');
const User = require('../models/User');
const { protect, restrictTo, asyncHandler, teamIds, isOid } = require('../middleware/auth');

router.use(protect);

// Manager: the people who report to me
router.get(
  '/team',
  restrictTo('manager'),
  asyncHandler(async (req, res) => {
    const ids = await teamIds(req.user);
    res.json(await Employee.find({ _id: { $in: ids } }).select('-salary').sort({ name: 1 }));
  })
);

// Everything below: HR / Admin only
router.use(restrictTo('admin', 'hr'));

// GET /api/employees?search=&department=
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search, department } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (search) {
      const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { designation: rx }];
    }
    const employees = await Employee.find(filter).populate('manager', 'name').populate('user', 'role').sort({ createdAt: -1 });
    res.json(employees);
  })
);

// Creating an employee also creates a login (default password: welcome123)
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, email, phone, department, designation, salary, joiningDate, role, manager } = req.body;
    const userRole = role === 'manager' ? 'manager' : 'employee';
    if (await User.findOne({ email: (email || '').toLowerCase() })) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }
    if (manager && !(isOid(manager) && (await Employee.exists({ _id: manager })))) {
      return res.status(400).json({ message: 'Selected manager does not exist' });
    }
    const employee = await Employee.create({
      name, email, phone, department, designation, salary, joiningDate, manager: manager || null,
    });
    const user = await User.create({ name, email, password: 'welcome123', role: userRole, employee: employee._id });
    employee.user = user._id;
    await employee.save();
    res.status(201).json(employee);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const allowed = ['name', 'phone', 'department', 'designation', 'salary', 'joiningDate', 'status'];
    const updates = {};
    allowed.forEach((k) => req.body[k] !== undefined && (updates[k] = req.body[k]));

    if (req.body.manager !== undefined) {
      const m = req.body.manager || null;
      if (m && String(m) === req.params.id) return res.status(400).json({ message: 'An employee cannot report to themselves' });
      if (m && !(isOid(m) && (await Employee.exists({ _id: m })))) {
        return res.status(400).json({ message: 'Selected manager does not exist' });
      }
      updates.manager = m;
    }

    const employee = await Employee.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const userUpdates = {};
    if (updates.name) userUpdates.name = updates.name;
    // promote / demote between employee and manager (admin & hr accounts are untouched)
    if (['employee', 'manager'].includes(req.body.role)) {
      const u = await User.findById(employee.user);
      if (u && ['employee', 'manager'].includes(u.role)) userUpdates.role = req.body.role;
    }
    if (Object.keys(userUpdates).length) await User.findByIdAndUpdate(employee.user, userUpdates);
    res.json(employee);
  })
);

router.delete(
  '/:id',
  restrictTo('admin'),
  asyncHandler(async (req, res) => {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    await User.findByIdAndDelete(employee.user);
    await Employee.updateMany({ manager: employee._id }, { manager: null });
    res.json({ message: 'Employee deleted' });
  })
);

module.exports = router;
