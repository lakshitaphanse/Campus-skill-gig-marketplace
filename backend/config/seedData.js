const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedDemoAccounts = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // 1. Seed Demo Club
    const existingClub = await User.findOne({ email: 'club@college.edu' });
    if (!existingClub) {
      await User.create({
        name: 'Technical & Cultural Council',
        email: 'club@college.edu',
        password: hashedPassword,
        role: 'club',
        bio: 'Official college committee organizing annual tech and cultural symposiums.',
        verified: true
      });
      console.log('✅ Demo Club account created: club@college.edu / password123');
    }

    // 2. Seed Demo Student
    const existingStudent = await User.findOne({ email: 'student@college.edu' });
    if (!existingStudent) {
      await User.create({
        name: 'Alex Rivera',
        email: 'student@college.edu',
        password: hashedPassword,
        role: 'student',
        bio: 'Computer Science student skilled in fullstack development and responsive design.',
        skills: [
          { tag: 'Web Development', level: 'Intermediate' },
          { tag: 'UI/UX Design', level: 'Beginner' }
        ],
        reliabilityScore: 100,
        completedProjects: 0,
        verified: true
      });
      console.log('✅ Demo Student account created: student@college.edu / password123');
    }
  } catch (error) {
    console.warn('Seeding warning:', error.message);
  }
};

module.exports = seedDemoAccounts;
