const express = require('express');
const Patient = require('../models/Patient');
const Hospital = require('../models/Hospital');
const Counter = require('../models/Counter');
const HospitalExternal = require('../models/HospitalExternal');
const router = express.Router();
const emergencyKeywords = [
  'chest pain',
  'breathing',
  'stroke',
  'unconscious',
  'accident',
  'severe bleeding',
  'heart attack',
  'seizure',
  'pregnancy emergency',
  'high fever',
  'suicidal',
  'fracture'
];
function formatPhoneNumber(phone) {
  let p = String(phone).replace(/\D/g, '');

  if (p.length === 10) return `+91${p}`;
  if (p.length === 12 && p.startsWith('91')) return `+${p}`;
  if (String(phone).startsWith('+')) return String(phone);

  return `+${p}`;
}
const fallbackDoctors = {
  'General Medicine': ['Dr. Arjun Sharma', 'Dr. Priya Nair'],
  'Cardiology': ['Dr. Rohan Mehta', 'Dr. Sunita Rao'],
  'Orthopedics': ['Dr. Kiran Patel'],
  'Dermatology': ['Dr. Meena Iyer'],
  'Pediatrics': ['Dr. Deepa Krishnan'],
  'Emergency': ['Dr. Anita Verma', 'Dr. Suresh Kumar']
};

function classifyPriority(symptoms = '', notes = '') {
  const text = `${symptoms} ${notes}`.toLowerCase();
  return emergencyKeywords.some((keyword) => text.includes(keyword)) ? 'emergency' : 'normal';
}

async function getNextToken(keyBase, department) {
  const key = `${keyBase}_${department}`;
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return counter.value;
}

function getFallbackDoctor(department) {
  const doctors = fallbackDoctors[department] || ['Dr. Duty Doctor'];
  return doctors[0];
}

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      symptoms,
      email,
      phone,
      additionalNotes,
      department,
      hospitalId,
      selectedHospitalName,
      selectedHospitalAddress,
      location
    } = req.body;

    if (!name || !age || !phone || !department) {
      return res.status(400).json({ message: 'Missing required patient details' });
    }

    const priority = classifyPriority(symptoms, additionalNotes);

    let hospital = null;
    let hospitalName = selectedHospitalName || '';
    let hospitalAddress = selectedHospitalAddress || 'Nearby hospital';
    let assignedDoctor = getFallbackDoctor(department);
    let tokenKeyBase = '';
    let waitingFilter = {
      department,
      status: { $in: ['waiting', 'in_consultation'] }
    };

    if (hospitalId) {
      hospital = await Hospital.findById(hospitalId);

      if (!hospital) {
        return res.status(404).json({ message: 'Hospital not found' });
      }

      hospitalName = hospital.name;
      tokenKeyBase = hospital._id.toString();
      waitingFilter.hospital = hospital._id;

      const availableDoctor = Array.isArray(hospital.doctors)
        ? hospital.doctors.find(
            (doctor) => doctor.department === department && doctor.available
          )
        : null;

      assignedDoctor = availableDoctor ? availableDoctor.name : assignedDoctor;
    } else if (selectedHospitalName) {
      hospitalName = selectedHospitalName;
      tokenKeyBase = selectedHospitalName;
      waitingFilter.selectedHospitalName = selectedHospitalName;
    } else {
      return res.status(400).json({ message: 'hospitalId or selectedHospitalName is required' });
    }

    const tokenNumber = await getNextToken(tokenKeyBase, department);
    const waitingCount = await Patient.countDocuments(waitingFilter);

    const patient = await Patient.create({
      name,
      age,
      gender,
      symptoms,
      email,
      phone,
      additionalNotes,
      department,
      priority,
      tokenNumber,
      queuePosition: waitingCount + 1,
      hospital: hospital ? hospital._id : undefined,
      hospitalName: hospitalName,
      selectedHospitalName: hospitalName,
      selectedHospitalAddress: hospitalAddress,
      assignedDoctor,
      location
    });

    const io = req.app.get('io');

    if (hospital) {
      io.to(`hospital_${hospital._id}`).emit('new_patient', patient);
      io.to(`queue_${hospital._id}_${department}`).emit('queue_updated', {
        hospitalId,
        department
      });
    }

    io.emit('queue_updated', {
      selectedHospitalName: hospitalName,
      department
    });

      const sendSMS = req.app.get('sendSMS');
      if (sendSMS) {
        await sendSMS(
  formatPhoneNumber(phone),
  `UrbanFlow Alert: Your case is marked  at ${hospitalName}. Token ${tokenNumber}. Please move immediately to the emergency desk.`
);
      }
    

    res.status(201).json(patient);
  } catch (error) {
    console.error('Patient register error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/queue/:hospitalId/:department', async (req, res) => {
  try {
    const { hospitalId, department } = req.params;

    const queue = await Patient.find({
      hospital: hospitalId,
      department,
      status: { $in: ['waiting', 'in_consultation'] }
    })
      .sort({ priority: 1, tokenNumber: 1 })
      .select('name tokenNumber priority status assignedDoctor queuePosition createdAt');

    const normalized = queue.map((item, index) => ({
      ...item.toObject(),
      queuePosition: index + 1
    }));

    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/by-selected-hospital/:hospitalName', async (req, res) => {
  try {
    const hospitalName = decodeURIComponent(req.params.hospitalName);
    const department = req.query.department;

    const filter = { selectedHospitalName: hospitalName };
    if (department && department !== 'All') {
      filter.department = department;
    }

    const patients = await Patient.find(filter).sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    console.error('Fetch selected hospital patients error:', error);
    res.status(500).json({ message: 'Failed to fetch hospital patients' });
  }
});

// ✅ ADD THIS BLOCK RIGHT HERE
router.delete('/by-selected-hospital/:hospitalName', async (req, res) => {
  try {
    const hospitalName = decodeURIComponent(req.params.hospitalName)
    const result = await Patient.deleteMany({ selectedHospitalName: hospitalName })
    res.json({ success: true, deleted: result.deletedCount })
  } catch (error) {
    console.error('Delete patients error:', error)
    res.status(500).json({ message: error.message })
  }
})

module.exports = router;  // ← KEEP THIS AS LAST LINE
