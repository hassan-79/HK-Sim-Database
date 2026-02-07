const mongoose = require('mongoose');
const axios = require('axios');
const SimData = require('./models/SimData');
require('dotenv').config();

// Configuration
const START_NUMBER = 3217969800; // 0321...
const END_NUMBER = 3217969900;   // 0321...
const BATCH_SIZE = 5; // Reduced batch size to be safer
const DELAY_MS = 2000; // Increased delay to avoid rate limiting

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hassan_sim_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ Connected to MongoDB for Scraping');
    startScraping();
})
.catch(err => console.error('❌ MongoDB Connection Error:', err));

async function startScraping() {
    console.log(`🚀 Starting scraping from 0${START_NUMBER} to 0${END_NUMBER}`);
    
    let currentNumber = START_NUMBER;

    while (currentNumber <= END_NUMBER) {
        const batchPromises = [];
        
        for (let i = 0; i < BATCH_SIZE && currentNumber <= END_NUMBER; i++) {
            const formattedNumber = '0' + currentNumber;
            batchPromises.push(fetchAndSave(formattedNumber));
            currentNumber++;
        }

        try {
            await Promise.all(batchPromises);
            console.log(`Processed batch up to 0${currentNumber - 1}`);
            
            // Delay to respect API limits
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        } catch (error) {
            console.error('Batch error:', error.message);
        }
    }

    console.log('✅ Scraping Completed!');
    mongoose.disconnect();
}

async function fetchAndSave(number) {
    try {
        // Check if already exists
        const exists = await SimData.findOne({ phone: number });
        if (exists) {
            // console.log(`Skipping ${number}, already exists.`);
            return;
        }

        const apiUrl = `https://amscript.xyz/PublicApi/Siminfo.php?number=${number}`;
        const response = await axios.get(apiUrl, { timeout: 10000 });
        const data = response.data;

        // API specific validation
        let records = [];
        if (data.success && Array.isArray(data.data)) {
            records = data.data;
        } else if (Array.isArray(data)) {
            records = data;
        } else if (typeof data === 'object' && data !== null && data.success !== false) {
             // Sometimes API returns single object
             if (data.phone || data.full_name) {
                 records = [data];
             }
        }

        if (records.length > 0) {
            for (const record of records) {
                 await SimData.create({
                    phone: record.phone || number, // Use fetched phone or requested phone
                    full_name: record.full_name || 'Unknown',
                    cnic: record.cnic || 'N/A',
                    address: record.address || 'N/A',
                    network: record.network || 'Unknown'
                });
            }
            console.log(`✅ Saved data for ${number}`);
        } else {
            // console.log(`No data for ${number}`);
        }

    } catch (error) {
        // console.error(`Failed to fetch ${number}:`, error.message);
    }
}
