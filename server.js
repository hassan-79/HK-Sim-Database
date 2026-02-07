require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const SimData = require('./models/SimData');
const Otp = require('./models/Otp');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files (index.html, style.css, etc.)

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hassan_sim_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- OTP Routes ---

// Generate OTP (User requests this)
app.post('/api/generate-otp', async (req, res) => {
    try {
        // Generate a random 6-digit number
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        const newOtp = new Otp({ code });
        await newOtp.save();
        
        console.log(`🆕 New OTP Generated: ${code}`);
        res.json({ success: true, message: 'OTP Generated successfully' });
    } catch (error) {
        console.error('Error generating OTP:', error);
        res.status(500).json({ success: false, message: 'Failed to generate OTP' });
    }
});

// Verify OTP
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ success: false, message: 'Code is required' });

        // Find the OTP
        const otpRecord = await Otp.findOne({ code });

        if (!otpRecord) {
            return res.status(404).json({ success: false, message: 'Invalid Code' });
        }

        if (otpRecord.isUsed) {
            return res.status(400).json({ success: false, message: 'Code already used' });
        }

        // Mark as used
        otpRecord.isUsed = true;
        await otpRecord.save();

        console.log(`✅ OTP Verified: ${code}`);
        res.json({ success: true, message: 'Access Granted' });

    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// API Endpoint to search number
app.get('/api/search', async (req, res) => {
    try {
        const { number } = req.query;
        
        if (!number) {
            return res.status(400).json({ success: false, message: 'Number is required' });
        }

        console.log(`Searching for: ${number}`);
        
        // Find by phone number
        let results = await SimData.find({ phone: number });

        // If not found in local DB, fetch from External API
        if (results.length === 0) {
            console.log(`Not found locally. Fetching from external API...`);
            try {
                const extResponse = await axios.get(`https://amscript.xyz/PublicApi/Siminfo.php?number=${number}`);
                const extData = extResponse.data;
                
                let newRecords = [];

                if (extData.success && Array.isArray(extData.data)) {
                    newRecords = extData.data;
                } else if (Array.isArray(extData)) {
                    newRecords = extData;
                } else if (typeof extData === 'object' && extData !== null && extData.success !== false) {
                     // Check if it has valid data keys
                     if (extData.phone || extData.full_name) {
                         newRecords = [extData];
                     }
                }

                if (newRecords.length > 0) {
                    // Save to Local DB
                    for (const record of newRecords) {
                        const newEntry = new SimData({
                            phone: record.phone || number,
                            full_name: record.full_name || 'Unknown',
                            cnic: record.cnic || 'N/A',
                            address: record.address || 'N/A',
                            network: record.network || 'Unknown'
                        });
                        await newEntry.save();
                        results.push(newEntry);
                    }
                    console.log(`✅ Fetched and SAVED ${newRecords.length} records to Local DB.`);
                } else {
                    console.log(`⚠️ External API returned NO DATA for ${number}. Nothing to save.`);
                }
            } catch (apiError) {
                console.error('External API Error:', apiError.message);
            }
        }

        if (results.length > 0) {
            res.json({ success: true, data: results });
        } else {
            res.json({ success: false, message: 'No record found', data: [] });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
