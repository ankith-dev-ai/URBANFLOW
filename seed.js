require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const Hospital = require('./models/Hospital');

const seed = async () => {
  await connectDB();
  await Hospital.deleteMany({});

  const password = await bcrypt.hash('admin123', 10);

  await Hospital.insertMany([
    {
      name: 'CityCare Multispeciality Hospital',
      email: 'citycare@urbanflow.com',
      password,
      placeId: 'CITYCARE_PLACE_ID',
      address: 'Sample Address 1',
      phone: '+91 9000000001',
      departments: ['General Medicine', 'Cardiology', 'Orthopedics', 'Emergency'],
      doctors: [
        { name: 'Dr. Meera Nair', specialization: 'General Physician', department: 'General Medicine' },
        { name: 'Dr. Arjun Rao', specialization: 'Cardiologist', department: 'Cardiology' },
        { name: 'Dr. Sana Ali', specialization: 'Orthopedic Surgeon', department: 'Orthopedics' },
        { name: 'Dr. Vivek Sharma', specialization: 'Emergency Specialist', department: 'Emergency' }
      ]
    },
    {
      name: 'Sunrise Hospital',
      email: 'sunrise@urbanflow.com',
      password,
      placeId: 'SUNRISE_PLACE_ID',
      address: 'Sample Address 2',
      phone: '+91 9000000002',
      departments: ['General Medicine', 'Dermatology', 'Pediatrics', 'Emergency'],
      doctors: [
        { name: 'Dr. Kavya Menon', specialization: 'General Physician', department: 'General Medicine' },
        { name: 'Dr. Rishi Verma', specialization: 'Dermatologist', department: 'Dermatology' },
        { name: 'Dr. Neha Paul', specialization: 'Pediatrician', department: 'Pediatrics' },
        { name: 'Dr. Tarun Singh', specialization: 'Emergency Specialist', department: 'Emergency' }
      ]
    }
  ]);

  console.log('Seeded hospitals successfully');
  process.exit(0);
};

seed();
