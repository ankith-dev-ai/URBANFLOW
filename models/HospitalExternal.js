const mongoose = require('mongoose');

const HospitalExternalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    address: { type: String, default: 'Nearby hospital' },
    departments: {
      type: [String],
      default: [
        'General Medicine',
        'Cardiology',
        'Orthopedics',
        'Dermatology',
        'Pediatrics',
        'Emergency'
      ]
    },
    doctors: {
      type: Map,
      of: [String],
      default: {}
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('HospitalExternal', HospitalExternalSchema);
