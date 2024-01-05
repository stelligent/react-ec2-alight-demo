const mysql = require('mysql');
const HOST = 'terraform-20240103231930802400000001.cvvc7ctpc6j4.us-east-1.rds.amazonaws.com';

// Configure MySQL connection
const connection = mysql.createConnection({
  host: HOST,
  user: 'username',  // your mysql user
  password: 'password',  // your mysql password
  database: 'AlightDisasterRecoveryDemo'  // your database name
});
connection.connect();

const createTableQuery = `
  CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

connection.query(createTableQuery, function (error, results, fields) {
  if (error) throw error;
  console.log('Table created');
});

connection.end();