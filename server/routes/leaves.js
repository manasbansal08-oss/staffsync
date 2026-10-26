const router = require('express').Router();
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const { protect, restrictTo, asyncHandler, teamIds } = require('../middleware/auth');

router.use(protect);

// employee -> own leaves | manager -> own + team's | hr/admin -> everyone's
// ?scope=team returns only the team's requests (manager review queue)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { role, employee } = req.user;
    let filter = {};
    if (role === 'employee') filter = { employee };
    if (role === 'manager') {
      const team = await teamIds(req.user);
      filter = req.query.scope === 'team' ? { employee: { $in: team } } : { employee: { $in: [...team, employee] } };
    }
    if (req.query.status) filter.status = req.query.status;
    const leaves = await Leave.find(filter).populate('employee', 'name department').sort({ createdAt: -1 });
    res.json(leaves);
  })
);

router.post(
  '/',
  restrictTo('employee', 'manager'),
  asyncHandler(async (req, res) => {
    const { type, fromDate, toDate, reason } = req.body;
    if (!fromDate || !toDate) return res.status(400).json({ message: 'From and to dates are required' });
    if (new Date(toDate) < new Date(fromDate)) {
      return res.status(400).json({ message: 'End date cannot be before start date' });
    }
    const leave = await Leave.create({ employee: req.user.employee, type, fromDate, toDate, reason });
    res.status(201).json(leave);
  })
);

// HR/Admin can review anything; a manager can review only their own team's requests
router.patch(
  '/:id/status',
  restrictTo('admin', 'hr', 'manager'),
  asyncHandler(async (req, res) => {
    const { status, note } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });

    if (req.user.role === 'manager') {
      const member = await Employee.findById(leave.employee).select('manager');
      if (!member || String(member.manager) !== String(req.user.employee)) {
        return res.status(403).json({ message: 'You can only review leave requests from your own team' });
      }
    }
    if (String(leave.employee) === String(req.user.employee)) {
      return res.status(403).json({ message: 'You cannot review your own leave request' });
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewNote = note || '';
    await leave.save();
    res.json(leave);
  })
);

module.exports = router;
