const jwt = require('jsonwebtoken');
const { firmDb } = require('../db/db');
const User = require('../models/user')(firmDb);
const Team = require('../models/Team')(firmDb);

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).send('Unauthorized');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user exists and is active (not soft-deleted)
    // Allow records without isActive field (treat as active) or isActive !== false
    const user = await User.findById(decoded.userId);
    if (!user || user.isActive === false) {
      return res.status(401).send('Unauthorized - user account is inactive');
    }
    
    // Verify team exists and is active (teams use soft-delete with 30-day retention)
    // Allow records without isActive field (treat as active) or isActive !== false
    const team = await Team.findById(decoded.teamId);
    if (!team || team.isActive === false) {
      return res.status(401).send('Unauthorized - team is inactive');
    }
    
    req.user = { 
      userId: decoded.userId, 
      teamId: decoded.teamId,
      roles: decoded.roles,
      username: decoded.username,
      isTeamAdmin: decoded.isTeamAdmin
    };
    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    res.status(401).send('Unauthorized');
  }
};

module.exports = { authenticateToken };
