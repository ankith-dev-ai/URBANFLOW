const express = require('express');
const auth = require('../middleware/auth');
const Patient = require('../models/Patient');

const router = express.Router();

router.get('/me', auth, async (req, res) => {
  res.json(req.hospital);
});

router.get('/patients', auth, async (req, res) => {
  try {
    const patients = await Patient.find({ hospital: req.hospital._id }).sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/patients/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, hospital: req.hospital._id },
      { status },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const waiting = await Patient.find({
      hospital: req.hospital._id,
      department: patient.department,
      status: { $in: ['waiting', 'in_consultation'] }
    }).sort({ priority: 1, tokenNumber: 1 });

    for (let i = 0; i < waiting.length; i += 1) {
      waiting[i].queuePosition = i + 1;
      await waiting[i].save();
    }

    const io = req.app.get('io');
    io.to(`hospital_${req.hospital._id}`).emit('patient_status_changed', patient);
    io.to(`queue_${req.hospital._id}_${patient.department}`).emit('queue_updated', {
      hospitalId: req.hospital._id.toString(),
      department: patient.department
    });

    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
