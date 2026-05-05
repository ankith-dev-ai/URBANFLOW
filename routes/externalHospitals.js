const express = require('express');
const router = express.Router();
const HospitalExternal = require('../models/HospitalExternal');

function buildDoctors(name) {
  const firstNames = ['Arjun', 'Meera', 'Rohan', 'Priya', 'Vivek', 'Sana', 'Kiran', 'Neha', 'Tarun', 'Aditi'];
  const lastNames = ['Rao', 'Nair', 'Iyer', 'Sharma', 'Reddy', 'Ali', 'Das', 'Menon', 'Singh', 'Verma'];

  const departments = [
    'General Medicine',
    'Cardiology',
    'Orthopedics',
    'Dermatology',
    'Pediatrics',
    'Emergency'
  ];

  const hash = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const doctors = {};

  departments.forEach((dept, i) => {
    const first = firstNames[(hash + i * 2) % firstNames.length];
    const last = lastNames[(hash + i * 3) % lastNames.length];
    doctors[dept] = [`Dr. ${first} ${last}`];
  });

  return doctors;
}

router.post('/upsert', async (req, res) => {
  try {
    const { name, address } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Hospital name is required' });
    }

    let hospital = await HospitalExternal.findOne({ name });

    if (!hospital) {
      hospital = await HospitalExternal.create({
        name,
        address: address || 'Nearby hospital',
        doctors: buildDoctors(name)
      });
    }

    res.json(hospital);
  } catch (err) {
    console.error('External hospital upsert error:', err);
    res.status(500).json({ message: 'Failed to save hospital' });
  }
});

router.get('/all', async (req, res) => {
  try {
    const hospitals = await HospitalExternal.find().sort({ name: 1 });
    res.json(hospitals);
  } catch (err) {
    console.error('External hospitals list error:', err);
    res.status(500).json({ message: 'Failed to fetch hospitals' });
  }
});

router.get('/by-name', async (req, res) => {
  try {
    const { name } = req.query;
    const hospital = await HospitalExternal.findOne({ name });

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    res.json(hospital);
  } catch (err) {
    console.error('External hospital fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch hospital' });
  }
});

router.get('/clear-all', async (req, res) => {
  await HospitalExternal.deleteMany({});
  res.json({ message: 'All external hospitals cleared' });
});

module.exports = router;
