require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const SimData = require('./models/SimData');
const Otp = require('./models/Otp');

const app = express();
// Koyeb ke liye 8000 default hona chahiye
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.static('.')); 

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ DATABASE CONNECTED'))
.catch(err => console.log('❌ DB CONNECTION ERROR:', err));

// OTP Generate Route (Fixed)
app.post('/api/generate-otp', async (req, res) => {
    try {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        // Otp model mein 'isUsed' hai, 'used' nahi
        const newOtp = new Otp({ code: code, isUsed: false }); 
        await newOtp.save();
        console.log(`🆕 Code Created: ${code}`);
        res.status(200).json({ success: true, message: 'OTP Generated' });
    } catch (error) {
        console.error('OTP Gen Error:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// OTP Verify Route (Fixed)
app.post('/api/verify-otp', async (req, res) => {
    const { code } = req.body;
    try {
        const validOtp = await Otp.findOne({ code, isUsed: false });
        if (validOtp) {
            validOtp.isUsed = true; 
            await validOtp.save();
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Invalid Code' });
        }
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// Search Route
app.get('/api/search', async (req, res) => {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });
    
    try {
        const results = await SimData.find({ phone: new RegExp(phone, 'i') });
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server live on port ${PORT}`);
});