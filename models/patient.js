const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String },
    symptoms: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    additionalNotes: { type: String },
    department: { type: String, required: true },
    priority: { type: String, enum: ['normal', 'emergency'], default: 'normal' },
    tokenNumber: { type: Number, required: true },
    queuePosition: { type: Number, required: true },
    status: {
      type: String,
      enum: ['waiting', 'in_consultation', 'completed', 'cancelled'],
      default: 'waiting'
    },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    hospitalName: { type: String, required: true },
    selectedHospitalName: { type: String, required: true },
    selectedHospitalAddress: { type: String, default: 'Nearby hospital' },
    assignedDoctor: { type: String },
    location: {
      latitude: Number,
      longitude: Number,
      addressText: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
