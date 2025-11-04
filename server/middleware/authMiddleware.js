const jwt = require('jsonwebtoken');
const { firmDb } = require('../db/db');
const User = require('../models/user')(firmDb);

const authenticateToken = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).send('Unauthorized');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
