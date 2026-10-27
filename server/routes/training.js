const router = require('express').Router();
const Training = require('../models/Training');
const Employee = require('../models/Employee');
const { protect, restrictTo, asyncHandler, teamIds, isOid } = require('../middleware/auth');

router.use(protect);

const populate = (q) => q.populate('participants', 'name department designation').populate('manager', 'name');

// employee -> programmes they are enrolled in | manager -> programmes they run (or are enrolled in) | hr/admin -> all
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { role, employee } = req.user;
    let filter = {};
    if (role === 'employee') filter = { participants: employee };
    if (role === 'manager') filter = { $or: [{ manager: employee }, { participants: employee }] };
    res.json(await populate(Training.find(filter).sort({ startDate: -1 })));
  })
);

// make sure every participant belongs to the manager's team
async function validParticipants(user, ids = []) {
  if (!Array.isArray(ids) || ids.some((i) => !isOid(i))) return false;
  if (user.role === 'manager') {
    const team = (await teamIds(user)).map(String);
    return ids.every((i) => team.includes(String(i)));
  }
  return (await Employee.countDocuments({ _id: { $in: ids } })) === ids.length;
}

router.post(
  '/',
  restrictTo('admin', 'hr', 'manager'),
  asyncHandler(async (req, res) => {
    const { title, description, mode, startDate, endDate, status, participants = [] } = req.body;
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'End date cannot be before start date' });
    }
    if (!(await validParticipants(req.user, participants))) {
      return res.status(400).json({ message: req.user.role === 'manager' ? 'You can only enrol your own team members' : 'Invalid participants' });
    }
    const t = await Training.create({
      title, description, mode, startDate, endDate, status, participants,
      createdBy: req.user._id,
      manager: req.user.role === 'manager' ? req.user.employee : null,
    });
    res.status(201).json(await populate(Training.findById(t._id)));
  })
);

async function loadOwned(req, res) {
  if (!isOid(req.params.id)) { res.status(404).json({ message: 'Training programme not found' }); return null; }
  const t = await Training.findById(req.params.id);
  if (!t) { res.status(404).json({ message: 'Training programme not found' }); return null; }
  if (req.user.role === 'manager' && String(t.manager) !== String(req.user.employee)) {
    res.status(403).json({ message: 'You can only manage your own training programmes' });
    return null;
  }
  return t;
}

router.put(
  '/:id',
  restrictTo('admin', 'hr', 'manager'),
  asyncHandler(async (req, res) => {
    const t = await loadOwned(req, res);
    if (!t) return;
    ['title', 'description', 'mode', 'startDate', 'endDate', 'status'].forEach((k) => req.body[k] !== undefined && (t[k] = req.body[k]));
    if (t.endDate < t.startDate) return res.status(400).json({ message: 'End date cannot be before start date' });
    if (req.body.participants !== undefined) {
      if (!(await validParticipants(req.user, req.body.participants))) {
        return res.status(400).json({ message: 'Invalid participants' });
      }
      t.participants = req.body.participants;
    }
    await t.save();
    res.json(await populate(Training.findById(t._id)));
  })
);

router.delete(
  '/:id',
  restrictTo('admin', 'hr', 'manager'),
  asyncHandler(async (req, res) => {
    const t = await loadOwned(req, res);
    if (!t) return;
    await t.deleteOne();
    res.json({ message: 'Training programme deleted' });
  })
);

module.exports = router;
