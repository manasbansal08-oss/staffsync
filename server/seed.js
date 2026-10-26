require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Leave = require('./models/Leave');
const Attendance = require('./models/Attendance');
const Announcement = require('./models/Announcement');
const Training = require('./models/Training');

const day = 86400000;
const iso = (d) => new Date(d).toISOString().slice(0, 10);

async function addPerson({ name, email, department, designation, salary, role = 'employee', password = 'welcome123', manager = null }) {
  const emp = await Employee.create({ name, email, department, designation, salary, phone: '9876543210', manager });
  const user = await User.create({ name, email, password, role, employee: emp._id });
  emp.user = user._id;
  await emp.save();
  return emp;
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([
    User.deleteMany(), Employee.deleteMany(), Leave.deleteMany(), Attendance.deleteMany(),
    Announcement.deleteMany(), Training.deleteMany(),
  ]);

  const admin = await User.create({ name: 'Admin', email: 'admin@staffsync.com', password: 'admin123', role: 'admin' });
  const hr = await User.create({ name: 'Priya HR', email: 'hr@staffsync.com', password: 'hr1234', role: 'hr' });

  // two managers, each with their own team
  const meera = await addPerson({ name: 'Meera Nair', email: 'manager@staffsync.com', department: 'Engineering', designation: 'Engineering Manager', salary: 95000, role: 'manager', password: 'manager123' });
  const vikram = await addPerson({ name: 'Vikram Rao', email: 'vikram@staffsync.com', department: 'Sales & Marketing', designation: 'Marketing Manager', salary: 85000, role: 'manager', password: 'manager123' });

  const aarav = await addPerson({ name: 'Aarav Sharma', email: 'aarav@staffsync.com', department: 'Engineering', designation: 'Frontend Developer', salary: 55000, manager: meera._id });
  const diya = await addPerson({ name: 'Diya Patel', email: 'diya@staffsync.com', department: 'Engineering', designation: 'Backend Developer', salary: 60000, manager: meera._id });
  const rohan = await addPerson({ name: 'Rohan Verma', email: 'rohan@staffsync.com', department: 'Design', designation: 'UI/UX Designer', salary: 48000, manager: meera._id });
  const sneha = await addPerson({ name: 'Sneha Joshi', email: 'sneha@staffsync.com', department: 'Marketing', designation: 'Content Strategist', salary: 42000, manager: vikram._id });
  const kabir = await addPerson({ name: 'Kabir Singh', email: 'kabir@staffsync.com', department: 'Sales', designation: 'Sales Executive', salary: 38000, manager: vikram._id });

  const now = Date.now();
  await Leave.create([
    { employee: aarav._id, type: 'sick', reason: 'Fever and rest', fromDate: now, toDate: now + 2 * day },
    { employee: diya._id, type: 'casual', reason: 'Family function', fromDate: now + 5 * day, toDate: now + 6 * day },
    { employee: sneha._id, type: 'earned', reason: 'Vacation', fromDate: now + 10 * day, toDate: now + 14 * day },
    { employee: rohan._id, type: 'casual', reason: 'Personal work', fromDate: now - 6 * day, toDate: now - 5 * day, status: 'approved', reviewedBy: (await User.findOne({ email: 'manager@staffsync.com' }))._id },
  ]);

  await Attendance.create([
    { employee: aarav._id, date: iso(now), checkIn: new Date(now - 4 * 3600000) },
    { employee: diya._id, date: iso(now), checkIn: new Date(now - 5 * 3600000) },
    { employee: aarav._id, date: iso(now - day), checkIn: new Date(now - day - 8 * 3600000), checkOut: new Date(now - day) },
  ]);

  await Announcement.create([
    { title: 'Welcome to StaffSync', body: 'Our new HR portal is live. Apply for leave, mark attendance and keep your profile up to date from here.', category: 'announcement', pinned: true, postedBy: hr._id },
    { title: 'Diwali holiday schedule', body: 'The office will remain closed from Thursday to Saturday for Diwali. Wishing everyone a happy and safe festival!', category: 'event', postedBy: hr._id },
    { title: 'Company wins "Best Workplace" award', body: 'We were recognised as one of the best mid-sized workplaces this year. Thank you all for making it possible.', category: 'news', postedBy: hr._id },
    { title: 'Updated leave policy', body: 'Leave requests of more than 3 days must be raised at least a week in advance.', category: 'policy', postedBy: admin._id },
  ]);

  await Training.create([
    { title: 'Advanced React Patterns', description: 'Hooks, performance and testing deep-dive.', mode: 'workshop', startDate: now + 3 * day, endDate: now + 4 * day, status: 'planned', participants: [aarav._id, rohan._id], createdBy: (await User.findOne({ email: 'manager@staffsync.com' }))._id, manager: meera._id },
    { title: 'Node.js & MongoDB Best Practices', mode: 'online', startDate: now - day, endDate: now + 7 * day, status: 'ongoing', participants: [diya._id, aarav._id], createdBy: (await User.findOne({ email: 'manager@staffsync.com' }))._id, manager: meera._id },
    { title: 'Customer Communication Skills', mode: 'classroom', startDate: now + 12 * day, endDate: now + 12 * day, status: 'planned', participants: [sneha._id, kabir._id], createdBy: (await User.findOne({ email: 'vikram@staffsync.com' }))._id, manager: vikram._id },
  ]);

  console.log(`Seeded. Logins:
 admin@staffsync.com    / admin123      (Admin)
 hr@staffsync.com       / hr1234        (HR)
 manager@staffsync.com  / manager123    (Manager - Meera, team: Aarav, Diya, Rohan)
 vikram@staffsync.com   / manager123    (Manager - Vikram, team: Sneha, Kabir)
 aarav@staffsync.com    / welcome123    (Employee)`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
