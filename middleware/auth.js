const jwt = require('jsonwebtoken');
const Hospital = require('../models/Hospital');

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.hospital = await Hospital.findById(decoded.id).select('-password');

    if (!req.hospital) {
      return res.status(401).json({ message: 'Hospital not found' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = auth;
