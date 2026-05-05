const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  department: { type: String, required: true },
  available: { type: Boolean, default: true }
});

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    placeId: { type: String },
    address: { type: String },
    phone: { type: String },
    departments: [{ type: String }],
    doctors: [doctorSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hospital', hospitalSchema);
