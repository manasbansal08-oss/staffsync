const router = require('express').Router();
const Announcement = require('../models/Announcement');
const { protect, restrictTo, asyncHandler, isOid } = require('../middleware/auth');

router.use(protect);

// everyone can read
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = req.query.category ? { category: req.query.category } : {};
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const list = await Announcement.find(filter)
      .populate('postedBy', 'name role')
      .sort({ pinned: -1, createdAt: -1 })
      .limit(limit);
    res.json(list);
  })
);

// only HR (and admin) can publish / change / remove
router.post(
  '/',
  restrictTo('admin', 'hr'),
  asyncHandler(async (req, res) => {
    const { title, body, category, pinned } = req.body;
    const a = await Announcement.create({ title, body, category, pinned: !!pinned, postedBy: req.user._id });
    res.status(201).json(a);
  })
);

router.put(
  '/:id',
  restrictTo('admin', 'hr'),
  asyncHandler(async (req, res) => {
    if (!isOid(req.params.id)) return res.status(404).json({ message: 'Announcement not found' });
    const updates = {};
    ['title', 'body', 'category', 'pinned'].forEach((k) => req.body[k] !== undefined && (updates[k] = req.body[k]));
    const a = await Announcement.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!a) return res.status(404).json({ message: 'Announcement not found' });
    res.json(a);
  })
);

router.delete(
  '/:id',
  restrictTo('admin', 'hr'),
  asyncHandler(async (req, res) => {
    if (!isOid(req.params.id)) return res.status(404).json({ message: 'Announcement not found' });
    const a = await Announcement.findByIdAndDelete(req.params.id);
    if (!a) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Announcement deleted' });
  })
);

module.exports = router;
