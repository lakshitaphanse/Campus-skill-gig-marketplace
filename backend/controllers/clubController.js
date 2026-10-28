const User = require('../models/User');
const Project = require('../models/Project'); // change if your gig model has another file name

const getClubs = async (req, res) => {
  try {
    const clubs = await User.find({ role: 'club' }).select('-password');

    const result = await Promise.all(
      clubs.map(async (club) => {
        const gigs = await Project.find({ postedBy: club._id });
        return {
          _id: club._id,
          name: club.name,
          category: club.category,
          totalGigs: gigs.length,
          openGigs: gigs.filter((g) => g.status === 'open').length,
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getClubs };