const mongoose = require('mongoose');

async function dbCn() {
    try {
        await mongoose.connect(process.env.MONGO_DB_URL);
        console.log('Database connected...');
    } catch (error) {
        console.log('Error connecting to database...');
    }
}

module.exports = dbCn;