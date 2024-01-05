const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import CORS module
const bodyParser = require('body-parser');

const mysql = require('mysql');
const AWS = require('aws-sdk');

const app = express();
const port = 3001;

// Use CORS middleware (allows requests from all origins)
app.use(cors());

app.use(bodyParser.json());

// Data base connnections
let currentConnection;
let isConnected = false;

function createConnection(host) {
    return mysql.createConnection({
        host: host,
        user: 'username', // replace with your MySQL user
        password: 'password', // replace with your MySQL password
        database: 'AlightDisasterRecoveryDemo', // replace with your database name
    });
}

function connectToDatabase(host) {
    if (currentConnection) {
        currentConnection.end();
    }

    currentConnection = createConnection(host);
    currentConnection.connect((err) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            isConnected = false;
        } else {
            console.log('Successfully connected to the database.');
            isConnected = true;
        }
    });
}

// Initial connection
connectToDatabase('terraform-20240103231930802400000001.cvvc7ctpc6j4.us-east-1.rds.amazonaws.com');

// Endpoint to change host and reconnect
app.post('/change-host', (req, res) => {
    const newHost = req.body.host;
    if (!newHost) {
        return res.status(400).send('Host is required');
    }

    try {
        connectToDatabase(newHost);
        res.send(`Reconnected to new host: ${newHost}`);
    } catch (error) {
        res.status(500).send(`Error reconnecting: ${error.message}`);
    }
});

app.get('/connection-details', (req, res) => {
    res.json({
        host: currentConnection.config.host,
        status: isConnected ? 'Connected' : 'Not connected',
    });
});

// List RDS in Region
app.get('/list-rds-instances', async (req, res) => {
    const region = req.query.region || 'us-east-1'; // Default to 'us-east-1' if not specified

    AWS.config.update({ region }); // Update AWS config with the specified region

    const rds = new AWS.RDS();

    try {
        const data = await rds.describeDBInstances().promise();
        res.json(data.DBInstances);
    } catch (err) {
        console.error('Error listing RDS instances in region', region, ':', err);
        res.status(500).send(err.message);
    }
});

// MYSQL API endpoints
// Create (POST) - Add a new user
app.post('/users', (req, res) => {
    let user = req.body;
    let sql = 'INSERT INTO users SET ?';
    currentConnection.query(sql, user, (err, result) => {
        if (err) throw err;
        res.send('User added successfully!');
    });
});

// Read (GET) - Get all users
app.get('/users', (req, res) => {
    let sql = 'SELECT * FROM users';
    currentConnection.query(sql, (err, results) => {
        if (err) throw err;
        res.send(results);
    });
});

// Update (PUT) - Update a user
app.put('/users/:id', (req, res) => {
    let userId = req.params.id;
    let user = req.body;
    let sql = `UPDATE users SET ? WHERE id = ${userId}`;
    currentConnection.query(sql, user, (err, result) => {
        if (err) throw err;
        res.send('User updated successfully!');
    });
});

// Delete (DELETE) - Delete a user
app.delete('/users/:id', (req, res) => {
    let userId = req.params.id;
    let sql = `DELETE FROM users WHERE id = ${userId}`;
    currentConnection.query(sql, (err, result) => {
        if (err) throw err;
        res.send('User deleted successfully!');
    });
});

// Health check route
app.get('/', (req, res) => {
    res.status(200).send('Express app is running!');
});

app.get('/api/region', async (req, res) => {
    try {
        const response = await fetchRegion();
        res.send(response);
    } catch (error) {
        // Check if the error is due to a network issue or unavailable metadata
        if (error.response === undefined || error.response.status === 404) {
            res.status(200).send('Running locally');
        } else {
            res.status(500).send('Error fetching region');
        }
    }
});

async function fetchRegion() {
    try {
        // Request a token
        const tokenResponse = await axios.put('http://169.254.169.254/latest/api/token', null, {
            headers: {
                'X-aws-ec2-metadata-token-ttl-seconds': '21600',
            },
        });

        const token = tokenResponse.data;

        // Use the token to request the availability zone
        const azResponse = await axios.get(
            'http://169.254.169.254/latest/meta-data/placement/availability-zone',
            {
                headers: {
                    'X-aws-ec2-metadata-token': token,
                },
            },
        );

        const region = azResponse.data.slice(0, -1);
        return region;
    } catch (error) {
        throw error;
    }
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
