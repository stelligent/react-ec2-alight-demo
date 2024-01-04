const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import CORS module
const app = express();
const port = 3001;

// Use CORS middleware (allows requests from all origins)
app.use(cors());

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
        'X-aws-ec2-metadata-token-ttl-seconds': '21600'
      }
    });

    const token = tokenResponse.data;

    // Use the token to request the availability zone
    const azResponse = await axios.get('http://169.254.169.254/latest/meta-data/placement/availability-zone', {
      headers: {
        'X-aws-ec2-metadata-token': token
      }
    });

    const region = azResponse.data.slice(0, -1);
    return region;
  } catch (error) {
    console.error('Error fetching metadata', error);
    throw error;
  }
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});