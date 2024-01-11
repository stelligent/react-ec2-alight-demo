const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const AWS = require('aws-sdk');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

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
        host: currentConnection ? currentConnection.config.host : 'Not connected',
        status: isConnected ? 'Connected' : 'Not connected',
    });
});

app.get('/list-rds-instances', async (req, res) => {
    const region = req.query.region;
    AWS.config.update({ region });
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
async function executeQuery(sql, params = []) {
    if (!currentConnection || !isConnected) {
            console.error('Database reconnection failed:', reconnectError);
            throw new Error(
    }

    return new Promise((resolve, reject) => {
        currentConnection.query(sql, params, (err, result) => {
            if (err) {
                console.error('Database query error:', err);
                isConnected = false;
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}
app.post('/users', async (req, res) => {
    const user = req.body;
    const sql = 'INSERT INTO users SET ?';

    try {
        await executeQuery(sql, user);
        res.send('User added successfully!');
    } catch (err) {
        console.error('Error adding user:', err);
        res.status(500).send('Error adding user');
    }
});

app.get('/users', async (req, res) => {
    const sql = 'SELECT * FROM users';

    try {
        const results = await executeQuery(sql);
        res.json(results);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send('Error fetching users');
    }
});

app.put('/users/:id', async (req, res) => {
    const userId = req.params.id;
    const user = req.body;
    const sql = 'UPDATE users SET ? WHERE id = ?';

    try {
        await executeQuery(sql, [user, userId]);
        res.send('User updated successfully!');
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).send('Error updating user');
    }
});

app.delete('/users/:id', async (req, res) => {
    const userId = req.params.id;
    const sql = 'DELETE FROM users WHERE id = ?';

    try {
        await executeQuery(sql, [userId]);
        res.send('User deleted successfully!');
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).send('Error deleting user');
    }
});

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

app.get('/', (req, res) => {
    res.status(200).send('Express app is running!');
});

app.get('/api/region', async (req, res) => {
    try {
        const response = await fetchRegion();
        res.send(response);
    } catch (error) {
        if (error.response === undefined || error.response.status === 404) {
            res.status(200).send('Running locally');
        } else {
            res.status(500).send('Error fetching region');
        }
    }
});

async function fetchRegion() {
    try {
        const tokenResponse = await axios.put('http://169.254.169.254/latest/api/token', null, {
            headers: {
                'X-aws-ec2-metadata-token-ttl-seconds': '21600',
            },
        });

        const token = tokenResponse.data;

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
