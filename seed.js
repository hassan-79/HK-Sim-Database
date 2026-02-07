const mongoose = require('mongoose');
const SimData = require('./models/SimData');

mongoose.connect('mongodb://localhost:27017/hassan_sim_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(async () => {
    console.log('Connected to MongoDB for Seeding...');
    
    // Sample Data
    const sampleData = [
        {
            phone: '03001234567',
            full_name: 'Ali Khan',
            cnic: '35202-1234567-1',
            address: 'House #1, Street 5, Lahore',
            network: 'Jazz'
        },
        {
            phone: '03211234567',
            full_name: 'Hassan Raza',
            cnic: '42101-7654321-9',
            address: 'Flat 4, Clifton, Karachi',
            network: 'Warid'
        },
        {
            phone: '03339876543',
            full_name: 'Sara Ahmed',
            cnic: '61101-1122334-5',
            address: 'Sector F-10, Islamabad',
            network: 'Ufone'
        }
    ];

    try {
        await SimData.deleteMany({}); // Clear existing data
        console.log('Cleared existing data.');
        
        await SimData.insertMany(sampleData);
        console.log('✅ Sample data inserted successfully!');
        
    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        mongoose.disconnect();
        console.log('Disconnected.');
    }
})
.catch(err => console.error(err));
