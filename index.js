const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const haversine = require('haversine-distance');
require('dotenv').config()
const app = express();
app.use(bodyParser.json());

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to MySQL');
    }
});

app.get('/',(req,res)=>{
    res.send('<h1>Hello there</h1>')
    res.end()
})

// Add School API
app.post('/addSchool', (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    // Input validation
    if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const query = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    db.query(query, [name, address, latitude, longitude], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error adding school', error: err });
        }
        res.status(201).json({ message: 'School added successfully' });
    });
});

// List Schools API
app.get('/listSchools', (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    db.query('SELECT * FROM schools', (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching schools', error: err });
        }

        const userLocation = { lat: parseFloat(latitude), lon: parseFloat(longitude) };

        // Sort schools by proximity to user's location
        const sortedSchools = results.map(school => {
            const schoolLocation = { lat: school.latitude, lon: school.longitude };
            const distance = haversine(userLocation, schoolLocation); // in meters
            return { ...school, distance };
        }).sort((a, b) => a.distance - b.distance);

        res.json(sortedSchools);
    });
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
