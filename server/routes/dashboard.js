const router = require('express').Router();
const Employee = require('../models/Employee');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const Training = require('../models/Training');
const { protect, restrictTo, asyncHandler, teamIds } = require('../middleware/auth');

router.get(
  '/stats',
  protect,
  restrictTo('admin', 'hr'),
  asyncHandler(async (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const [totalEmployees, activeEmployees, pendingLeaves, presentToday, byDepartment, payroll] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'active' }),
      Leave.countDocuments({ status: 'pending' }),
      Attendance.countDocuments({ date: today }),
      Employee.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 }, avgSalary: { $avg: '$salary' } } },
        { $sort: { count: -1 } },
      ]),
      Employee.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$salary' } } },
      ]),
    ]);
    res.json({
      totalEmployees,
      activeEmployees,
      pendingLeaves,
      presentToday,
      monthlyPayroll: payroll[0]?.total || 0,
      byDepartment,
    });
  })
);

// Role-aware summary for managers and employees
router.get(
  '/me',
  protect,
  restrictTo('manager', 'employee'),
  asyncHandler(async (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const me = req.user.employee;
    const [myPending, myApproved, todayRecord, upcomingTraining] = await Promise.all([
      Leave.countDocuments({ employee: me, status: 'pending' }),
      Leave.countDocuments({ employee: me, status: 'approved' }),
      Attendance.findOne({ employee: me, date: today }),
      Training.countDocuments({ participants: me, status: { $in: ['planned', 'ongoing'] } }),
    ]);
    const out = { myPendingLeaves: myPending, myApprovedLeaves: myApproved, todayAttendance: todayRecord, myTraining: upcomingTraining };

    if (req.user.role === 'manager') {
      const team = await teamIds(req.user);
      const [teamPendingLeaves, teamPresentToday, programmes] = await Promise.all([
        Leave.countDocuments({ employee: { $in: team }, status: 'pending' }),
        Attendance.countDocuments({ employee: { $in: team }, date: today }),
        Training.countDocuments({ manager: me, status: { $in: ['planned', 'ongoing'] } }),
      ]);
      Object.assign(out, { teamSize: team.length, teamPendingLeaves, teamPresentToday, activeProgrammes: programmes });
    }
    res.json(out);
  })
);

module.exports = router;
