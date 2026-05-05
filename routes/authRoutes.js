const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Hospital = require('../models/Hospital');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hospital = await Hospital.findOne({ email });

    if (!hospital) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, hospital.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: hospital._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      hospital: {
        id: hospital._id,
        name: hospital.name,
        email: hospital.email,
        departments: hospital.departments,
        doctors: hospital.doctors,
        placeId: hospital.placeId
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
