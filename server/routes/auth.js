const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const Employee = require('../models/Employee');

const { protect, asyncHandler } = require('../middleware/auth');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({
      token: sign(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, employee: user.employee },
    });
  })
);


// Public self-signup: always creates a plain 'employee' account (+ employee record).
// Roles, salary and reporting manager stay HR-controlled.
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, phone, department, designation } = req.body;
    if (!name || !email || !password || !department || !designation) {
      return res.status(400).json({ message: 'Name, email, password, department and designation are required' });
    }
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const mail = String(email).toLowerCase().trim();
    if (await User.findOne({ email: mail })) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const employee = await Employee.create({ name, email: mail, phone, department, designation, salary: 0 });
    let user;
    try {
      user = await User.create({ name, email: mail, password, role: 'employee', employee: employee._id });
    } catch (err) {
      await Employee.findByIdAndDelete(employee._id); // don't leave an orphan record behind
      throw err;
    }
    employee.user = user._id;
    await employee.save();

    res.status(201).json({
      token: sign(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, employee: user.employee },
    });
  })
);

router.get('/me', protect, (req, res) => {
  const u = req.user;
  res.json({ id: u._id, name: u.name, email: u.email, role: u.role, employee: u.employee });
});

router.put(
  '/change-password',
  protect,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword) return res.status(400).json({ message: 'Current password is required' });
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is wrong' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  })
);

module.exports = router;
