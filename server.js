const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors'); // Import CORS module
const app = express();
const port = 3001;

// Use CORS middleware (allows requests from all origins)
app.use(cors());

// Set up the AWS SDK
const metadataService = new AWS.MetadataService();

app.get('/api/region', (req, res) => {
  metadataService.request('/latest/meta-data/placement/availability-zone', (err, data) => {
    if (err) {
      console.error('Error fetching metadata', err);
      // Return "Running locally" if metadata is not accessible
      res.status(200).send('Running locally');
    } else {
      // The region is the availability zone minus the last character
      const region = data.slice(0, -1);
      res.send(region);
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});