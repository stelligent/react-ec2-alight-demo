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
    return new Promise((resolve, reject) => {
        // Safely end the previous connection if it exists
        if (currentConnection) {
            currentConnection.end((err) => {
                if (err) {
                    console.error('Error closing previous database connection:', err);
                }
            });
        }

        currentConnection = createConnection(host);
        currentConnection.connect((err) => {
            if (err) {
                console.error('Error connecting to the database:', err);
                isConnected = false;
                reject(err);
            } else {
                console.log('Successfully connected to the database.');
                isConnected = true;
                resolve();
            }
        });
    });
}

app.post('/change-host', async (req, res) => {
    isConnected = false;
    const newHost = req.body.host;
    if (!newHost) {
        return res.status(400).send('Host is required');
    }

    try {
        await connectToDatabase(newHost);
        res.send(`Successfully reconnected to new host: ${newHost}`);
    } catch (error) {
        console.error(`Error reconnecting to new host ${newHost}:`, error);
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
    const region = req.query.region;

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
// Utility function to ensure database connection
async function executeQuery(sql, params = []) {
    if (!isConnected) {
        console.error('Database not connected');
        throw new Error('Database not connected');
    }

    return new Promise((resolve, reject) => {
        currentConnection.query(sql, params, (err, result) => {
            if (err) {
                console.error('Database query error:', err);
                // Check if the error is due to a lost connection
                if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNREFUSED') {
                    isConnected = false;
                }
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

// Create (POST) - Add a new user
app.post('/users', async (req, res) => {
    let user = req.body;
    let sql = 'INSERT INTO users SET ?';

    try {
        await executeQuery(sql, user);
        res.send('User added successfully!');
    } catch (err) {
        console.error('Error adding user:', err);
        res.status(500).send('Error adding user');
    }
});

// Read (GET) - Get all users
app.get('/users', async (req, res) => {
    let sql = 'SELECT * FROM users';

    try {
        const results = await executeQuery(sql);
        res.send(results);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send('Error fetching users');
    }
});

// Update (PUT) - Update a user
app.put('/users/:id', async (req, res) => {
    let userId = req.params.id;
    let user = req.body;
    let sql = 'UPDATE users SET ? WHERE id = ?';

    try {
        await executeQuery(sql, [user, userId]);
        res.send('User updated successfully!');
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).send('Error updating user');
    }
});

// Delete (DELETE) - Delete a user
app.delete('/users/:id', async (req, res) => {
    let userId = req.params.id;
    let sql = 'DELETE FROM users WHERE id = ?';

    try {
        await executeQuery(sql, [userId]);
        res.send('User deleted successfully!');
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).send('Error deleting user');
    }
});

// Endpoint to create the users table
app.get('/create-users-table', async (req, res) => {
    try {
        await createDatabaseTable();
        res.send('Users table created or already exists');
    } catch (err) {
        console.error('Error creating users table:', err);
        res.status(500).send('Error creating users table');
    }
});

function createDatabaseTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL,
            email VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    return new Promise((resolve, reject) => {
        currentConnection.query(createTableQuery, (error, results, fields) => {
            if (error) {
                console.error('Error creating table:', error);
                reject(error);
            } else {
                console.log('Table created or already exists');
                resolve();
            }
        });
    });
}

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
