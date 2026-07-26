import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// Yahan apni MongoDB string dalein agar .env nahi hai
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/leads_db';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Member'], default: 'Member' },
  avatar: { type: String }
});
const User = mongoose.model('User', userSchema);

const noteSchema = new mongoose.Schema({
  message: String,
  author: String,
  timestamp: { type: Date, default: Date.now }
});

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  company: String,
  source: String,
  status: { type: String, enum: ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'], default: 'New' },
  assignedUser: String,
  createdBy: String,
  notes: [noteSchema]
}, { timestamps: true });
const Lead = mongoose.model('Lead', leadSchema);

const protect = async (req, res, next) => {
  let token = req.headers.authorization;
  if (token && token.startsWith('Bearer')) {
    try {
      token = token.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') next();
  else res.status(403).json({ message: 'Admin access required' });
};

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '30d' })
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

// GET ALL USERS (For assigning leads)
app.get('/api/users', protect, adminOnly, async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

// GET LEADS (Filtered by role)
app.get('/api/leads', protect, async (req, res) => {
  let leads;
  if (req.user.role === 'Admin') {
    leads = await Lead.find({}).sort({ updatedAt: -1 });
  } else {
    leads = await Lead.find({ assignedUser: req.user.name }).sort({ updatedAt: -1 });
  }
  res.json(leads);
});

// CREATE LEAD (Admin only)
app.post('/api/leads', protect, adminOnly, async (req, res) => {
  const lead = new Lead({ ...req.body, createdBy: req.user.name });
  const createdLead = await lead.save();
  res.status(201).json(createdLead);
});

// UPDATE LEAD / ADD NOTE
app.put('/api/leads/:id', protect, async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (lead) {
    // Only Admin or Assigned Member can update
    if (req.user.role === 'Admin' || lead.assignedUser === req.user.name) {
      if (req.body.status) lead.status = req.body.status;
      if (req.body.note) {
        lead.notes.unshift({ message: req.body.note, author: req.user.name });
      }
      Object.assign(lead, req.body); // Update other fields if provided
      const updatedLead = await lead.save();
      res.json(updatedLead);
    } else {
      res.status(403).json({ message: 'Not authorized to update this lead' });
    }
  } else {
    res.status(404).json({ message: 'Lead not found' });
  }
});

// DELETE LEAD (Admin only)
app.delete('/api/leads/:id', protect, adminOnly, async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (lead) {
    await lead.deleteOne();
    res.json({ message: 'Lead removed' });
  } else {
    res.status(404).json({ message: 'Lead not found' });
  }
});

// Seed script to create initial admin if DB is empty
const seedDB = async () => {
  const adminExists = await User.findOne({ email: 'admin@example.com' });
  if (!adminExists) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123', salt);
    await User.create({ name: 'Admin User', email: 'admin@example.com', password: hashedPassword, role: 'Admin', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' });
    await User.create({ name: 'Member User', email: 'member@example.com', password: hashedPassword, role: 'Member', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' });
    console.log('✅ Seed users created');
  }
};
seedDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));