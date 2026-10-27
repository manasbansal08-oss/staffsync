const router = require('express').Router();
const Attendance = require('../models/Attendance');
const { protect, restrictTo, asyncHandler, teamIds } = require('../middleware/auth');

router.use(protect);

const today = () => new Date().toISOString().slice(0, 10);
const markers = ['employee', 'manager'];

router.post(
  '/check-in',
  restrictTo(...markers),
  asyncHandler(async (req, res) => {
    const existing = await Attendance.findOne({ employee: req.user.employee, date: today() });
    if (existing) return res.status(400).json({ message: 'Already checked in today' });
    const record = await Attendance.create({ employee: req.user.employee, date: today(), checkIn: new Date() });
    res.status(201).json(record);
  })
);

router.post(
  '/check-out',
  restrictTo(...markers),
  asyncHandler(async (req, res) => {
    const record = await Attendance.findOne({ employee: req.user.employee, date: today() });
    if (!record) return res.status(400).json({ message: 'You have not checked in today' });
    if (record.checkOut) return res.status(400).json({ message: 'Already checked out today' });
    record.checkOut = new Date();
    await record.save();
    res.json(record);
  })
);

// employee -> own | manager -> own + team | hr/admin -> all.  ?mine=true forces own records.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { role, employee } = req.user;
    let filter = {};
    if (role === 'employee' || req.query.mine === 'true') filter = { employee };
    else if (role === 'manager') filter = { employee: { $in: [...(await teamIds(req.user)), employee] } };
    if (req.query.date) filter.date = req.query.date;
    const records = await Attendance.find(filter)
      .populate('employee', 'name department')
      .sort({ date: -1 })
      .limit(100);
    res.json(records);
  })
);

module.exports = router;
