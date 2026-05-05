require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const twilio = require('twilio');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const externalHospitalRoutes = require('./routes/externalHospitals');
const verifyRoutes = require('./routes/verifyRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});

connectDB();

app.use(cors());
app.use(express.json());
app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/external-hospitals', externalHospitalRoutes);
app.use('/api/verify', verifyRoutes);

const twilioEnabled =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER;

console.log('TWILIO_ACCOUNT_SID exists:', !!process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN exists:', !!process.env.TWILIO_AUTH_TOKEN);
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER);
console.log('twilioEnabled:', !!twilioEnabled);

const twilioClient = twilioEnabled
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;
app.set('sendSMS', async (to, body) => {
  if (!twilioClient) {
    console.log(`[SMS skipped] ${to}: ${body}`);
    return;
  }

  try {
    await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
  } catch (error) {
    console.error('SMS failed:', error.message);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/external-hospitals', externalHospitalRoutes);

io.on('connection', (socket) => {
  socket.on('join_hospital', ({ hospitalId }) => {
    socket.join(`hospital_${hospitalId}`);
  });

  socket.on('join_queue', ({ hospitalId, department }) => {
    socket.join(`queue_${hospitalId}_${department}`);
  });
});
app.get('/test-sms', async (req, res) => {
  try {
    const sendSMS = req.app.get('sendSMS');
    await sendSMS('+919391532126', 'UrbanFlow test SMS is working.');
    res.send('SMS sent successfully');
  } catch (err) {
    res.status(500).send(err.message);
  }
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
